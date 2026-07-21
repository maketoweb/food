// Cloudflare Pages Function - Web Push Handler
// Location: /functions/api/push-notify.ts
// Handles POST requests to send real web push notifications using web-push library

let webpush: any;

declare const PagesFunction: any;

// CORS: Reemplazar * con tu dominio en produccion
const ALLOWED_ORIGIN = '*'; // TODO: Cambiar a dominio en produccion

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-push-webhook-secret',
  'Access-Control-Max-Age': '86400',
};

export const onRequestOptions: any = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

// Constant-time string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// GET handler for diagnostics
export const onRequestGet: any = async (context: any) => {
  const { env } = context;

  return new Response(JSON.stringify({
    status: 'ok',
    service: 'push-notify',
    vapidConfigured: !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
  }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
};

export const onRequestPost: any = async (context: any) => {
  const { request, env } = context;

  // 1. Verificacion de Seguridad
  const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';

  const rawAuthHeader = request.headers.get('x-push-webhook-secret') || '';
  const authHeader = rawAuthHeader.trim();
  const configuredSecret = [env.WEBHOOK_SECRET, env.webhook_secret, env.PUSH_WEBHOOK_SECRET, env.push_webhook_secret].find(Boolean) || '';

  const hasConfiguredSecret = !!configuredSecret;
  const hasHeader = authHeader.length > 0;

  if (hasConfiguredSecret && hasHeader) {
    if (!safeCompare(authHeader, configuredSecret)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }
  }

  try {
    // 2. Extraer payload enviado por Supabase
    const payload = await request.json();

    // Handle both Supabase trigger format (with record wrapper) and direct test format
    let record = payload.record || payload;

    if (!record || typeof record !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing record in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // Support both English (title/body) and Spanish (titulo/mensaje) field names
    const titulo = record.title || record.titulo || 'Marketo';
    const mensaje = record.body || record.mensaje || '';
    const linkUrl = record.link_url || record.url || '/';

    // 3. Configurar WebPush (VAPID)
    const vapidPublic = env.VAPID_PUBLIC_KEY;
    const vapidPrivate = env.VAPID_PRIVATE_KEY;
    if (!vapidPublic || !vapidPrivate) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // Import dinamico de web-push
    if (!webpush) {
      const wpMod = await import('web-push');
      webpush = (wpMod as any).default || wpMod;
    }

    webpush.setVapidDetails(
      'mailto:admin@marketo.com.ve',
      vapidPublic,
      vapidPrivate
    );

    // 4. Conectar con Supabase
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Filtrar destinatarios segun tipo
    const tipo = record.tipo;
    const destinatarioTelefono = record.destinatario_telefono;

    // Obtener suscripciones directamente de la tabla (evitar RPC con permisos restrictivos)
    let subscriptionsRaw: any[] = [];
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh, auth_secret, destinatario_telefono, anonymous_id');
      if (error) {
        console.error('[push-notify] Error fetching subscriptions:', error.message);
        return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions: ' + error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
      subscriptionsRaw = data || [];
    } catch (e: any) {
      console.error('[push-notify] Exception fetching subscriptions:', e?.message || e);
      return new Response(JSON.stringify({ error: 'Exception fetching subscriptions' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // Aplicar filtro por telefono/destinatario despues de obtenerlas
    if (tipo === 'personal' || tipo === 'admin') {
      const phone = (destinatarioTelefono || '').trim();
      if (phone) {
        subscriptionsRaw = subscriptionsRaw.filter((s: any) =>
          (s.destinatario_telefono || '').trim() === phone
        );
      }
      // Si no hay telefono o no matchea, no enviar nada (evita enviar a todos por error)
    }

    const validSubscriptions = subscriptionsRaw
      .map((s: any) => ({
        endpoint: s.endpoint,
        keys: {
          p256dh: s.p256dh,
          auth: s.auth_secret
        },
        _meta: { id: s.id, user_id: s.user_id, anonymous_id: s.anonymous_id }
      }))
      .filter((sub: any) => sub.endpoint && sub.keys.p256dh && sub.keys.auth);

    const invalidCount = subscriptionsRaw.length - validSubscriptions.length;
    if (!validSubscriptions.length) {
      return new Response(JSON.stringify({
        success: true,
        sent: 0,
        total: 0,
        invalidSubscriptions: invalidCount,
        notif_id: record.id,
        message: 'No valid push subscriptions found'
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    // 5. Payload Web Push - usar tag consistente con 'foodpop-' prefix
    const notifId = record.id || ('notif-' + crypto.randomUUID().slice(0, 12));
    const payloadForSW = {
      title: titulo,
      body: mensaje,
      link_url: linkUrl,
      tag: 'foodpop-' + notifId,
      id: notifId,
      requireInteraction: false,
      silent: false,
    };

    // 6. Enviar a cada suscripcion en paralelo
    const results = await Promise.all(
      validSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub as any, JSON.stringify(payloadForSW));

          // Track successful send
          try {
            await supabase.from('push_events').insert({
              notification_id: notifId,
              user_id: sub._meta?.user_id || null,
              anonymous_id: sub._meta?.anonymous_id || '',
              event_type: 'sent'
            });
          } catch (trackErr) {
            console.error('[push-notify] Failed to track sent event:', trackErr);
          }

          return { ok: true, endpoint: sub.endpoint };
        } catch (err: any) {
          // Remove invalid subscriptions (404 = subscription expired, 410 = gone)
          if (err.statusCode === 404 || err.statusCode === 410) {
            try {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint);
            } catch (delErr) {
              console.error('[push-notify] Failed to delete expired subscription:', delErr);
            }
          }
          return {
            ok: false,
            endpoint: sub.endpoint,
            statusCode: err?.statusCode
          };
        }
      })
    );

    const sent = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok);

    return new Response(JSON.stringify({
      success: true,
      sent,
      failed: failed.length,
      total: validSubscriptions.length,
      invalidSubscriptions: invalidCount,
      notif_id: notifId
    }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });

  } catch (error: any) {
    console.error('[push-notify] Unhandled error:', error?.message || error);
    return new Response(JSON.stringify({
      error: 'Error processing push notification'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }
};
