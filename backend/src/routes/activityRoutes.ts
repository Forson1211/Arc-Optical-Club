import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { eventSchema, recordSiteEvent } from '../lib/activity.js'

const router = Router()
router.post('/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Activity rate limit reached.' } }), async (req, res, next) => {
  try {
    const parsed = z.object({ events: z.array(eventSchema).min(1).max(20) }).safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ success: false, message: 'Invalid activity event.' }); return }
    for (const event of parsed.data.events) await recordSiteEvent(event)
    res.status(202).json({ success: true })
  } catch (error) { next(error) }
})
export default router
