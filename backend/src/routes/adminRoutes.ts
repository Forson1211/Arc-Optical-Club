import { raw, Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { authenticate, changeAdminPassword, cookieOptions, createAdmin, endSession, requireAdmin, sessionCookie } from '../lib/auth.js'
import { adminActivitySchema, auditQuerySchema, getAuditLogs, writeAudit } from '../lib/activity.js'
import { getAnalytics } from '../lib/analytics.js'
import { donationSchema, email, outreachSchema, volunteerSchema } from '../lib/validation.js'
import { findRecord, HttpError, insertRecord, listRecords, storageMode, updateRecord } from '../lib/store.js'
import type { Collection, RecordData } from '../lib/store.js'
import { newsSchema, programContentSchema, teamProfileSchema } from '../lib/content.js'

const publicAdmin = (user: RecordData) => ({ id: user.id, name: String(user.name || ''), email: String(user.email), createdAt: user.createdAt, lastLoginAt: user.lastLoginAt || null })

export function adminRoutes(allowedOrigins: string[]) {
  const router = Router()
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })
  // Custom header + exact origin check protect cookie-authenticated writes from CSRF.
  router.use((req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (!allowedOrigins.includes(req.get('Origin') || '') || req.get('X-Requested-With') !== 'ArcAdmin')) {
      res.status(403).json({ success: false, message: 'This request did not come from an allowed admin workspace.' }); return
    }
    next()
  })
  router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, skipSuccessfulRequests: true, message: { success: false, message: 'Too many sign-in attempts. Please try again in 15 minutes.' } }), async (req, res, next) => {
    try {
      const parsed = z.object({ email, password: z.string().min(1).max(256) }).safeParse(req.body)
      if (!parsed.success) { res.status(400).json({ success: false, message: 'Enter a valid email and password.' }); return }
      const session = await authenticate(parsed.data.email, parsed.data.password)
      res.locals.admin = { id: session.id, email: session.email, name: session.name }
      res.cookie(sessionCookie, session.token, cookieOptions()).json({ success: true, data: res.locals.admin })
    } catch (error) { next(error) }
  })
  router.use(requireAdmin)
  router.post('/content-images', raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), async (req, res, next) => {
    try {
      const data = req.body
      const contentType = req.get('Content-Type')
      const valid = Buffer.isBuffer(data) && data.length > 12 && (
        (contentType === 'image/jpeg' && data.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) ||
        (contentType === 'image/png' && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
        (contentType === 'image/webp' && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP'))
      if (!valid) { res.status(400).json({ success: false, message: 'Choose a JPEG, PNG or WebP image up to 5 MB.' }); return }
      const record = await insertRecord('contentimages', { data: data.toString('base64'), contentType })
      res.status(201).json({ success: true, data: { id: record.id, src: `/api/content/images/${record.id}` } })
    } catch (error) { next(error) }
  })
  for (const name of ['news', 'programs', 'teammembers'] as const) router.get(`/${name === 'teammembers' ? 'team' : name}`, async (_req, res, next) => {
    try { res.json({ success: true, data: await listRecords(name) }) } catch (error) { next(error) }
  })
  router.get('/session', (_req, res) => { res.json({ success: true, data: res.locals.admin }) })
  router.patch('/profile', async (req, res, next) => {
    try {
      const parsed = z.object({ name: z.string().trim().min(2, 'Enter your full name.').max(120) }).safeParse(req.body)
      if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.issues[0]?.message }); return }
      const user = await updateRecord('adminusers', res.locals.admin.id, parsed.data)
      res.locals.admin = { id: user.id, name: String(user.name), email: String(user.email) }
      res.json({ success: true, data: res.locals.admin })
    } catch (error) { next(error) }
  })
  router.post('/password', rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Too many password attempts. Try again in 15 minutes.' } }), async (req, res, next) => {
    try {
      const parsed = z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(12, 'Use at least 12 characters.').max(256) }).safeParse(req.body)
      if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.issues[0]?.message }); return }
      const session = await changeAdminPassword(res.locals.admin.id, parsed.data.currentPassword, parsed.data.newPassword)
      res.cookie(sessionCookie, session.token, cookieOptions()).json({ success: true })
    } catch (error) { next(error) }
  })
  router.get('/admins', async (_req, res, next) => {
    try { res.json({ success: true, data: (await listRecords('adminusers')).map(publicAdmin) }) } catch (error) { next(error) }
  })
  router.post('/admins', async (req, res, next) => {
    try {
      const parsed = z.object({ name: z.string().trim().min(2).max(120), email, password: z.string().min(12, 'Use at least 12 characters for the password.').max(256) }).safeParse(req.body)
      if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Check the account details.' }); return }
      const user = await createAdmin(parsed.data.email, parsed.data.password, { name: parsed.data.name, createdBy: res.locals.admin.id })
      res.status(201).json({ success: true, data: publicAdmin(user) })
    } catch (error) { next(error) }
  })
  router.get('/analytics', async (req, res, next) => {
    try {
      const parsed = z.coerce.number().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])).safeParse(req.query.days || 30)
      if (!parsed.success) { res.status(400).json({ success: false, message: 'Choose 7, 30 or 90 days.' }); return }
      res.json({ success: true, data: await getAnalytics(parsed.data) })
    } catch (error) { next(error) }
  })
  router.get('/audit-logs', async (req, res, next) => {
    try {
      const parsed = auditQuerySchema.safeParse(req.query)
      if (!parsed.success) { res.status(400).json({ success: false, message: 'Choose valid log filters.' }); return }
      res.json({ success: true, data: await getAuditLogs(parsed.data) })
    } catch (error) { next(error) }
  })
  router.post('/activity', async (req, res, next) => {
    try {
      const parsed = adminActivitySchema.safeParse(req.body)
      if (!parsed.success) { res.status(400).json({ success: false, message: 'Invalid activity.' }); return }
      const event = parsed.data
      await writeAudit({ eventKey: `admin-ui:${event.eventId}`, action: `admin.${event.action || event.type}`, category: event.type === 'export' ? 'system' : 'interface',
        description: event.type === 'page_view' ? `Opened ${event.path}` : event.type === 'export' ? `Exported ${event.action === 'subscribers.export' ? 'newsletter subscribers' : 'outreach records'}` : `Activated a control on ${event.path}`,
        actorType: 'admin', actorId: res.locals.admin.id, actorEmail: res.locals.admin.email, source: 'browser', outcome: 'success', path: event.path })
      res.status(202).json({ success: true })
    } catch (error) { next(error) }
  })
  router.post('/logout', async (req, res, next) => {
    try { await endSession(req); const { maxAge: _maxAge, ...options } = cookieOptions(); res.clearCookie(sessionCookie, options).json({ success: true }) }
    catch (error) { next(error) }
  })
  router.get('/workspace', async (_req, res, next) => {
    try {
      const [outreaches, volunteers, donations, contactmessages, subscribers] = await Promise.all([
        listRecords('outreaches'), listRecords('volunteers'), listRecords('donations'), listRecords('contactmessages'), listRecords('newslettersubscribers'),
      ])
      const messages = contactmessages.map(record => ({ ...record, date: String(record.createdAt).slice(0, 10), read: record.status !== 'new' }))
      res.json({ success: true, data: { outreaches, volunteers, donations, messages, subscribers }, storage: storageMode() })
    } catch (error) { next(error) }
  })
  const resources: { name: Collection; path?: string; schema: z.ZodTypeAny; uniqueKeys: string[] }[] = [
    { name: 'outreaches', schema: outreachSchema, uniqueKeys: [] },
    { name: 'volunteers', schema: volunteerSchema, uniqueKeys: ['email'] },
    { name: 'donations', schema: donationSchema, uniqueKeys: [] },
    { name: 'programs', schema: programContentSchema, uniqueKeys: [] },
    { name: 'news', schema: newsSchema, uniqueKeys: [] },
    { name: 'teammembers', path: 'team', schema: teamProfileSchema, uniqueKeys: [] },
  ]
  for (const resource of resources) {
    const route = resource.path || resource.name
    router.post(`/${route}`, async (req, res, next) => {
      try {
        const parsed = resource.schema.safeParse(req.body)
        if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Please check the form fields.', errors: parsed.error.flatten() }); return }
        const record = await insertRecord(resource.name, parsed.data, resource.uniqueKeys)
        res.status(201).json({ success: true, data: record })
      } catch (error) { next(error) }
    })
    router.patch(`/${route}/:id`, async (req, res, next) => {
      try {
        if (resource.name === 'donations' && (await findRecord('donations', 'id', String(req.params.id)))?.source === 'paystack') throw new HttpError(409, 'Verified Paystack records cannot be edited. Manage refunds through Paystack.')
        const parsed = resource.schema.safeParse(req.body)
        if (!parsed.success) { res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Please check the form fields.', errors: parsed.error.flatten() }); return }
        const record = await updateRecord(resource.name, String(req.params.id), parsed.data, resource.uniqueKeys)
        res.json({ success: true, data: record })
      } catch (error) { next(error) }
    })
  }
  router.patch('/messages/:id', async (req, res, next) => {
    try {
      const parsed = z.object({ status: z.enum(['new', 'read', 'responded', 'archived']) }).safeParse(req.body)
      if (!parsed.success) { res.status(400).json({ success: false, message: 'Choose a valid message status.' }); return }
      const record = await updateRecord('contactmessages', String(req.params.id), parsed.data)
      res.json({ success: true, data: record })
    } catch (error) { next(error) }
  })
  router.patch('/subscribers/:id', async (req, res, next) => {
    try {
      const parsed = z.object({ status: z.enum(['subscribed', 'unsubscribed']) }).safeParse(req.body)
      if (!parsed.success) { res.status(400).json({ success: false, message: 'Choose a valid subscription status.' }); return }
      const record = await updateRecord('newslettersubscribers', String(req.params.id), parsed.data)
      res.json({ success: true, data: record })
    } catch (error) { next(error) }
  })
  return router
}
