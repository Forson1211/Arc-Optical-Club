import { createHash } from 'node:crypto'
import mongoose from 'mongoose'
import { z } from 'zod'
import type { NextFunction, Request, Response } from 'express'
import { HttpError, insertRecord, listRecords, storageMode } from './store.js'

export const publicPaths = ['/', '/about', '/programs', '/contact', '/team', '/join', '/gallery', '/academy', '/research', '/donate', '/news', '/404'] as const
export const eventSchema = z.object({
  eventId: z.string().uuid(), visitorId: z.string().uuid(), sessionId: z.string().uuid(),
  type: z.enum(['page_view', 'click']), path: z.enum(publicPaths),
  target: z.enum(publicPaths).optional(), element: z.enum(['link', 'button', 'control']).optional(),
  referrerHost: z.string().max(180).regex(/^[a-z\d.-]*$/i).optional(),
})
export const adminActivitySchema = z.object({
  eventId: z.string().uuid(), type: z.enum(['page_view', 'click', 'export']),
  path: z.enum(['/admin', '/admin/outreaches', '/admin/programs', '/admin/news', '/admin/team', '/admin/volunteers', '/admin/donations', '/admin/messages', '/admin/subscribers', '/admin/reports', '/admin/settings', '/admin/analytics', '/admin/admins', '/admin/audit-logs']),
  action: z.enum(['navigation', 'button', 'outreach.export', 'subscribers.export', 'analytics.period']).optional(),
})

export type AuditInput = {
  action: string; category: string; description: string; outcome: 'success' | 'failure';
  actorType: 'admin' | 'visitor' | 'system'; actorId?: string; actorEmail?: string;
  source: 'server' | 'browser'; path?: string; resourceId?: string; statusCode?: number; eventKey?: string
}

export async function writeAudit(entry: AuditInput) {
  try { await insertRecord('auditlogs', entry, entry.eventKey ? ['eventKey'] : []) }
  catch (error) { if (!(error instanceof HttpError) || error.status !== 409) throw error }
}

export async function recordSiteEvent(event: z.infer<typeof eventSchema>) {
  try { await insertRecord('siteevents', event, ['eventId']) }
  catch (error) { if (!(error instanceof HttpError) || error.status !== 409) throw error }
  // Also repair an audit entry if a previous attempt saved the event but its
  // audit write failed. Both keys are unique, so retries never inflate counts.
  await writeAudit({ eventKey: `visit:${event.eventId}`, action: event.type === 'page_view' ? 'site.page_view' : 'site.interaction', category: 'traffic',
    description: event.type === 'page_view' ? `Viewed ${event.path}` : event.target ? `Followed a link from ${event.path} to ${event.target}` : `Activated ${event.element || 'control'} on ${event.path}`,
    actorType: 'visitor', actorId: createHash('sha256').update(event.visitorId).digest('hex').slice(0, 12), source: 'browser', outcome: 'success', path: event.path })
}

// Delay JSON responses until their audit entry is saved. Only fixed metadata
// is captured: never request bodies, passwords, messages or form field values.
export function auditApiRequests(req: Request, res: Response, next: NextFunction) {
  const path = req.path
  const send = res.json.bind(res)
  let captured = false
  res.json = ((body: unknown) => {
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
    const accessDenied = path.startsWith('/api/admin/') && path !== '/api/admin/session' && [401, 403].includes(res.statusCode)
    if (captured || path === '/api/activity' || (path === '/api/admin/activity' && res.statusCode < 400) || (!mutation && !accessDenied) || !path.startsWith('/api/')) return send(body)
    captured = true
    const statusCode = res.statusCode
    const success = statusCode < 400
    let action = 'api.request', category = 'system', description = 'API request'
    if (path === '/api/join') { action = 'application.submitted'; category = 'community'; description = 'Volunteer application submitted' }
    else if (path === '/api/contact') { action = 'contact.submitted'; category = 'community'; description = 'Contact enquiry submitted' }
    else if (path === '/api/newsletter') { action = 'newsletter.subscribed'; category = 'community'; description = 'Newsletter subscription requested' }
    else if (path === '/api/donations/initialize') { action = 'donation.checkout_started'; category = 'giving'; description = 'Donation checkout requested' }
    else if (path === '/api/admin/login') { action = 'admin.login'; category = 'security'; description = 'Administrator sign-in' }
    else if (path === '/api/admin/logout') { action = 'admin.logout'; category = 'security'; description = 'Administrator signed out' }
    else if (path === '/api/admin/profile') { action = 'admin.profile_updated'; category = 'security'; description = 'Administrator profile updated' }
    else if (path === '/api/admin/password') { action = 'admin.password_changed'; category = 'security'; description = 'Administrator password changed' }
    else if (path === '/api/admin/admins' && req.method === 'POST') { action = 'admin.created'; category = 'security'; description = 'Administrator account created' }
    else {
      const resource = path.match(/^\/api\/admin\/(outreaches|volunteers|donations|messages|subscribers|programs|news|team|content-images)(?:\/[^/]+)?$/)?.[1]
      if (resource) { action = `${resource}.${req.method === 'POST' ? 'created' : 'updated'}`; category = resource === 'donations' ? 'giving' : ['outreaches', 'programs', 'news', 'content-images'].includes(resource) ? 'programs' : 'community'; description = `${resource[0].toUpperCase() + resource.slice(1)} ${req.method === 'POST' ? 'record created' : 'record updated'}` }
      else if (accessDenied) { action = 'admin.access_denied'; category = 'security'; description = 'Admin access denied' }
    }
    const admin = res.locals.admin as { id: string; email: string } | undefined
    const data = body && typeof body === 'object' && 'data' in body ? (body as { data?: { id?: string } }).data : undefined
    const resourceId = typeof data?.id === 'string' ? data.id : path.split('/').at(-1)
    const safeId = resourceId && /^[a-f\d-]{24,36}$/i.test(resourceId) ? resourceId : undefined
    const knownPath = /^\/api\/(join|contact|newsletter|admin\/(login|logout|session|workspace|admins|analytics|audit-logs|profile|password))$/.test(path)
    const safePath = knownPath ? path : /^\/api\/admin\/(outreaches|volunteers|donations|messages|subscribers|programs|news|team|content-images)(\/[^/]+)?$/.test(path) ? path.replace(/(\/api\/admin\/[^/]+)\/.+$/, '$1/:id') : '/api/:unknown'
    void writeAudit({ action, category, description: success ? description : `${description} — unsuccessful`, outcome: success ? 'success' : 'failure', source: 'server',
      actorType: admin ? 'admin' : 'visitor', actorId: admin?.id, actorEmail: admin?.email, statusCode, path: safePath, resourceId: safeId })
      .then(() => send(body)).catch(error => { res.status(503); next(new HttpError(503, 'The activity log could not be saved. Check your records before retrying this action.')); console.error('Audit persistence failed:', error.name) })
    return res
  }) as Response['json']
  next()
}

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1), limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(['all', 'traffic', 'security', 'community', 'programs', 'giving', 'interface', 'system']).default('all'),
  outcome: z.enum(['all', 'success', 'failure']).default('all'), q: z.string().trim().max(120).default(''),
  days: z.coerce.number().int().min(1).max(365).default(30),
})

export async function getAuditLogs(query: z.infer<typeof auditQuerySchema>) {
  const from = new Date(Date.now() - query.days * 86400000).toISOString()
  const filter: Record<string, unknown> = { createdAt: { $gte: from } }
  if (query.category !== 'all') filter.category = query.category
  if (query.outcome !== 'all') filter.outcome = query.outcome
  if (query.q) { const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = ['description', 'actorEmail', 'action', 'path'].map(field => ({ [field]: { $regex: escaped, $options: 'i' } })) }
  if (storageMode() === 'mongodb') {
    const collection = mongoose.connection.collection('auditlogs')
    const [records, total] = await Promise.all([collection.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).toArray(), collection.countDocuments(filter)])
    return { records: records.map(({ _id, ...record }) => record), total, page: query.page, limit: query.limit }
  }
  const records = (await listRecords('auditlogs')).filter(record => record.createdAt >= from && (query.category === 'all' || record.category === query.category) && (query.outcome === 'all' || record.outcome === query.outcome) && (!query.q || [record.description, record.actorEmail, record.action, record.path].join(' ').toLowerCase().includes(query.q.toLowerCase()))).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { records: records.slice((query.page - 1) * query.limit, query.page * query.limit), total: records.length, page: query.page, limit: query.limit }
}
