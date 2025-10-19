import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api\//],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // allow up to 5MB assets
      },
      manifest: {
        name: 'Get Stronger',
        short_name: 'Stronger',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b1020',
        theme_color: '#0b1020',
        description: 'Track PRs and strongman programs offline.',
        icons: [
          // PWA icons served from /public/icons
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      includeAssets: ['favicon.ico', 'icons/apple-touch-icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      // Disable SW during dev to avoid noisy dev-dist glob warnings
      devOptions: { enabled: false },
    }),
  ],
})
