// Custom Push Notifications Service Worker Extension for Marketo PWA
// Loaded via workbox importScripts (generateSW strategy)

// ─── IndexedDB helpers para logo_url ───
const DB_NAME = 'foodapp-pwa';
const DB_VERSION = 1;
const STORE_NAME = 'config';

function openDB() {
  return new Promise(function(resolve, reject) {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function(e) {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = function(e) { resolve(e.target.result); };
    req.onerror = function(e) { reject(e.target.error); };
  });
}

function getLogoUrl() {
  return openDB().then(function(db) {
    return new Promise(function(resolve) {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('logo_url');
      req.onsuccess = function() { resolve(req.result || null); };
      req.onerror = function() { resolve(null); };
    });
  });
}

function setLogoUrl(url) {
  return openDB().then(function(db) {
    return new Promise(function(resolve) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(url, 'logo_url');
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { resolve(); };
    });
  });
}

function getPwaIconUrl() {
  return openDB().then(function(db) {
    return new Promise(function(resolve) {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('pwa_icon_url');
      req.onsuccess = function() { resolve(req.result || null); };
      req.onerror = function() { resolve(null); };
    });
  });
}

function setPwaIconUrl(url) {
  return openDB().then(function(db) {
    return new Promise(function(resolve) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(url, 'pwa_icon_url');
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { resolve(); };
    });
  });
}

function getSiteName() {
  return openDB().then(function(db) {
    return new Promise(function(resolve) {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('site_name');
      req.onsuccess = function() { resolve(req.result || null); };
      req.onerror = function() { resolve(null); };
    });
  });
}

function setSiteName(name) {
  return openDB().then(function(db) {
    return new Promise(function(resolve) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(name, 'site_name');
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { resolve(); };
    });
  });
}

function getThemeColor() {
  return openDB().then(function(db) {
    return new Promise(function(resolve) {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('theme_color');
      req.onsuccess = function() { resolve(req.result || null); };
      req.onerror = function() { resolve(null); };
    });
  });
}

function setThemeColor(color) {
  return openDB().then(function(db) {
    return new Promise(function(resolve) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(color, 'theme_color');
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { resolve(); };
    });
  });
}

function clearManifestCache() {
  return caches.keys().then(function(names) {
    return Promise.all(names.map(function(n) {
      if (n.includes('manifest')) return caches.delete(n);
    }));
  });
}

function notifyClients(type) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
    clients.forEach(function(c) { c.postMessage({ type: type }); });
  });
}

// ─── Manifest helpers: detectar si el cliente está en /admin ───
function isClientAdmin(clientUrl) {
  try {
    var pathname = new URL(clientUrl).pathname;
    return pathname.startsWith('/admin');
  } catch(e) {
    return false;
  }
}

function getClientUrl(event) {
  if (event.clientId) {
    return self.clients.get(event.clientId).then(function(client) {
      return client ? client.url : '';
    });
  }
  // Fallback: buscar entre todos los clientes controlados
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
    for (var i = 0; i < clients.length; i++) {
      if (clients[i].visibilityState === 'visible') return clients[i].url;
    }
    return clients.length > 0 ? clients[0].url : '';
  });
}

function applyDynamicCustomization(manifest, logoUrl, pwaIconUrl, siteName, themeColor, isAdmin) {
  var iconForManifest = pwaIconUrl || logoUrl;
  if (iconForManifest) {
    manifest.icons = [
      { src: iconForManifest, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: iconForManifest, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: iconForManifest, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ];
  }
  if (isAdmin) {
    manifest.name = (siteName || 'FoodPop') + ' Admin Panel';
    manifest.short_name = (siteName || 'FoodPop') + ' Admin';
    manifest.description = 'Panel de administración de ' + (siteName || 'FoodPop') + '. Gestiona pedidos, productos y más.';
    manifest.start_url = '/admin';
    manifest.scope = '/admin';
    manifest.categories = ['business', 'productivity'];
    manifest.shortcuts = [
      { name: 'Dashboard', short_name: 'Dashboard', url: '/admin', description: 'Panel principal con métricas' },
      { name: 'Órdenes', short_name: 'Órdenes', url: '/admin', description: 'Gestionar pedidos activos' },
      { name: 'Productos', short_name: 'Productos', url: '/admin', description: 'Administrar catálogo' }
    ];
  } else {
    manifest.name = (siteName || 'FoodPop') + ' - Delivery de Comida Premium';
    manifest.short_name = siteName || 'FoodPop';
    manifest.description = 'Tu restaurante favorito con delivery express.';
    manifest.start_url = '/';
    manifest.scope = '/';
    manifest.categories = ['food', 'restaurants'];
    manifest.shortcuts = [
      { name: 'Hacer Pedido', short_name: 'Pedir', url: '/catalog', description: 'Ver catálogo y hacer pedido', icons: [{ src: iconForManifest || 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Mis Pedidos', short_name: 'Pedidos', url: '/profile', description: 'Historial de pedidos', icons: [{ src: iconForManifest || 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Carrito', short_name: 'Carrito', url: '/cart', description: 'Ver carrito de compras', icons: [{ src: iconForManifest || 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }] }
    ];
  }
  if (themeColor) {
    manifest.theme_color = themeColor;
    manifest.background_color = themeColor;
  }
  return manifest;
}

// ─── Intercept manifest.json y manifest-admin.json ───
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  var isManifestRequest = url.pathname === '/manifest.json' ||
                          url.pathname === '/manifest.webmanifest' ||
                          url.pathname === '/manifest-admin.json';

  if (!isManifestRequest) return;

  event.respondWith(
    Promise.all([
      getLogoUrl(), getPwaIconUrl(), getSiteName(), getThemeColor(),
      getClientUrl(event)
    ]).then(function(results) {
      var logoUrl = results[0];
      var pwaIconUrl = results[1];
      var siteName = results[2];
      var themeColor = results[3];
      var clientUrl = results[4];

      var isAdminClient = isClientAdmin(clientUrl) || url.pathname === '/manifest-admin.json';
      var manifestFile = isAdminClient ? '/manifest-admin.json' : '/manifest.json';

      // Si no hay customización dinámica y el archivo solicitado coincide, servir tal cual
      var noDynamic = !logoUrl && !pwaIconUrl && !siteName && !themeColor;
      var requestingCorrect = (isAdminClient && url.pathname === '/manifest-admin.json') ||
                              (!isAdminClient && (url.pathname === '/manifest.json' || url.pathname === '/manifest.webmanifest'));
      if (noDynamic && requestingCorrect) {
        return fetch(event.request);
      }

      // Fetch el manifest base correcto y aplicar customización dinámica
      return fetch(manifestFile).then(function(response) {
        return response.clone().json().then(function(manifest) {
          manifest = applyDynamicCustomization(manifest, logoUrl, pwaIconUrl, siteName, themeColor, isAdminClient);
          return new Response(JSON.stringify(manifest), {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      }).catch(function() {
        // Fallback: servir el manifest original solicitado
        return fetch(event.request);
      });
    })
  );
});

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

  // Guardar logo_url en IndexedDB (solo si cambió)
  if (event.data?.type === 'UPDATE_LOGO_URL') {
    event.waitUntil(
      getLogoUrl().then(function(current) {
        if (current === event.data.logoUrl) return;
        console.log('[SW Push] Actualizando logo_url en IndexedDB:', event.data.logoUrl);
        return setLogoUrl(event.data.logoUrl).then(function() {
          return clearManifestCache();
        }).then(function() {
          return notifyClients('LOGO_URL_UPDATED');
        });
      })
    );
  }

  // Guardar pwa_icon_url en IndexedDB (solo si cambió)
  if (event.data?.type === 'UPDATE_PWA_ICON') {
    event.waitUntil(
      getPwaIconUrl().then(function(current) {
        if (current === event.data.pwaIconUrl) return;
        console.log('[SW Push] Actualizando pwa_icon_url en IndexedDB:', event.data.pwaIconUrl);
        return setPwaIconUrl(event.data.pwaIconUrl).then(function() {
          return clearManifestCache();
        }).then(function() {
          return notifyClients('PWA_ICON_UPDATED');
        });
      })
    );
  }

  // Guardar site_name en IndexedDB (solo si cambió)
  if (event.data?.type === 'UPDATE_SITE_NAME') {
    event.waitUntil(
      getSiteName().then(function(current) {
        if (current === event.data.siteName) return;
        console.log('[SW Push] Actualizando site_name en IndexedDB:', event.data.siteName);
        return setSiteName(event.data.siteName).then(function() {
          return clearManifestCache();
        }).then(function() {
          return notifyClients('SITE_NAME_UPDATED');
        });
      })
    );
  }

  // Guardar theme_color en IndexedDB (solo si cambió)
  if (event.data?.type === 'UPDATE_THEME_COLOR') {
    event.waitUntil(
      getThemeColor().then(function(current) {
        if (current === event.data.themeColor) return;
        console.log('[SW Push] Actualizando theme_color en IndexedDB:', event.data.themeColor);
        return setThemeColor(event.data.themeColor).then(function() {
          return clearManifestCache();
        }).then(function() {
          return notifyClients('THEME_COLOR_UPDATED');
        });
      })
    );
  }

  // Limpiar caches de imágenes
  if (event.data?.type === 'CLEAR_ASSETS_CACHE') {
    console.log('[SW Push] Limpiando caches de assets...');
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(name) {
            if (name.includes('images') || name.includes('supabase') || name.includes('manifest')) {
              console.log('[SW Push] Borrando cache:', name);
              return caches.delete(name);
            }
          })
        );
      }).then(function() {
        return notifyClients('ASSETS_CACHE_CLEARED');
      })
    );
  }
});
