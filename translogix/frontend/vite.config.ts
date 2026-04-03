import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_API_URL in docker-compose is set to http://backend:8000
// Locally (without docker) it falls back to http://localhost:8000
const apiTarget = process.env.VITE_API_URL || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      }
    }
  }
})
