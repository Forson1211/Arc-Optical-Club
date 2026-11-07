import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import express from 'express'
import { createServerlessHandler } from '../src/serverless.js'

test('serverless startup waits for one shared initialization and reuses the app', { timeout: 10000 }, async () => {
  let starts = 0
  let release!: () => void
  const ready = new Promise<void>(resolve => { release = resolve })
  const app = express().get('/api/content/programs', (_req, res) => res.json({ success: true, data: [] }))
  const handler = createServerlessHandler(async () => { starts++; await ready; return app })
  const server = createServer(handler).listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', resolve))
  const address = server.address()
  assert(address && typeof address !== 'string')
  const url = `http://127.0.0.1:${address.port}/api/content/programs`
  try {
    const requests = Array.from({ length: 5 }, () => fetch(url))
    // Ensure startup has actually begun before allowing it to finish.
    while (!starts) await new Promise(resolve => setTimeout(resolve, 5))
    release()
    for (const response of await Promise.all(requests)) {
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { success: true, data: [] })
    }
    assert.equal((await fetch(url)).status, 200)
    assert.equal(starts, 1)
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) }
})

test('a failed cold start returns JSON and the next request retries successfully', async () => {
  let starts = 0
  const app = express().get('/api/health', (_req, res) => res.json({ success: true }))
  const handler = createServerlessHandler(async () => {
    if (++starts === 1) throw new Error('Private database diagnostic: secret-password')
    return app
  })
  const server = createServer(handler).listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', resolve))
  const address = server.address()
  assert(address && typeof address !== 'string')
  const url = `http://127.0.0.1:${address.port}/api/health`
  try {
    const failed = await fetch(url)
    assert.equal(failed.status, 503)
    assert.equal(failed.headers.get('retry-after'), '15')
    assert.equal(failed.headers.get('cache-control'), 'no-store')
    assert.match(failed.headers.get('content-type') || '', /application\/json/)
    const body = await failed.text()
    assert.equal(JSON.parse(body).success, false)
    assert(!body.includes('secret-password'))
    assert.equal((await fetch(url)).status, 200)
    assert.equal((await fetch(url)).status, 200)
    assert.equal(starts, 2)
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) }
})

test('missing production configuration returns a controlled response without starting storage', async () => {
  delete process.env.MONGODB_URI
  delete process.env.CLIENT_URL
  const server = createServer(createServerlessHandler()).listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', resolve))
  const address = server.address()
  assert(address && typeof address !== 'string')
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/content/programs`)
    assert.equal(response.status, 503)
    assert.equal((await response.json() as { code: string }).code, 'API_CONFIGURATION_REQUIRED')
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) }
})
