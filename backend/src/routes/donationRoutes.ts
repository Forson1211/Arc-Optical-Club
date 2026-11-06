import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import { donationCheckoutSchema, initializeDonation, paymentReference, recordVerifiedCharge, validWebhookSignature, verifyDonation } from '../lib/payments.js'
import { HttpError } from '../lib/store.js'

export function donationRoutes(allowedOrigins: string[], fetcher: typeof fetch) {
  const router = Router()
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })
  router.post('/initialize', rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false }), async (req, res, next) => {
    try {
      const origin = req.get('Origin') || ''
      if (!allowedOrigins.includes(origin)) throw new HttpError(403, 'Please use the donation form on the Arc website.')
      const parsed = donationCheckoutSchema.safeParse(req.body)
      if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message || 'Check your donation details.')
      res.status(201).json({ success: true, data: await initializeDonation(parsed.data, origin, fetcher) })
    } catch (error) { next(error) }
  })
  router.get('/verify/:reference', rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false }), async (req, res, next) => {
    try {
      const reference = paymentReference.safeParse(req.params.reference)
      if (!reference.success) throw new HttpError(400, 'This donation reference is not valid.')
      res.json({ success: true, data: await verifyDonation(reference.data, fetcher) })
    } catch (error) { next(error) }
  })
  return router
}

// Mounted before JSON parsing so signatures are checked against the original bytes.
export async function paystackWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    if (!Buffer.isBuffer(req.body) || !validWebhookSignature(req.body, req.get('Paystack-Signature') || '', req.get('X-Paystack-Signature') || '')) throw new HttpError(401, 'Invalid payment notification signature.')
    let event: { event?: string; data?: unknown }
    try { event = JSON.parse(req.body.toString('utf8')) } catch { throw new HttpError(400, 'Invalid payment notification.') }
    if (!event || typeof event !== 'object') throw new HttpError(400, 'Invalid payment notification.')
    const reference = event.data && typeof event.data === 'object' && 'reference' in event.data ? event.data.reference : ''
    if (event.event === 'charge.success' && paymentReference.safeParse(reference).success) {
      try { await recordVerifiedCharge(event.data) }
      catch (error) { if (!(error instanceof HttpError) || error.status !== 404) throw error /* Ignore charges from other integrations on this account. */ }
    }
    res.sendStatus(200)
  } catch (error) { next(error) }
}
