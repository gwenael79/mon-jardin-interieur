import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mon Jardin Intérieur',
        short_name: 'Mon Jardin',
        theme_color: '#1a2a1a',
        background_color: '#0d1a0d',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Laisser passer les requêtes réseau normalement
        navigateFallback: null,
        runtimeCaching: [],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
