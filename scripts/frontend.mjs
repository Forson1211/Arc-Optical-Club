import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(new URL('../frontend/package.json', import.meta.url))
let server
let closing = false

async function shutdown(code = 0) {
  if (closing) return
  closing = true
  await server?.close()
  process.exit(code)
}

process.on('SIGINT', () => { void shutdown() })
process.on('SIGTERM', () => { void shutdown() })
process.on('message', message => { if (message === 'shutdown') void shutdown() })
if (process.connected) process.on('disconnect', () => { void shutdown() })

try {
  const viteDirectory = dirname(require.resolve('vite/package.json'))
  const { createServer } = await import(pathToFileURL(join(viteDirectory, 'dist/node/index.js')).href)
  server = await createServer({
    root: fileURLToPath(new URL('../frontend/', import.meta.url)),
    configFile: fileURLToPath(new URL('../frontend/vite.config.ts', import.meta.url)),
  })
  await server.listen()
  server.printUrls()
} catch (error) {
  console.error(`[frontend] ${error.message}`)
  await shutdown(1)
}
