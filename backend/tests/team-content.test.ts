import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { createApp } from '../src/app.js'
import { createAdmin } from '../src/lib/auth.js'
import { findRecord, initializeStorage, listRecords, updateRecord } from '../src/lib/store.js'
import { initialPrograms, legacyProgramDetails } from '../src/data/programs.js'

test('document team names, optional photos, publishing and safe content upgrades', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arc-team-content-'))
  process.env.NODE_ENV = 'test'
  process.env.CLIENT_URL = 'http://localhost:5173'
  process.env.DATA_DIRECTORY = directory
  delete process.env.MONGODB_URI
  await initializeStorage()
  const password = randomBytes(24).toString('base64url')
  await createAdmin('team-editor@example.com', password)
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
    const published = (await request('/content/team')).body.data
    assert.equal(published.length, 18)
    assert.equal(new Set(published.map((member: any) => member.title)).size, 18)
    assert.equal(published[0].title, 'Mr. Famous Yamoah')
    assert.equal(published[17].title, 'Dr. Benjamin Baah Konadu')
    assert.equal(published[17].role, 'Advisor')
    assert(published.every((member: any) => member.image === '' && member.alt === ''))
    assert.equal((await request('/admin/team')).response.status, 401)
    assert.equal((await request(`/admin/team/${published[0].id}`, 'PATCH', published[0])).response.status, 401)
    const login = await request('/admin/login', 'POST', { email: 'team-editor@example.com', password })
    assert.equal(login.response.status, 200)
    cookie = login.response.headers.get('set-cookie')!.split(';')[0]
    assert.equal((await request('/admin/team')).body.data.length, 18)
    assert.equal((await request(`/admin/team/${published[0].id}`, 'PATCH', published[0], 'https://untrusted.example')).response.status, 403)
    const draft = { title: 'Additional team member', role: 'Advisor', category: 'Advisory Council', image: '', alt: '', status: 'draft', order: 18 }
    const created = await request('/admin/team', 'POST', draft)
    assert.equal(created.response.status, 201)
    assert.equal((await request('/content/team')).body.data.length, 18)
    assert.equal((await request('/admin/team', 'POST', { ...draft, image: 'javascript:alert(1)' })).response.status, 400)
    assert.equal((await request('/admin/team', 'POST', { ...draft, image: 'https://example.com/photo.jpg' })).response.status, 400)
    assert.equal((await request('/admin/team', 'POST', { ...draft, category: 'Invalid team' })).response.status, 400)
    // A single test pixel stays inside this temporary database, never a real portrait.
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO3sAAAAASUVORK5CYII=', 'base64')
    const upload = await fetch(base + '/admin/content-images', { method: 'POST', headers: { 'Content-Type': 'image/png', Origin: 'http://localhost:5173', 'X-Requested-With': 'ArcAdmin', Cookie: cookie }, body: png })
    assert.equal(upload.status, 201)
    const image = (await upload.json() as any).data.src
    const withPhoto = { ...draft, image, alt: 'A test profile photo', status: 'published' }
    assert.equal((await request(`/admin/team/${created.body.data.id}`, 'PATCH', withPhoto)).response.status, 200)
    assert.equal((await request('/content/team')).body.data.length, 19)
    assert.equal((await request('/content/team')).body.data.at(-1).image, image)
    assert.equal((await fetch(base.replace(/\/api$/, '') + image)).status, 200)
    assert.equal((await request(`/admin/team/${published[0].id}`, 'PATCH', { ...published[0], title: 'Administrator edited name', status: 'draft' })).response.status, 200)
    const firstProgram = (await findRecord('programs', 'initialKey', 'initial-0'))!
    const editedProgram = (await findRecord('programs', 'initialKey', 'initial-1'))!
    await updateRecord('programs', firstProgram.id, { detail: legacyProgramDetails[0][0], status: 'draft', order: 90 })
    await updateRecord('programs', editedProgram.id, { detail: 'Administrator supplied program details that must remain intact.' })
    await initializeStorage()
    await initializeStorage()
    const migrated = (await findRecord('programs', 'id', firstProgram.id))!
    assert.equal(migrated.detail, initialPrograms[0].detail)
    assert.equal(migrated.status, 'draft')
    assert.equal(migrated.order, 90)
    assert.equal((await findRecord('programs', 'id', editedProgram.id))?.detail, 'Administrator supplied program details that must remain intact.')
    assert.equal((await listRecords('programs')).length, 3)
    assert.equal((await listRecords('teammembers')).length, 19)
    assert.equal((await request('/content/team')).body.data.length, 18)
    assert(!(await request('/content/team')).body.data.some((member: any) => member.id === published[0].id))
    assert.equal((await findRecord('teammembers', 'id', created.body.data.id))?.image, image)
    const audit = (await request('/admin/audit-logs?q=team.updated')).body.data.records
    assert(audit.some((entry: any) => entry.action === 'team.updated' && entry.outcome === 'success'))
  } finally {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
    assert(path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(directory).startsWith('arc-team-content-'))
    await rm(directory, { recursive: true, force: true })
  }
})
