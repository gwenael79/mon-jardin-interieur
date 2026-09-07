import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules[\\/]@supabase/.test(id)) return 'vendor-supabase'
          if (/node_modules[\\/](@firebase|firebase)/.test(id)) return 'vendor-firebase'
          if (/node_modules[\\/]zustand/.test(id)) return 'vendor-zustand'
        },
      },
    },
  },
})
