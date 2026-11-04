import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ContactMessage } from '../models/ContactMessage.js'

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(180),
  subject: z.string().trim().min(2).max(180),
  message: z.string().trim().min(10).max(5000),
})

export async function createContactMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = contactSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Please check the form fields.', errors: parsed.error.flatten() })
      return
    }
    const message = await ContactMessage.create(parsed.data)
    res.status(201).json({ success: true, message: 'Your message has been received.', data: { id: message.id } })
  } catch (error) {
    next(error)
  }
}
