// Cloudflare Pages Function - Register Push Subscription
// Location: /functions/api/register-subscription.ts
// Handles POST requests to save a push subscription without requiring user login

declare const PagesFunction: any;

// CORS: Reemplazar * con tu dominio en produccion
const ALLOWED_ORIGIN = '*'; // TODO: Cambiar a dominio en produccion

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export const onRequestOptions: any = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const onRequestPost: any = async (context: any) => {
  const { request, env } = context;

  try {
    const payload = await request.json();

    // Accept { subscription } format or direct fields
    const subscription = payload.subscription || payload;

    if (!subscription || !subscription.endpoint) {
      return new Response(JSON.stringify({ error: 'Missing subscription object or endpoint' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate anonymous_id for device if not provided
    const anonymousId = payload.anonymous_id || crypto.randomUUID();
    const userPhone = payload.phone || payload.telefono || '';
    const userId = payload.user_id || null;

    // Upsert subscription - save with user_id: null for anonymous users
    const subJSON = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;

    // Primero verificar si ya existe esta suscripcion
    let existingSub: any = null;
    try {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', subJSON.endpoint)
        .single();
      existingSub = data;
    } catch (e: any) {
      // No existe - es un error "No rows found", ignorable
    }

    let dbError: any;
    if (existingSub) {
      // Actualizar si ya existe
      const updateData: any = {
        p256dh: subJSON.keys?.p256dh,
        auth_secret: subJSON.keys?.auth,
        anonymous_id: anonymousId
      };
      if (userId) updateData.user_id = userId;
      if (userPhone) updateData.destinatario_telefono = userPhone;

      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update(updateData)
        .eq('endpoint', subJSON.endpoint);
      dbError = updateError;
    } else {
      // Insertar nueva suscripcion
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          endpoint: subJSON.endpoint,
          p256dh: subJSON.keys?.p256dh,
          auth_secret: subJSON.keys?.auth,
          destinatario_telefono: userPhone || null,
          anonymous_id: anonymousId,
          created_at: new Date().toISOString()
        });
      dbError = insertError;
    }

    if (dbError) {
      return new Response(JSON.stringify({ error: 'Failed to save subscription' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Subscription saved',
      anonymous_id: anonymousId
    }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Error registering subscription'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }
};
