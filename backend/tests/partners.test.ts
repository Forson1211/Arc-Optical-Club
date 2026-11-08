import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { createApp } from '../src/app.js'
import { createAdmin } from '../src/lib/auth.js'
import { initializeStorage, listRecords } from '../src/lib/store.js'

test('official partner logos, protected editing, publication rules and safe storage upgrades', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arc-partners-'))
  process.env.NODE_ENV = 'test'
  process.env.CLIENT_URL = 'http://localhost:5173'
  process.env.DATA_DIRECTORY = directory
  delete process.env.MONGODB_URI
  await initializeStorage()
  const password = randomBytes(24).toString('base64url')
  await createAdmin('partner-editor@example.com', password)
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', resolve))
  const address = server.address()
  assert(address && typeof address !== 'string')
  const base = `http://127.0.0.1:${address.port}/api`
  let cookie = ''
  const request = async (route: string, method = 'GET', body?: unknown, origin = 'http://localhost:5173') => {
    const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', Origin: origin, 'X-Requested-With': 'ArcAdmin', ...(cookie ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return { response, body: await response.json() as any }
  }
  try {
    const published = (await request('/content/partners')).body.data
    assert.equal(published.length, 2)
    assert(published.every((partner: any) => partner.image && partner.alt && partner.website.startsWith('https://')))
    assert.equal((await request('/admin/partners')).response.status, 401)
    const login = await request('/admin/login', 'POST', { email: 'partner-editor@example.com', password })
    cookie = login.response.headers.get('set-cookie')!.split(';')[0]
    const records = (await request('/admin/partners')).body.data
    assert.equal(records.length, 3)
    const pending = records.find((partner: any) => partner.status === 'draft')
    assert.equal(pending.title, 'Pilmart Pharmacy and Clinic')
    assert.equal(pending.image, '')
    assert.equal((await request(`/admin/partners/${pending.id}`, 'PATCH', { ...pending, status: 'published' })).response.status, 400)
    assert.equal((await request(`/admin/partners/${pending.id}`, 'PATCH', pending, 'https://untrusted.example')).response.status, 403)
    assert.equal((await request('/admin/partners', 'POST', { ...pending, website: 'javascript:alert(1)' })).response.status, 400)
    assert.equal((await request('/admin/partners', 'POST', { ...pending, image: 'data:image/png;base64,AAAA' })).response.status, 400)
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO3sAAAAASUVORK5CYII=', 'base64')
    const upload = await fetch(base + '/admin/content-images', { method: 'POST', headers: { 'Content-Type': 'image/png', Origin: 'http://localhost:5173', 'X-Requested-With': 'ArcAdmin', Cookie: cookie }, body: png })
    assert.equal(upload.status, 201)
    const image = (await upload.json() as any).data.src
    const completed = { ...pending, image, alt: 'A temporary test logo', status: 'published', website: 'https://example.com/', order: 0 }
    assert.equal((await request(`/admin/partners/${pending.id}`, 'PATCH', { ...completed, alt: '' })).response.status, 400)
    assert.equal((await request(`/admin/partners/${pending.id}`, 'PATCH', completed)).response.status, 200)
    assert.equal((await request('/content/partners')).body.data.length, 3)
    assert.equal((await fetch(base.replace(/\/api$/, '') + image)).status, 200)
    const draft = { ...completed, title: 'Edited partner name', status: 'draft' }
    assert.equal((await request(`/admin/partners/${pending.id}`, 'PATCH', draft)).response.status, 200)
    assert.equal((await request('/content/partners')).body.data.length, 2)
    await initializeStorage()
    await initializeStorage()
    const afterUpgrade = await listRecords('partners')
    assert.equal(afterUpgrade.length, 3)
    assert.equal(afterUpgrade.find(partner => partner.id === pending.id)?.title, draft.title)
    assert.equal(afterUpgrade.find(partner => partner.id === pending.id)?.image, image)
    const audit = (await request('/admin/audit-logs?q=partners.updated')).body.data.records
    assert(audit.some((entry: any) => entry.action === 'partners.updated' && entry.outcome === 'success'))
  } finally {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
    assert(path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(directory).startsWith('arc-partners-'))
    await rm(directory, { recursive: true, force: true })
  }
})
