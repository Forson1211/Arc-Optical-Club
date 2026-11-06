import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: Number(process.env.ARC_FRONTEND_PORT) || 5173, strictPort: true, proxy: { '/api': { target: process.env.ARC_API_TARGET || 'http://127.0.0.1:5001', changeOrigin: true } } },
})
