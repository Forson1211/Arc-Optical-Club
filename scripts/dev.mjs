import { fork } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const children = new Set()
let stopping = false
let backendReady = false

async function stopChild(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return
  await new Promise(resolve => {
    const timeout = setTimeout(() => { child.kill('SIGKILL') }, 8000)
    child.once('exit', () => { clearTimeout(timeout); resolve() })
    if (child.connected) child.send('shutdown')
    else child.kill('SIGTERM')
  })
}

async function shutdown(code = 0) {
  if (stopping) return
  stopping = true
  await Promise.all([...children].map(stopChild))
  process.exit(code)
}

function start(script, label, env = process.env) {
  const child = fork(fileURLToPath(script), [], { env, stdio: ['inherit', 'inherit', 'inherit', 'ipc'], windowsHide: true })
  children.add(child)
  child.on('message', message => { if (label === 'Backend' && message?.type === 'api-ready') backendReady = true })
  child.once('error', error => { console.error(`[dev] Could not start ${label}: ${error.message}`); void shutdown(1) })
  child.once('exit', code => {
    children.delete(child)
    if (!stopping) { console.error(`[dev] ${label} stopped. Shutting down the other service.`); void shutdown(code || 1) }
  })
}

process.on('SIGINT', () => { void shutdown() })
process.on('SIGTERM', () => { void shutdown() })
// A parent process can stop an owned development session without orphaning children.
process.on('message', message => { if (message === 'shutdown') void shutdown() })
if (process.connected) process.on('disconnect', () => { void shutdown() })

try {
  let config = ''
  try { config = await readFile(new URL('../backend/.env', import.meta.url), 'utf8') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  const configuredPort = config.match(/^\s*PORT\s*=\s*["']?(\d+)/m)?.[1]
  const port = Number(process.env.PORT || configuredPort || 5001)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('The backend PORT must be between 1 and 65535.')
  const target = `http://127.0.0.1:${port}`
  start(new URL('../backend/scripts/dev.mjs', import.meta.url), 'Backend')
  console.log(`[dev] Waiting for the backend at ${target} before starting the frontend…`)
  const deadline = Date.now() + 120000
  let ready = false
  while (!stopping && Date.now() < deadline) {
    try {
      if (!backendReady) { await delay(300); continue }
      const response = await fetch(`${target}/api/health`, { signal: AbortSignal.timeout(1500) })
      const health = response.ok ? await response.json() : null
      if (health?.success && health.message === 'Arc Optical Club API is running.') { ready = true; break }
    } catch { /* The compiler and database must finish before Vite starts. */ }
    await delay(300)
  }
  if (!stopping) {
    if (!ready) throw new Error('The API did not become ready. Check the backend errors above and verify that MongoDB is running.')
    console.log('[dev] Backend is ready. Starting the frontend.')
    start(new URL('./frontend.mjs', import.meta.url), 'Frontend', { ...process.env, ARC_API_TARGET: target })
    if (process.send) process.send({ type: 'backend-ready', target })
  }
} catch (error) {
  console.error(`[dev] ${error.message}`)
  await shutdown(1)
}
