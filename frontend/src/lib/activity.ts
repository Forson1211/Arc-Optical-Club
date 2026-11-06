import { api } from './api'

const paths = ['/', '/about', '/programs', '/contact', '/team', '/join', '/gallery', '/academy', '/research', '/donate', '/news', '/404']
export const publicPath = (path: string) => path.startsWith('/donate/') ? '/donate' : /^\/news\/[^/]+\/?$/.test(path) ? '/news' : paths.includes(path.replace(/\/$/, '') || '/') ? path.replace(/\/$/, '') || '/' : '/404'
type SiteEvent = { eventId: string; visitorId: string; sessionId: string; type: 'page_view' | 'click'; path: string; target?: string; element?: 'link' | 'button' | 'control'; referrerHost?: string }
const queueKey = 'arc-traffic-pending-v1'
let fallbackVisitor = '', fallbackSession = '', lastActive = 0
let queue: SiteEvent[] = []
try { const saved = JSON.parse(localStorage.getItem(queueKey) || '[]'); if (Array.isArray(saved)) queue = saved.filter(e => e && paths.includes(e.path) && ['page_view', 'click'].includes(e.type)).slice(-200) } catch { /* Storage may be disabled. */ }
let flushing = false
const endpoint = (path: string) => `${String(api.defaults.baseURL).replace(/\/$/, '')}${path}`
const persist = () => { try { localStorage.setItem(queueKey, JSON.stringify(queue)) } catch { /* Continue in memory. */ } }

function identity() {
  const now = Date.now()
  let visitorId = fallbackVisitor ||= crypto.randomUUID()
  let sessionId = fallbackSession
  try {
    const visitor = localStorage.getItem('arc-visitor-v1')
    if (visitor && /^[a-f\d-]{36}$/i.test(visitor)) visitorId = visitor
    else localStorage.setItem('arc-visitor-v1', visitorId)
    const session = JSON.parse(sessionStorage.getItem('arc-visit-v1') || 'null')
    if (session?.id && /^[a-f\d-]{36}$/i.test(session.id) && now - session.active < 1800000) sessionId = session.id
    else sessionId = crypto.randomUUID()
    sessionStorage.setItem('arc-visit-v1', JSON.stringify({ id: sessionId, active: now }))
  } catch { if (!sessionId || now - lastActive > 1800000) sessionId = crypto.randomUUID() }
  fallbackSession = sessionId; lastActive = now
  return { visitorId, sessionId }
}

export function trackSite(type: SiteEvent['type'], path: string, extra: Pick<SiteEvent, 'target' | 'element' | 'referrerHost'> = {}) {
  queue.push({ eventId: crypto.randomUUID(), ...identity(), type, path: publicPath(path), ...extra })
  queue = queue.slice(-200); persist(); void flushTraffic()
}

export async function flushTraffic() {
  if (flushing || !queue.length || !navigator.onLine) return
  flushing = true
  try {
    while (queue.length) {
      const batch = queue.slice(0, 20)
      const response = await fetch(endpoint('/activity'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: batch }), keepalive: true, signal: AbortSignal.timeout(10000) })
      if (!response.ok && (response.status === 429 || response.status >= 500)) break
      const sent = new Set(batch.map(e => e.eventId)); queue = queue.filter(e => !sent.has(e.eventId)); persist()
    }
  } catch { /* Retry on connection recovery or the next timer tick. */ }
  finally { flushing = false }
}

// Fixed metadata only: never input values, button text, or private records.
export function trackAdmin(type: 'page_view' | 'click' | 'export', path: string, action?: 'navigation' | 'button' | 'outreach.export' | 'subscribers.export' | 'analytics.period') {
  const body = JSON.stringify({ eventId: crypto.randomUUID(), type, path: path.replace(/\/$/, '') || '/admin', action })
  void (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(endpoint('/admin/activity'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ArcAdmin' }, body, keepalive: true, signal: AbortSignal.timeout(10000) })
        if (response.ok || (response.status < 500 && response.status !== 429)) return
      } catch { /* Transient connection failure. */ }
      await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)))
    }
  })()
}
