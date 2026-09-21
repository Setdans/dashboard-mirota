import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://uncork-cola-travel.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      clientPort: 443,
    },
  },
})