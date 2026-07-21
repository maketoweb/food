// Custom Push Notifications Service Worker Extension for Marketo PWA
// Loaded via workbox importScripts (generateSW strategy)

function clearAssetsCache() {
  return caches.keys().then(function(names) {
    return Promise.all(names.map(function(n) {
      if (n.includes('images') || n.includes('supabase') || n.includes('manifest')) return caches.delete(n);
    }));
  });
}

function notifyClients(type) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
    clients.forEach(function(c) { c.postMessage({ type: type }); });
  });
}

// ─── Push Notifications ───
const recentlyShown = new Map();
const DEDUP_TTL_MS = 30000;

function pruneDedupCache() {
  if (recentlyShown.size > 100) {
    const now = Date.now();
    for (const [k, t] of recentlyShown) {
      if (now - t > DEDUP_TTL_MS) recentlyShown.delete(k);
    }
  }
}

self.addEventListener('push', function(event) {
  try {
    if (!event.data) {
      console.warn('[SW Push] Evento push recibido sin payload de datos.');
      return;
    }

    const payload = event.data.json();
    console.log('[SW Push] Notificación recibida:', payload);

    const title     = payload.titulo  || payload.title  || 'Marketo Supermercado';
    const body      = payload.mensaje || payload.body   || '';
    const icon      = payload.icon   || payload.badge || '/icon-192.png';
    const badge     = '/badge.png';
    const image     = payload.imagen_url || payload.image || undefined;
    const urlToOpen = payload.link_url || payload.url || '/';
    const tag       = payload.tag || String(payload.id || Date.now());
    const soundUrl  = payload.sound_url || payload.sound || '/sounds/notification.mp3';

    const tagKey = tag;
    if (recentlyShown.has(tagKey)) {
      const elapsed = Date.now() - recentlyShown.get(tagKey);
      if (elapsed < DEDUP_TTL_MS) {
        console.log('[SW Push] Deduplicada notificación con tag:', tagKey);
        return;
      }
    }
    recentlyShown.set(tagKey, Date.now());
    pruneDedupCache();

    const options = {
      body: body,
      icon: icon,
      badge: badge,
      image: image,
      vibrate: [200, 100, 200],
      tag: tag,
      renotify: true,
      requireInteraction: true,
      silent: false,
      data: { url: urlToOpen, tag: tag, soundUrl: soundUrl },
      actions: [
        { action: 'open',  title: 'Ver Detalles' },
        { action: 'close', title: 'Cerrar' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options).then(function() {
        return self.clients
          .matchAll({ type: 'window', includeUncontrolled: true })
          .then(function(clients) {
            clients.forEach(function(client) {
              client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND', soundUrl: soundUrl });
            });
          });
      })
    );
  } catch (error) {
    console.error('[SW Push] Error procesando evento push:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  try {
    event.notification.close();
    if (event.action === 'close') return;

    const targetUrl = event.notification.data?.url || '/';
    const notifId = event.notification.data?.tag || '';

    // Track click event via fetch
    if (notifId) {
      fetch('/api/marketing/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_id: notifId,
          event_type: 'clicked',
          anonymous_id: self._anonymous_id || ''
        })
      }).catch(function() {});
    }

    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (const client of clientList) {
          if ('focus' in client) {
            if (client.navigate) client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
    );
  } catch (error) {
    console.error('[SW Push] Error en clic de notificación:', error);
  }
});

// ─── Message handler ───
self.addEventListener('message', function(event) {
  if (event.data?.type === 'PUSH_CLIENT_ERROR') {
    console.error('[SW Push] Error reportado desde el cliente:', event.data.error);
  }

  if (event.data?.type === 'SET_ANONYMOUS_ID') {
    self._anonymous_id = event.data.anonymous_id;
  }

  // Notificar actualización de config desde el admin
  if (event.data?.type === 'CONFIG_UPDATED') {
    console.log('[SW Push] Config actualizada desde el admin');
    event.waitUntil(notifyClients('CONFIG_UPDATED'));
  }

  // Limpiar caches de imágenes
  if (event.data?.type === 'CLEAR_ASSETS_CACHE') {
    console.log('[SW Push] Limpiando caches de assets...');
    event.waitUntil(
      clearAssetsCache().then(function() {
        return notifyClients('ASSETS_CACHE_CLEARED');
      })
    );
  }
});
