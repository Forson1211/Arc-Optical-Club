import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { insertRecord } from '../lib/store.js'
import { joinSchema } from '../lib/validation.js'

const router = Router()
router.post('/', rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Too many applications. Please try again later.' } }), async (req, res, next) => {
  try {
    const parsed = joinSchema.safeParse(req.body)
    if (!parsed.success) { res.status(400).json({ success: false, message: 'Please check the highlighted fields.', errors: parsed.error.flatten() }); return }
    const { website: _website, ...application } = parsed.data
    const record = await insertRecord('volunteers', { ...application, status: 'Pending', source: 'join-form', consentAt: new Date().toISOString() }, ['email'])
    res.status(201).json({ success: true, message: 'Your application has been received. Our team will review it and get in touch.', data: { id: record.id } })
  } catch (error) { next(error) }
})
export default router
