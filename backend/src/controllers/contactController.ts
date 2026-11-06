import type { Request, Response, NextFunction } from 'express'
import { contactSchema } from '../lib/validation.js'
import { insertRecord } from '../lib/store.js'

export async function createContactMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = contactSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Please check the form fields.', errors: parsed.error.flatten() })
      return
    }
    const message = await insertRecord('contactmessages', { ...parsed.data, status: 'new' })
    res.status(201).json({ success: true, message: 'Your message has been received.', data: { id: message.id } })
  } catch (error) {
    next(error)
  }
}
