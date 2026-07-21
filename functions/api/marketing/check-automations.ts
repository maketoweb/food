// Cloudflare Pages Function - Check Automation Triggers
// Location: /functions/api/marketing/check-automations.ts

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

function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
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

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('enabled', true);

  if (!rules || rules.length === 0) {
    return new Response(JSON.stringify({ success: true, processed: 0 }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
  }

  const results = [];

  for (const rule of rules) {
    let eligibleUserIds: string[] = [];
    const config = rule.trigger_config;

    if (config.event === 'order.status_changed') {
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: orders } = await supabase
        .from('orders')
        .select('id, cliente_uid')
        .eq('status', config.status)
        .gte('created_at', since);

      eligibleUserIds = [...new Set(
        (orders || []).map((o: any) => o.cliente_uid).filter((uid: string) => uid && uid !== '')
      )];
    }

    if (config.event === 'segment_entry') {
      const { data: segUsers } = await supabase
        .from('customer_segments')
        .select('user_id')
        .eq('segment_key', config.segment);

      const today = new Date().toISOString().slice(0, 10);
      for (const su of segUsers || []) {
        const { count } = await supabase
          .from('automation_log')
          .select('*', { count: 'exact', head: true })
          .eq('rule_slug', rule.slug)
          .eq('user_id', su.user_id)
          .gte('created_at', today);
        if ((count || 0) < (config.daily_cap || 1)) {
          eligibleUserIds.push(su.user_id);
        }
      }
    }

    let sentCount = 0;
    for (const userId of eligibleUserIds) {
      const { data: rl } = await supabase.rpc('check_push_rate_limit', { p_user_id: userId });
      if (rl === false) {
        await supabase.from('automation_log').insert({
          rule_id: rule.id, rule_slug: rule.slug, user_id: userId,
          action_taken: 'rate_limited', status: 'rate_limited'
        });
        continue;
      }

      const since = new Date(Date.now() - (rule.cooldown_hours || 24) * 3600000).toISOString();
      const { count: recentCount } = await supabase
        .from('automation_log')
        .select('*', { count: 'exact', head: true })
        .eq('rule_slug', rule.slug)
        .eq('user_id', userId)
        .gte('created_at', since);

      if ((recentCount || 0) >= (rule.max_sends_per_user || 3)) continue;

      const { data: user } = await supabase
        .from('usuarios_clientes').select('nombre, telefono').eq('id', userId).single();

      const title = renderTemplate(rule.action_config.title_template || 'Notificacion', {
        user_name: user?.nombre || 'Cliente'
      });
      const body = renderTemplate(rule.action_config.body_template || '', {
        user_name: user?.nombre || 'Cliente'
      });

      const notifId = 'notif-auto-' + crypto.randomUUID().slice(0, 12);
      await supabase.from('notifications').insert({
        id: notifId, titulo: title, mensaje: body,
        fecha: new Date().toISOString(), tipo: 'personal',
        destinatario_telefono: user?.telefono || '',
        link_url: rule.action_config.link_url || '/', leida: false
      });

      await supabase.from('automation_log').insert({
        rule_id: rule.id, rule_slug: rule.slug, user_id: userId,
        action_taken: 'push_sent', notification_id: notifId, status: 'sent'
      });

      await supabase.rpc('increment_push_count', { p_user_id: userId });
      sentCount++;
    }

    if (eligibleUserIds.length > 0) {
      await supabase.from('automation_rules')
        .update({
          last_run_at: new Date().toISOString(),
          total_fired: (rule.total_fired || 0) + sentCount
        })
        .eq('id', rule.id);
    }

    results.push({ slug: rule.slug, eligible: eligibleUserIds.length, sent: sentCount });
  }

  return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
};

export const onRequestGet: any = async () => {
  return new Response(JSON.stringify({ status: 'ok', service: 'check-automations' }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
};
