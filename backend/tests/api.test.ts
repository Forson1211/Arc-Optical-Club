import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import { createApp } from '../src/app.js'
import { createAdmin } from '../src/lib/auth.js'
import { connectDatabase } from '../src/config/database.js'
import { findRecord, initializeStorage, insertRecord, listRecords, updateRecord } from '../src/lib/store.js'

test('public forms, protected admin operations and durable storage', async t => {
  const mongoUri = process.env.TEST_MONGODB_URI
  const modes = mongoUri ? ['local', 'mongodb'] : ['local']
  for (const mode of modes) await t.test(`${mode}: real HTTP lifecycle`, async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'arc-api-test-'))
    const databaseName = `arc_optical_test_${randomUUID().replaceAll('-', '')}`
    process.env.NODE_ENV = 'test'
    process.env.CLIENT_URL = 'http://localhost:5173'
    process.env.DATA_DIRECTORY = directory
    delete process.env.MONGODB_URI
    if (mode === 'mongodb') {
      const uri = new URL(mongoUri!)
      uri.pathname = `/${databaseName}`
      process.env.MONGODB_URI = uri.toString()
      await connectDatabase()
    }
    await initializeStorage()
    if (mode === 'local') {
      const file = path.join(directory, 'arc-database.json')
      const legacy = JSON.parse(await readFile(file, 'utf8'))
      delete legacy.auditlogs; delete legacy.siteevents
      await writeFile(file, JSON.stringify(legacy))
      await initializeStorage()
      assert.deepEqual(await listRecords('auditlogs'), [])
      assert.deepEqual(await listRecords('siteevents'), [])
    }
    const password = randomBytes(24).toString('base64url')
    await createAdmin('admin@example.com', password)
    const server = createApp().listen(0, '127.0.0.1')
    await new Promise<void>(resolve => { if (server.listening) resolve(); else server.once('listening', resolve) })
    const address = server.address()
    assert(address && typeof address !== 'string')
    const base = `http://127.0.0.1:${address.port}/api`
    let cookie = ''
    const request = async (route: string, method = 'GET', body?: unknown, authenticated = true, origin = 'http://localhost:5173') => {
      const response = await fetch(base + route, {
        method, headers: { 'Content-Type': 'application/json', Origin: origin, 'X-Requested-With': 'ArcAdmin', ...(authenticated && cookie ? { Cookie: cookie } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      })
      return { response, body: await response.json() as any }
    }
    try {
      assert.equal((await request('/admin/workspace')).response.status, 401)
      for (const route of ['/admin/admins', '/admin/audit-logs', '/admin/analytics', '/admin/news', '/admin/programs']) assert.equal((await request(route)).response.status, 401)
      assert.equal((await request('/admin/news', 'POST', {})).response.status, 401)
      assert.equal((await request('/admin/programs', 'POST', {})).response.status, 401)
      assert.equal((await request('/admin/profile', 'PATCH', { name: 'Untrusted' })).response.status, 401)
      assert.equal((await request('/admin/password', 'POST', { currentPassword: password, newPassword: password })).response.status, 401)
      assert.equal((await request('/admin/admins', 'POST', { name: 'Intruder', email: 'intruder@example.com', password })).response.status, 401)
      assert.equal((await request('/admin/volunteers', 'POST', {})).response.status, 401)
      assert.equal((await request('/admin/volunteers/missing', 'PATCH', {})).response.status, 401)
      assert.equal((await request('/admin/messages/missing', 'PATCH', { status: 'read' })).response.status, 401)
      assert.equal((await request('/admin/subscribers/missing', 'PATCH', { status: 'unsubscribed' })).response.status, 401)
      assert.equal((await request('/admin/login', 'POST', { email: 'admin@example.com', password }, false, 'https://untrusted.example')).response.status, 403)
      assert.equal((await request('/admin/login', 'POST', { email: 'admin@example.com', password: 'incorrect' })).response.status, 401)

      const application = { name: 'Test Volunteer', email: 'VOLUNTEER@example.com', phone: '+233 24 000 0000', location: 'Kumasi, Ghana', role: 'Student', organization: 'Test School', interests: ['Community outreach', 'Research & learning'], availability: 'Weekends', motivation: 'I want to support community eye-health education and screening.', consent: true }
      assert.equal((await request('/join', 'POST', { ...application, consent: false })).response.status, 400)
      assert.equal((await request('/join', 'POST', { ...application, interests: [] })).response.status, 400)
      assert.equal((await request('/join', 'POST', { ...application, website: 'spam' })).response.status, 400)
      const joined = await request('/join', 'POST', { ...application, status: 'Active', id: 'forged' })
      assert.equal(joined.response.status, 201)
      assert.equal((await request('/join', 'POST', { ...application, email: 'volunteer@example.com' })).response.status, 409)
      assert.equal((await request('/contact', 'POST', { name: 'Test School', email: 'school@example.com', subject: 'School screening', message: 'Please tell us more about bringing an outreach to our school.' })).response.status, 201)
      const subscribed = await Promise.all([request('/newsletter', 'POST', { email: 'NEWS@example.com' }), request('/newsletter', 'POST', { email: 'news@example.com' })])
      assert(subscribed.every(r => r.response.status === 201))

      const login = await request('/admin/login', 'POST', { email: 'ADMIN@example.com', password })
      assert.equal(login.response.status, 200)
      const setCookie = login.response.headers.get('set-cookie')!
      assert.match(setCookie, /HttpOnly/)
      assert.match(setCookie, /SameSite=Lax/)
      assert.match(setCookie, /Path=\/api\/admin/)
      cookie = setCookie.split(';')[0]
      assert.equal((await request('/admin/session')).response.status, 200)
      const live = await request('/admin/workspace')
      assert.equal(live.response.headers.get('cache-control'), 'no-store')
      assert.equal(live.body.storage, mode)
      assert.equal(live.body.data.outreaches.length, 0)
      assert.equal(live.body.data.volunteers.length, 1)
      assert.equal(live.body.data.volunteers[0].email, 'volunteer@example.com')
      assert.equal(live.body.data.volunteers[0].status, 'Pending')
      assert.notEqual(live.body.data.volunteers[0].id, 'forged')
      assert.equal(live.body.data.messages[0].read, false)
      assert.equal(live.body.data.subscribers.length, 1)
      assert.equal(JSON.stringify(live.body).includes('passwordHash'), false)
      const volunteer = live.body.data.volunteers[0]
      const approved = await request(`/admin/volunteers/${volunteer.id}`, 'PATCH', { name: volunteer.name, email: volunteer.email, role: volunteer.role, status: 'Active' })
      assert.equal(approved.response.status, 200)
      assert.equal(approved.body.data.status, 'Active')
      assert.deepEqual(approved.body.data.interests, application.interests)
      assert.equal(approved.body.data.motivation, application.motivation)

      const outreach = { name: 'Test outreach', program: 'Sight For Kids', location: 'Test community', date: '2026-11-20', status: 'Planning', screened: 0, target: 120 }
      assert.equal((await request('/admin/outreaches', 'POST', { ...outreach, date: '2026-02-30' })).response.status, 400)
      assert.equal((await request('/admin/outreaches', 'POST', { ...outreach, screened: 10 })).response.status, 400)
      const created = await request('/admin/outreaches', 'POST', outreach)
      assert.equal(created.response.status, 201)
      assert.equal((await request(`/admin/outreaches/${created.body.data.id}`, 'PATCH', { ...outreach, status: 'Completed', screened: 125 })).response.status, 200)
      assert.equal((await request('/admin/donations', 'POST', { name: 'Test Supporter', amount: 123.45, date: '2026-11-06', program: 'Sight For Kids', status: 'Received' })).response.status, 201)
      assert.equal((await request('/admin/donations', 'POST', { name: 'Test Supporter', amount: -20, date: '2026-11-06', program: 'Sight For Kids', status: 'Received' })).response.status, 400)
      assert.equal((await request(`/admin/messages/${live.body.data.messages[0].id}`, 'PATCH', { status: 'read' })).response.status, 200)
      assert.equal((await request(`/admin/subscribers/${live.body.data.subscribers[0].id}`, 'PATCH', { status: 'unsubscribed' })).response.status, 200)
      assert.equal((await request('/admin/outreaches/missing', 'PATCH', outreach)).response.status, 404)

      // Only authenticated, same-origin requests may create another administrator.
      const teammatePassword = randomBytes(24).toString('base64url')
      const teammate = { name: 'Test Teammate', email: 'TEAM@example.com', password: teammatePassword }
      assert.equal((await request('/admin/admins', 'POST', teammate, true, 'https://untrusted.example')).response.status, 403)
      assert.equal((await request('/admin/admins', 'POST', { ...teammate, password: 'short' })).response.status, 400)
      const addedAdmin = await request('/admin/admins', 'POST', { ...teammate, passwordHash: 'forged', id: 'forged' })
      assert.equal(addedAdmin.response.status, 201)
      assert.equal(addedAdmin.body.data.email, 'team@example.com')
      assert.notEqual(addedAdmin.body.data.id, 'forged')
      assert.equal((await request('/admin/admins', 'POST', teammate)).response.status, 409)
      const admins = await request('/admin/admins')
      assert.equal(admins.body.data.length, 2)
      for (const secret of ['passwordHash', 'salt', teammatePassword, password]) assert.equal(JSON.stringify(admins.body).includes(secret), false)
      const teamLogin = await request('/admin/login', 'POST', { email: 'team@example.com', password: teammatePassword }, false)
      assert.equal(teamLogin.response.status, 200)
      assert.equal(teamLogin.body.data.name, teammate.name)
      for (const secret of ['passwordHash', 'salt', teammatePassword]) assert.equal(JSON.stringify(teamLogin.body).includes(secret), false)
      const teamCookie = teamLogin.response.headers.get('set-cookie')!.split(';')[0]
      const teamSession = await fetch(base + '/admin/session', { headers: { Cookie: teamCookie } })
      assert.equal(teamSession.status, 200)
      assert.equal((await teamSession.json() as any).data.name, teammate.name)

      const originalCookie = cookie
      cookie = teamCookie
      assert.equal((await request('/admin/profile', 'PATCH', { name: 'Updated Teammate' }, true, 'https://untrusted.example')).response.status, 403)
      const profile = await request('/admin/profile', 'PATCH', { name: 'Updated Teammate', email: 'forged@example.com', passwordHash: 'forged' })
      assert.equal(profile.response.status, 200)
      assert.equal(profile.body.data.name, 'Updated Teammate')
      assert.equal(profile.body.data.email, 'team@example.com')
      assert.equal(JSON.stringify(profile.body).includes('passwordHash'), false)
      const newPassword = randomBytes(24).toString('base64url')
      assert.equal((await request('/admin/password', 'POST', { currentPassword: teammatePassword, newPassword }, true, 'https://untrusted.example')).response.status, 403)
      assert.equal((await request('/admin/password', 'POST', { currentPassword: 'wrong', newPassword })).response.status, 400)
      assert.equal((await request('/admin/password', 'POST', { currentPassword: teammatePassword, newPassword: 'short' })).response.status, 400)
      assert.equal((await request('/admin/password', 'POST', { currentPassword: teammatePassword, newPassword: teammatePassword })).response.status, 400)
      const changedPassword = await request('/admin/password', 'POST', { currentPassword: teammatePassword, newPassword })
      assert.equal(changedPassword.response.status, 200)
      cookie = changedPassword.response.headers.get('set-cookie')!.split(';')[0]
      assert.notEqual(cookie, teamCookie)
      assert.equal((await request('/admin/session')).response.status, 200)
      assert.equal((await fetch(base + '/admin/session', { headers: { Cookie: teamCookie } })).status, 401)
      assert.equal((await request('/admin/login', 'POST', { email: 'team@example.com', password: teammatePassword }, false)).response.status, 401)
      assert.equal((await request('/admin/login', 'POST', { email: 'team@example.com', password: newPassword }, false)).response.status, 200)
      // A sign-in that started before rotation must not revive an old session.
      const delayedToken = randomBytes(32).toString('base64url')
      await insertRecord('adminsessions', { userId: addedAdmin.body.data.id, tokenHash: createHash('sha256').update(delayedToken).digest('hex'), authVersion: '0', expiresAt: new Date(Date.now() + 60000) })
      assert.equal((await fetch(base + '/admin/session', { headers: { Cookie: `arc_admin_session=${delayedToken}` } })).status, 401)
      const updatedTeam = await findRecord('adminusers', 'email', 'team@example.com')
      assert.equal(updatedTeam?.name, 'Updated Teammate')
      assert.equal(JSON.stringify(updatedTeam).includes(newPassword), false)
      cookie = originalCookie
      assert.equal((await request('/admin/session')).response.status, 200)

      assert.equal((await request('/admin/analytics?days=8')).response.status, 400)
      assert.equal((await request('/admin/analytics?days=7')).body.data.traffic.views, 0)
      const visitorId = randomUUID(), sessionId = randomUUID()
      const events = [
        { eventId: randomUUID(), visitorId, sessionId, type: 'page_view', path: '/' },
        { eventId: randomUUID(), visitorId, sessionId, type: 'page_view', path: '/join' },
        { eventId: randomUUID(), visitorId: randomUUID(), sessionId: randomUUID(), type: 'page_view', path: '/programs' },
        { eventId: randomUUID(), visitorId, sessionId, type: 'click', path: '/join', element: 'button' },
      ]
      for (const event of [{ ...events[0], path: '/admin' }, { ...events[0], path: '/join?email=private@example.com' }, { ...events[0], visitorId: 'invalid' }]) assert.equal((await request('/activity', 'POST', { events: [event] }, false)).response.status, 400)
      assert.equal((await request('/activity', 'POST', { events }, false)).response.status, 202)
      const retried = await Promise.all([request('/activity', 'POST', { events }, false), request('/activity', 'POST', { events }, false)])
      assert(retried.every(r => r.response.status === 202))
      const analytics = await request('/admin/analytics?days=30')
      assert.equal(analytics.body.data.traffic.views, 3)
      assert.equal(analytics.body.data.traffic.visits, 2)
      assert.equal(analytics.body.data.traffic.browsers, 2)
      assert.equal(analytics.body.data.traffic.interactions, 1)
      assert.equal(analytics.body.data.traffic.daily.length, 7)
      assert.equal(analytics.body.data.traffic.daily.reduce((sum: number, d: any) => sum + d.views, 0), 3)
      assert.equal(analytics.body.data.traffic.topPages.length, 3)
      assert.deepEqual(analytics.body.data.mission, { completed: 1, outreaches: 1, active: 1, volunteers: 1 })
      assert.equal(analytics.body.data.giving.received, 123.45)
      assert.deepEqual(analytics.body.data.giving.byProgram, [{ program: 'Sight For Kids', amount: 123.45 }])

      const activity = { eventId: randomUUID(), path: '/admin/reports', type: 'export', action: 'outreach.export' }
      assert.equal((await request('/admin/activity', 'POST', activity, false)).response.status, 401)
      assert.equal((await request('/admin/activity', 'POST', { ...activity, path: '/admin/secret' })).response.status, 400)
      assert.equal((await request('/admin/activity', 'POST', activity)).response.status, 202)
      assert.equal((await request('/admin/activity', 'POST', activity)).response.status, 202)
      const trafficLog = await request('/admin/audit-logs?category=traffic&limit=100')
      assert.equal(trafficLog.body.data.total, 4)
      assert(trafficLog.body.data.records.every((entry: any) => entry.source === 'browser' && entry.actorType === 'visitor'))
      const serverLogs = (await request('/admin/audit-logs?limit=100')).body.data.records
      assert(serverLogs.some((entry: any) => entry.action === 'application.submitted' && entry.outcome === 'success'))
      assert(serverLogs.some((entry: any) => entry.action === 'outreaches.updated' && entry.outcome === 'success' && entry.actorEmail === 'admin@example.com'))
      assert(serverLogs.some((entry: any) => entry.action === 'admin.created' && entry.outcome === 'success' && entry.resourceId === addedAdmin.body.data.id && entry.actorEmail === 'admin@example.com'))
      assert(serverLogs.some((entry: any) => entry.action === 'admin.login' && entry.outcome === 'failure'))
      assert(serverLogs.some((entry: any) => entry.action === 'admin.access_denied' && entry.path === '/api/admin/admins'))
      assert(serverLogs.some((entry: any) => entry.action === 'admin.profile_updated' && entry.outcome === 'success' && entry.actorEmail === 'team@example.com'))
      assert(serverLogs.some((entry: any) => entry.action === 'admin.password_changed' && entry.outcome === 'success' && entry.actorEmail === 'team@example.com'))
      assert.equal(serverLogs.filter((entry: any) => entry.action === 'admin.outreach.export').length, 1)
      for (const secret of [password, teammatePassword, newPassword, 'passwordHash', 'salt', application.motivation, application.phone, 'school@example.com']) assert.equal(JSON.stringify(serverLogs).includes(secret), false)
      const failures = await request('/admin/audit-logs?category=security&outcome=failure&limit=2')
      assert(failures.body.data.total > 2)
      assert.equal(failures.body.data.records.length, 2)
      assert(failures.body.data.records.every((entry: any) => entry.category === 'security' && entry.outcome === 'failure'))
      const nextPage = await request('/admin/audit-logs?category=security&outcome=failure&limit=2&page=2')
      assert(!nextPage.body.data.records.some((entry: any) => failures.body.data.records.some((previous: any) => previous.id === entry.id)))
      assert.equal((await request('/admin/audit-logs?q=%5B')).response.status, 200)
      assert((await request('/admin/audit-logs?q=admin%40example.com')).body.data.total > 0)

      // Content lifecycle: saved drafts stay private; publication and edits are immediate.
      const programs = (await request('/content/programs')).body.data
      assert.equal(programs.length, 3)
      const program = { ...programs[0], title: 'Updated school program', description: 'Updated public description from the content editor.' }
      assert.equal((await request(`/admin/programs/${program.id}`, 'PATCH', program, true, 'https://untrusted.example')).response.status, 403)
      assert.equal((await request(`/admin/programs/${program.id}`, 'PATCH', program)).response.status, 200)
      assert.equal((await request('/content/programs')).body.data[0].title, program.title)
      assert.equal((await request(`/admin/programs/${program.id}`, 'PATCH', { ...program, status: 'draft' })).response.status, 200)
      assert.equal((await request('/content/programs')).body.data.length, 2)
      assert.equal((await request('/admin/programs')).body.data.length, 3)
      const addedProgram = await request('/admin/programs', 'POST', { ...program, title: 'New initiative', order: 10 })
      assert.equal(addedProgram.response.status, 201)
      assert.notEqual(addedProgram.body.data.id, program.id)
      const news = { title: 'Community screening story', excerpt: 'A short summary of our community screening.', category: 'Outreach', author: 'Arc Editorial Team', image: '/images/arc-team-hero.jpg', alt: 'Arc volunteers working together', publishedAt: new Date().toISOString(), status: 'draft', blocks: [{ type: 'paragraph', text: 'A community story told in the new news format.' }, { type: 'image', src: '/images/arc-screening-session.jpg', alt: 'Eye screening session', caption: 'Supporting community eye care.' }, { type: 'heading', text: 'What comes next' }, { type: 'paragraph', text: 'Join us for the next chapter.' }] }
      assert.equal((await request('/admin/news', 'POST', { ...news, image: 'javascript:alert(1)' })).response.status, 400)
      assert.equal((await request('/admin/news', 'POST', { ...news, image: '//unsafe.example/image.png' })).response.status, 400)
      assert.equal((await request('/admin/news', 'POST', { ...news, blocks: [] })).response.status, 400)
      assert.equal((await request('/admin/news', 'POST', { ...news, publishedAt: '2026-02-30' })).response.status, 400)
      assert.equal((await request('/admin/news', 'POST', { ...news, publishedAt: new Date(Date.now() + 86400000).toISOString() })).response.status, 400)
      const draft = await request('/admin/news', 'POST', { ...news, id: 'forged' })
      assert.equal(draft.response.status, 201)
      assert.equal((await request('/content/news')).body.data.length, 0)
      const storyId = draft.body.data.id
      assert.notEqual(storyId, 'forged')
      assert.equal((await request(`/content/news/${storyId}`)).response.status, 404)
      assert.equal((await request('/admin/news')).body.data.length, 1)
      const published = { ...news, status: 'published' }
      assert.equal((await request(`/admin/news/${storyId}`, 'PATCH', published)).response.status, 200)
      const listing = await request('/content/news')
      assert.equal(listing.body.data.length, 1)
      assert.equal('blocks' in listing.body.data[0], false)
      assert.equal(listing.response.headers.get('cache-control'), 'no-store')
      assert.deepEqual((await request(`/content/news/${storyId}`)).body.data.blocks, news.blocks)
      assert.equal((await request(`/admin/news/${storyId}`, 'PATCH', { ...published, title: 'Edited community screening story' })).response.status, 200)
      assert.equal((await request(`/content/news/${storyId}`)).body.data.title, 'Edited community screening story')
      assert.equal((await request(`/admin/news/${storyId}`, 'PATCH', news)).response.status, 200)
      assert.equal((await request(`/content/news/${storyId}`)).response.status, 404)
      assert.equal((await request('/content/news')).body.data.length, 0)
      assert.equal((await request('/admin/news/missing', 'PATCH', published)).response.status, 404)
      const upload = (bytes: Buffer, contentType: string, authenticated = true, origin = 'http://localhost:5173') => fetch(base + '/admin/content-images', { method: 'POST', headers: { 'Content-Type': contentType, Origin: origin, 'X-Requested-With': 'ArcAdmin', ...(authenticated ? { Cookie: cookie } : {}) }, body: bytes })
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO3sAAAAASUVORK5CYII=', 'base64')
      assert.equal((await upload(png, 'image/png', false)).status, 401)
      assert.equal((await upload(png, 'image/png', true, 'https://untrusted.example')).status, 403)
      assert.equal((await upload(Buffer.from('<svg onload="alert(1)"></svg>'), 'image/png')).status, 400)
      assert.equal((await upload(png, 'image/svg+xml')).status, 400)
      assert.equal((await upload(Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png')).status, 413)
      const uploaded = await upload(png, 'image/png')
      assert.equal(uploaded.status, 201)
      const image = (await uploaded.json() as any).data
      const imageResponse = await fetch(base + `/content/images/${image.id}`)
      assert.equal(imageResponse.headers.get('content-type'), 'image/png')
      assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), png)
      assert.equal((await request(`/admin/news/${storyId}`, 'PATCH', { ...published, image: image.src })).response.status, 200)
      const contentLogs = (await request('/admin/audit-logs?category=programs&limit=100')).body.data.records
      assert(contentLogs.some((entry: any) => entry.action === 'news.created' && entry.outcome === 'success'))
      assert(contentLogs.some((entry: any) => entry.action === 'programs.updated' && entry.outcome === 'success'))

      // Reopen storage to verify that success responses represented durable writes.
      await initializeStorage()
      assert.equal((await request('/admin/programs')).body.data.length, 4)
      assert.equal((await request(`/content/news/${storyId}`)).body.data.image, image.src)
      assert.equal((await fetch(base + `/content/images/${image.id}`)).status, 200)
      const restored = await request('/admin/workspace')
      assert.equal(restored.body.data.outreaches[0].screened, 125)
      assert.equal(restored.body.data.messages[0].read, true)
      assert.equal(restored.body.data.subscribers[0].status, 'unsubscribed')
      assert.equal(restored.body.data.volunteers[0].status, 'Active')
      assert.equal((await request('/admin/analytics')).body.data.traffic.views, 3)
      assert.equal((await request('/admin/audit-logs?category=traffic')).body.data.total, 4)
      const storedAdmin = await findRecord('adminusers', 'email', 'admin@example.com')
      assert(storedAdmin?.passwordHash && storedAdmin.salt)
      assert.equal(JSON.stringify(storedAdmin).includes(password), false)
      const sessions = await listRecords('adminsessions')
      assert.equal(JSON.stringify(sessions).includes(cookie.split('=')[1]), false)
      if (mode === 'local') assert.equal((await readFile(path.join(directory, 'arc-database.json'), 'utf8')).includes(password), false)
      assert.equal((await request('/admin/logout', 'POST')).response.status, 200)
      assert.equal((await request('/admin/session')).response.status, 401)
      const anotherLogin = await request('/admin/login', 'POST', { email: 'admin@example.com', password })
      cookie = anotherLogin.response.headers.get('set-cookie')!.split(';')[0]
      const currentSessions = await listRecords('adminsessions')
      const adminSession = currentSessions.find(session => session.userId === storedAdmin!.id)!
      await updateRecord('adminsessions', adminSession.id, { expiresAt: new Date(Date.now() - 1000) })
      assert.equal((await request('/admin/workspace')).response.status, 401)
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()))
      if (mode === 'mongodb') {
        assert.equal(mongoose.connection.name, databaseName)
        assert(databaseName.startsWith('arc_optical_test_'))
        await mongoose.connection.dropDatabase()
        await mongoose.disconnect()
      }
      // Only this test's mkdtemp directory is removed.
      assert(path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep))
      assert(path.basename(directory).startsWith('arc-api-test-'))
      await rm(directory, { recursive: true, force: true })
    }
  })
  await t.test('production refuses an unconfigured database', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.MONGODB_URI
    await assert.rejects(connectDatabase, /MONGODB_URI/)
    await assert.rejects(initializeStorage, /MongoDB is required/)
    process.env.NODE_ENV = 'test'
  })
})
