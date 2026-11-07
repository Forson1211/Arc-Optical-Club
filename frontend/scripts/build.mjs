import { fileURLToPath } from 'node:url'

// Hosting environments may supply NODE_ENV=development. Set it before importing
// Vite so JSX compilation and React's bundled runtime both use production mode.
process.env.NODE_ENV = 'production'
const { build } = await import('vite')
const root = fileURLToPath(new URL('../', import.meta.url))

await build({ root, mode: 'production' })
process.env.NODE_ENV = 'production'
await build({
  root,
  mode: 'production',
  build: {
    ssr: fileURLToPath(new URL('../src/entry-server.tsx', import.meta.url)),
    outDir: fileURLToPath(new URL('../../backend/dist/render/', import.meta.url)),
    emptyOutDir: false,
  },
})
await import('./prerender.mjs')
