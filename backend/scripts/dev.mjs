import { fork, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const directory = fileURLToPath(new URL('../', import.meta.url))
const expectedExits = new WeakSet()
let api
let closing = false
let restartQueue = Promise.resolve()

async function stop(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return
  expectedExits.add(child)
  const exited = new Promise(resolve => child.once('exit', resolve))
  child.kill('SIGTERM')
  await exited
}

async function shutdown(code = 0) {
  if (closing) return
  closing = true
  await Promise.all([stop(api), stop(compiler)])
  process.exit(code)
}

function watchExit(child, label) {
  child.once('error', error => { console.error(`[${label}] ${error.message}`); void shutdown(1) })
  child.once('exit', code => {
    if (!closing && !expectedExits.has(child)) {
      console.error(`[${label}] Process stopped with code ${code}.`)
      void shutdown(code || 1)
    }
  })
}

async function restartApi() {
  if (closing) return
  if (api) { console.log('[api] Build complete. Restarting the API…'); await stop(api) }
  if (closing) return
  api = fork('dist/server.js', [], { cwd: directory, stdio: ['inherit', 'inherit', 'inherit', 'ipc'], windowsHide: true })
  api.on('message', message => { if (message?.type === 'api-ready' && process.send) process.send(message) })
  watchExit(api, 'api')
}

// Start the API only after a complete, successful build. Do not watch emitted
// files individually: one compilation can write many files in quick succession.
const compiler = spawn(process.execPath, [require.resolve('typescript/bin/tsc'), '--watch', '--pretty', 'false', '--preserveWatchOutput', '--noEmitOnError', '--locale', 'en'], { cwd: directory, stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true })
watchExit(compiler, 'types')
let output = ''
compiler.stdout.setEncoding('utf8')
compiler.stdout.on('data', chunk => {
  output += chunk
  let newline
  while ((newline = output.indexOf('\n')) >= 0) {
    const line = output.slice(0, newline).replace(/\r$/, '')
    output = output.slice(newline + 1)
    console.log(`[types] ${line}`)
    if (line.includes('Found 0 errors. Watching for file changes.')) {
      restartQueue = restartQueue.then(restartApi).catch(error => { console.error(`[api] ${error.message}`); void shutdown(1) })
    }
  }
})
process.on('SIGINT', () => { void shutdown() })
process.on('SIGTERM', () => { void shutdown() })
process.on('message', message => { if (message === 'shutdown') void shutdown() })
if (process.connected) process.on('disconnect', () => { void shutdown() })
