import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendUrl = process.env.VITE_API_URL || 'http://localhost:5000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/socket.io': {
        target: backendUrl,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
