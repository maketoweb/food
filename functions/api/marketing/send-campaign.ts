// Cloudflare Pages Function - Send Scheduled Campaigns
// Location: /functions/api/marketing/send-campaign.ts

declare const PagesFunction: any;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-push-webhook-secret',
  'Access-Control-Max-Age': '86400',
};

export const onRequestOptions: any = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export const onRequestPost: any = async (context: any) => {
  const { request, env } = context;

  const rawAuthHeader = request.headers.get('x-push-webhook-secret') || '';
  const authHeader = rawAuthHeader.trim();
  const configuredSecret = [env.WEBHOOK_SECRET, env.webhook_secret, env.PUSH_WEBHOOK_SECRET, env.push_webhook_secret].find(Boolean) || '';

  if (configuredSecret && authHeader) {
    if (!safeCompare(authHeader, configuredSecret)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('schedule_at', new Date().toISOString());

  let processed = 0;
  for (const campaign of campaigns || []) {
    await supabase.from('campaigns').update({ status: 'sending' }).eq('id', campaign.id);

    let targetUserIds: string[] = [];
    if (campaign.segment_filter === 'all') {
      const { data: subs } = await supabase.rpc('get_all_push_subscriptions');
      targetUserIds = [...new Set((subs || []).map((s: any) => s.user_id as string).filter((uid: string) => uid))] as string[];
    } else {
      const { data: segUsers } = await supabase
        .from('customer_segments')
        .select('user_id')
        .eq('segment_key', campaign.segment_filter);
      targetUserIds = (segUsers || []).map((s: any) => s.user_id as string);
    }

    let sentCount = 0;
    let rateLimitedCount = 0;

    for (const userId of targetUserIds) {
      const { data: allowed } = await supabase.rpc('check_push_rate_limit', { p_user_id: userId });
      if (allowed === false) {
        rateLimitedCount++;
        continue;
      }

      const { data: user } = await supabase
        .from('usuarios_clientes').select('telefono, nombre').eq('id', userId).single();

      const notifId = 'notif-campaign-' + crypto.randomUUID().slice(0, 12);
      await supabase.from('notifications').insert({
        id: notifId, titulo: campaign.title, mensaje: campaign.body,
        fecha: new Date().toISOString(), tipo: 'personal',
        destinatario_telefono: user?.telefono || '',
        imagen_url: campaign.image_url || '',
        link_url: campaign.link_url || '/', leida: false
      });

      await supabase.from('push_events').insert({
        notification_id: notifId, campaign_id: campaign.id,
        user_id: userId, event_type: 'sent'
      });

      await supabase.rpc('increment_push_count', { p_user_id: userId });
      sentCount++;
    }

    await supabase.from('campaigns').update({
      status: 'sent', sent_at: new Date().toISOString(),
      total_recipients: targetUserIds.length,
      total_sent: sentCount,
      total_rate_limited: rateLimitedCount
    }).eq('id', campaign.id);

    processed++;
  }

  return new Response(JSON.stringify({ success: true, campaigns_processed: processed }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
};

export const onRequestGet: any = async () => {
  return new Response(JSON.stringify({ status: 'ok', service: 'send-campaign' }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
};
