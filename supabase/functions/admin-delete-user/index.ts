import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to verify authentication
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabaseAdmin
      .rpc('is_admin', { _user_id: user.id })

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin only.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if target user is an admin - prevent deleting admins
    const { data: targetIsAdmin } = await supabaseAdmin
      .rpc('is_admin', { _user_id: userId })

    if (targetIsAdmin) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete an admin account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete related data first to avoid foreign key constraints
    console.log('Deleting related data for user:', userId)
    
    // Delete push_subscriptions
    await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', userId)
    
    // Delete video_calls (where user is owner)
    await supabaseAdmin.from('video_calls').delete().eq('owner_id', userId)
    
    // Delete activity_logs
    await supabaseAdmin.from('activity_logs').delete().eq('user_id', userId)
    
    // Delete access_codes
    await supabaseAdmin.from('access_codes').delete().eq('user_id', userId)
    
    // Delete delivery_icons
    await supabaseAdmin.from('delivery_icons').delete().eq('user_id', userId)
    
    // Delete property_members (where user is member or invited_by)
    await supabaseAdmin.from('property_members').delete().eq('user_id', userId)
    await supabaseAdmin.from('property_members').delete().eq('invited_by', userId)
    
    // Get user's properties to delete related data
    const { data: userProperties } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('user_id', userId)
    
    if (userProperties && userProperties.length > 0) {
      const propertyIds = userProperties.map(p => p.id)
      
      // Delete property_invite_codes for user's properties
      await supabaseAdmin.from('property_invite_codes').delete().in('property_id', propertyIds)
      
      // Delete property_members for user's properties
      await supabaseAdmin.from('property_members').delete().in('property_id', propertyIds)
      
      // Delete video_calls for user's properties
      await supabaseAdmin.from('video_calls').delete().in('property_id', propertyIds)
      
      // Delete activity_logs for user's properties
      await supabaseAdmin.from('activity_logs').delete().in('property_id', propertyIds)
      
      // Delete access_codes for user's properties
      await supabaseAdmin.from('access_codes').delete().in('property_id', propertyIds)
    }
    
    // Delete properties
    await supabaseAdmin.from('properties').delete().eq('user_id', userId)
    
    // Delete user_roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId)
    
    // Delete profile
    await supabaseAdmin.from('profiles').delete().eq('user_id', userId)
    
    console.log('All related data deleted, now deleting auth user')

    // Delete the user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user: ' + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('User deleted successfully:', userId)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})