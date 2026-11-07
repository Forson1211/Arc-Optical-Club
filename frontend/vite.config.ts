import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Declare process for Node environment when compiling config
declare const process: { env: Record<string, string | undefined> }

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  define: isSsrBuild ? { 'process.env.NODE_ENV': JSON.stringify('production') } : undefined,
  // The server renderer is packaged with the API, outside frontend/node_modules.
  ssr: { noExternal: true },
  server: { port: Number(process.env.ARC_FRONTEND_PORT) || 5173, strictPort: true, proxy: { '/api': { target: process.env.ARC_API_TARGET || 'http://127.0.0.1:5001', changeOrigin: true } } },
}))
