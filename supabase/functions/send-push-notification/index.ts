import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const rawData = atob(paddedBase64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Convert Uint8Array to base64url
function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Generate ECDH keys for encryption
async function generateECDHKeys() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  return {
    publicKey: new Uint8Array(publicKeyBuffer),
    keyPair
  };
}

// Derive encryption key using ECDH
async function deriveKey(
  privateKey: CryptoKey,
  publicKeyBytes: Uint8Array
): Promise<CryptoKey> {
  const publicKey = await crypto.subtle.importKey(
    'raw',
    publicKeyBytes.buffer as ArrayBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  );
  
  return crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveBits', 'deriveKey']
  );
}

// HKDF function
async function hkdf(
  salt: Uint8Array,
  ikm: CryptoKey,
  info: Uint8Array,
  length: number
): Promise<ArrayBuffer> {
  return crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt.buffer as ArrayBuffer,
      info: info.buffer as ArrayBuffer,
    },
    ikm,
    length * 8
  );
}

// Create info for HKDF
function createInfo(type: string, context: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(type);
  const result = new Uint8Array(typeBytes.length + 1 + context.length);
  result.set(typeBytes, 0);
  result.set([0], typeBytes.length);
  result.set(context, typeBytes.length + 1);
  return result;
}

// Encrypt payload using Web Push encryption (RFC 8291)
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);
  
  // Generate local ECDH key pair
  const { publicKey: localPublicKey, keyPair } = await generateECDHKeys();
  
  // Decode subscription keys
  const clientPublicKey = base64UrlToUint8Array(p256dh);
  const clientAuth = base64UrlToUint8Array(auth);
  
  // Derive shared secret
  const sharedSecretKey = await deriveKey(keyPair.privateKey, clientPublicKey);
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Create context for key derivation (RFC 8291)
  const context = new Uint8Array(1 + 2 + 65 + 2 + 65);
  let offset = 0;
  context[offset++] = 0; // null byte
  context[offset++] = 0; // length high byte
  context[offset++] = 65; // length low byte (65 bytes for P-256 public key)
  context.set(clientPublicKey, offset);
  offset += 65;
  context[offset++] = 0; // length high byte
  context[offset++] = 65; // length low byte
  context.set(localPublicKey, offset);
  
  // Derive IKM using PRK
  const authInfo = encoder.encode('Content-Encoding: auth\0');
  const prkBuffer = await hkdf(clientAuth, sharedSecretKey, authInfo, 32);
  const prk = await crypto.subtle.importKey('raw', prkBuffer, { name: 'HKDF' }, false, ['deriveBits']);
  
  // Derive CEK (Content Encryption Key)
  const cekInfo = createInfo('Content-Encoding: aes128gcm', context);
  const cekBuffer = await hkdf(salt, prk, cekInfo, 16);
  const cek = await crypto.subtle.importKey('raw', cekBuffer, { name: 'AES-GCM' }, false, ['encrypt']);
  
  // Derive nonce
  const nonceInfo = createInfo('Content-Encoding: nonce', context);
  const nonceBuffer = await hkdf(salt, prk, nonceInfo, 12);
  const nonce = new Uint8Array(nonceBuffer);
  
  // Add padding (RFC 8291)
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload[0] = 2; // padding delimiter
  paddedPayload.set(payloadBytes, 1);
  
  // Encrypt
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    cek,
    paddedPayload
  );
  
  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    salt,
    localPublicKey
  };
}

// Build the aes128gcm content encoding header
function buildAes128gcmHeader(salt: Uint8Array, localPublicKey: Uint8Array): Uint8Array {
  const header = new Uint8Array(86);
  header.set(salt, 0); // 16 bytes salt
  // Record size: 4096 bytes (0x00001000 in big-endian)
  header[16] = 0x00;
  header[17] = 0x00;
  header[18] = 0x10;
  header[19] = 0x00;
  header[20] = 65; // public key length
  header.set(localPublicKey, 21); // 65 bytes public key
  return header;
}

// Create VAPID JWT
async function createVapidJwt(
  audience: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: 'mailto:porteirovirtual@app.com',
  };

  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // The vapidPrivateKey is 32 bytes (d coordinate)
  // The vapidPublicKey is 65 bytes (uncompressed point: 04 || x || y)
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);
  
  // Extract x and y from uncompressed public key (skip 04 prefix)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  
  // Create JWK for the private key
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: uint8ArrayToBase64Url(x),
    y: uint8ArrayToBase64Url(y),
    d: uint8ArrayToBase64Url(privateKeyBytes),
  };

  // Import private key using JWK format
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(unsignedToken)
  );

  // Convert DER signature to raw format (R || S, each 32 bytes)
  const signature = new Uint8Array(signatureBuffer);
  const signatureB64 = uint8ArrayToBase64Url(signature);

  return `${unsignedToken}.${signatureB64}`;
}

// Send Web Push notification
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  // Encrypt the payload
  const { ciphertext, salt, localPublicKey } = await encryptPayload(
    payload,
    subscription.keys.p256dh,
    subscription.keys.auth
  );

  // Build the body with aes128gcm header
  const header = buildAes128gcmHeader(salt, localPublicKey);
  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header, 0);
  body.set(ciphertext, header.length);

  // Create VAPID JWT
  const jwt = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey);

  // Send the request with high priority headers
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Urgency': 'high', // High priority for immediate delivery
      'Topic': 'doorbell', // Topic for notification grouping
      'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
    },
    body: body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Push failed: ${response.status} ${text}`);
  }

  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, body, data } = await req.json();
    
    console.log('Sending push notification to user:', userId);
    console.log('Notification:', { title, body, data });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get VAPID keys
    const { data: vapidKeys, error: vapidError } = await supabase
      .from('vapid_keys')
      .select('*')
      .limit(1)
      .single();

    if (vapidError || !vapidKeys) {
      console.error('VAPID keys not found:', vapidError);
      throw new Error('VAPID keys not configured');
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user');
      return new Response(
        JSON.stringify({ success: false, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data,
    });

    const results: Array<{ endpoint: string; success: boolean; error?: string }> = [];
    for (const sub of subscriptions) {
      try {
        await sendWebPush(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
          vapidKeys.public_key,
          vapidKeys.private_key
        );
        results.push({ endpoint: sub.endpoint, success: true });
        console.log('Push sent successfully to:', sub.endpoint);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error sending push to:', sub.endpoint, err);
        results.push({ endpoint: sub.endpoint, success: false, error: errorMessage });
        
        // Remove invalid subscriptions
        if (errorMessage.includes('410') || errorMessage.includes('404')) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
          console.log('Removed invalid subscription:', sub.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
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
