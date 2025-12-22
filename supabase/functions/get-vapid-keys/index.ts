import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate VAPID keys using Web Crypto API
async function generateVapidKeys() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  
  const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  const privateKey = privateKeyJwk.d || '';

  return { publicKey, privateKey };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Getting VAPID keys...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if keys already exist
    const { data: existingKeys } = await supabase
      .from('vapid_keys')
      .select('*')
      .limit(1)
      .single();

    if (existingKeys) {
      console.log('Returning existing VAPID public key');
      return new Response(
        JSON.stringify({ publicKey: existingKeys.public_key }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new keys if none exist
    console.log('Generating new VAPID keys...');
    const { publicKey, privateKey } = await generateVapidKeys();

    const { error: insertError } = await supabase
      .from('vapid_keys')
      .insert({
        public_key: publicKey,
        private_key: privateKey,
      });

    if (insertError) {
      console.error('Error saving VAPID keys:', insertError);
      throw insertError;
    }

    console.log('VAPID keys generated and saved successfully');
    return new Response(
      JSON.stringify({ publicKey }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
