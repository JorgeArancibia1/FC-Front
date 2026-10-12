import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': el SW nuevo queda en "waiting" y lo avisa main.tsx con un
      // toast, para no recargar en contra de la voluntad del usuario.
      registerType: 'prompt',
      // El registro se hace a mano en main.tsx vía `virtual:pwa-register`.
      injectRegister: false,
      // Los iconos del manifest se sirven de la red en el momento de instalar;
      // no hace falta precachearlos (~900 KB de PNG que solo pesan el install).
      includeManifestIcons: false,
      includeAssets: [
        'favicon.ico',
        'icons.svg',
      ],
      manifest: {
        name: 'Gol FC',
        short_name: 'GFC',
        description: 'Inscripción a partidos del club Gol FC',
        theme_color: '#0b1f16',
        background_color: '#0b1f16',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/favicon.ico', type: 'image/x-icon', sizes: '16x16 32x32' },
          { src: '/icon-192.png', type: 'image/png', sizes: '192x192' },
          { src: '/icon-512.png', type: 'image/png', sizes: '512x512' },
          { src: '/icon-192-maskable.png', type: 'image/png', sizes: '192x192', purpose: 'maskable' },
          { src: '/icon-512-maskable.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
        ],
      },
      workbox: {
        // js/css/html/svg/ico sí; los PNG son solo iconos de manifest/install
        // y se piden a la red en el momento de instalar (y globIgnores de abajo
        // los deja afuera aunque alguien vuelva a agregar 'png' al patrón).
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
        globIgnores: ['**/icon-512*.png', '**/apple-touch-icon.png'],
        // Modo prompt: el SW nuevo NO se salta la fase de espera solo; espera
        // el SKIP_WAITING que manda main.tsx cuando el usuario acepta recargar.
        skipWaiting: false,
        // Al activarse, el SW nuevo toma el control de la pestaña abierta
        // (controllerchange) y workbox-window dispara la recarga automática.
        clientsClaim: true,
        runtimeCaching: [
          {
            // Fotos de jugadores subidas al backend. CacheFirst porque las URLs
            // llevan UUID y son inmutables — si cambia la foto cambia la URL.
            urlPattern: ({ url }) => url.pathname.startsWith('/uploads/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'player-photos',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 días
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Llamadas GET al API: NetworkFirst con fallback a cache para que
            // la app abra aunque no haya red (datos podrían ser un poco viejos).
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-get',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Hoja de CSS de Google Fonts (Bebas Neue / Permanent Marker):
            // StaleWhileRevalidate la sirve del cache sin bloquear el render y
            // la refresca cuando hay red. Ojo: un string como urlPattern
            // workbox lo toma como match EXACTO, por eso va con función.
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Los .woff2 de fonts.gstatic.com tienen hash en la URL y son
            // inmutables → CacheFirst con expiración larga: sin esto, al abrir
            // la app offline se caen las tipografías.
            urlPattern: ({ url }) => url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    sourcemap: false,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Socket.IO completo (cliente + stack de transporte). Van juntos
            // porque socket.io-client importa engine.io-client y sus helpers;
            // si se repartieran entre chunks se forma un ciclo index ⇄ chunk.
            if (
              id.includes('socket.io-client') ||
              id.includes('engine.io-client') ||
              id.includes('engine.io-parser') ||
              id.includes('socket.io-parser') ||
              id.includes('@socket.io/component-emitter') ||
              id.includes('xmlhttprequest-ssl') ||
              id.includes('node_modules/debug/') ||
              id.includes('node_modules/ms/') || // dependencia de debug
              id.includes('node_modules/ws/')
            ) {
              return 'socket'
            }
            // @atlaskit/pragmatic-drag-and-drop + sus helpers de runtime,
            // por el mismo motivo (si @babel/runtime quedara en el chunk
            // principal se crearía un ciclo).
            if (
              id.includes('pragmatic-drag-and-drop') ||
              id.includes('bind-event-listener') ||
              id.includes('raf-schd') ||
              id.includes('@babel/runtime')
            ) {
              return 'atlaskit'
            }
            // gsap + @gsap/react (este último vive en node_modules/@gsap/react,
            // comparte nombre; su único dependiente es react → react-vendor).
            if (id.includes('gsap')) return 'gsap'
            if (id.includes('react-router')) return 'router'
            if (id.includes('@tanstack/react-query')) return 'query'
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'react-vendor'
            }
          }
          return undefined
        },
      },
    },
  },
})
