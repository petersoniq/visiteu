import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['apple-touch-icon.png', 'favicon-192.png'],
      manifest: {
        id: '/visiteu/',
        name: 'visitEU – cestovateľský denník po EÚ',
        short_name: 'visitEU',
        description: 'Sleduj a zaznamenávaj svoje návštevy hlavných miest Európskej únie.',
        start_url: '/visiteu/',
        scope: '/visiteu/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#059669',
        lang: 'sk',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          // Auth musí byť VŽDY čerstvé (prihlásenie/odhlásenie/token refresh) - nikdy necachovať.
          {
            urlPattern: ({ url }: { url: URL }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/auth/'),
            handler: 'NetworkOnly',
          },
          // Dáta (návštevy, výlety, mestá...) - vždy skús najprv sieť (čerstvé dáta), ale
          // ak si offline alebo sieť neodpovedá do 3s, zobraz posledné známe dáta z cache.
          // Toto umožňuje prezerať si už raz načítaný denník aj bez pripojenia.
          {
            urlPattern: ({ url }: { url: URL }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-data-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Fotky a avatary sa po nahratí nemenia - keď ich raz vidíš, zostanú dostupné aj offline.
          {
            urlPattern: ({ url }: { url: URL }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/storage/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('basemaps.cartocdn.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
    }),
  ],
  base: '/visiteu/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
