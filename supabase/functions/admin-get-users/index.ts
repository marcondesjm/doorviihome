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

    // Create admin client to check if user is admin
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

    // Fetch user emails from auth.users first
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user emails' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Auth users count:', authUsers.users.length)

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Profiles count:', profiles?.length || 0)

    // Create a map of existing profiles by user_id
    const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || [])

    // Get all admin user IDs
    const { data: adminRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
    
    const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || [])

    // Merge auth users with profiles - include ALL auth users even if they don't have a profile
    const usersWithEmails = authUsers.users.map(authUser => {
      const profile = profilesMap.get(authUser.id)
      return {
        id: profile?.id || authUser.id,
        user_id: authUser.id,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || null,
        phone: profile?.phone || authUser.phone || null,
        avatar_url: profile?.avatar_url || null,
        is_active: profile?.is_active ?? true,
        created_at: profile?.created_at || authUser.created_at,
        updated_at: profile?.updated_at || authUser.updated_at || authUser.created_at,
        email: authUser.email || 'Email não disponível',
        is_admin: adminUserIds.has(authUser.id)
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log('Final users count:', usersWithEmails.length)

    return new Response(
      JSON.stringify({ users: usersWithEmails }),
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