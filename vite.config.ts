import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'sounds/notification.mp3', 'manifest-admin.json'],
        manifest: {
          name: 'FoodPop - Delivery de Comida Premium',
          short_name: 'FoodPop',
          description: 'Tu restaurante favorito con delivery express. Hamburguesas, pastas, postres y más.',
          scope: '/',
          start_url: '/',
          theme_color: '#FF6B35',
          background_color: '#FFFFFF',
          display: 'standalone',
          orientation: 'portrait',
          prefer_related_applications: false,
          shortcuts: [
            {
              name: 'Hacer Pedido',
              short_name: 'Pedir',
              description: 'Ver el catálogo y hacer un pedido',
              url: '/catalog',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
            },
            {
              name: 'Mis Pedidos',
              short_name: 'Pedidos',
              description: 'Ver el historial de pedidos',
              url: '/profile',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
            },
            {
              name: 'Carrito',
              short_name: 'Carrito',
              description: 'Ver el carrito de compras',
              url: '/cart',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
            }
          ],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          importScripts: ['/sw-push.js'],
          navigateFallback: '/offline.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/admin\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-storage-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
                networkTimeoutSeconds: 5,
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|webp|svg|ico)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\.(?:mp3|wav|ogg)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'audio-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Shim to satisfy Recharts -> react-is dependency when it's missing
        'react-is': path.resolve(__dirname, './src/shims/react-is.ts'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Librerías externas — separarlas en chunks específicos
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/@supabase') || id.includes('node_modules/websocket') || id.includes('/store/supabaseClient')) {
              return 'vendor-supabase';
            }
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) {
              return 'vendor-recharts';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-lucide';
            }
            // Páginas admin (cargadas solo por el administrador)
            if (id.includes('/pages/AdminDashboard') || id.includes('/pages/AdminOrders') || id.includes('/pages/AdminProducts') || id.includes('/pages/AdminUsers') || id.includes('/pages/AdminCoupons') || id.includes('/pages/AdminNotifications') || id.includes('/pages/AdminConfig')) {
              return 'pages-admin';
            }
            // Componentes de edición (formularios pesados)
            if (id.includes('/components/EditProductForm') || id.includes('/components/AddProductForm')) {
              return 'components-edit';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
