import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js'

const subscriberSchema = z.object({ email: z.string().trim().email().max(180) })

export async function subscribeToNewsletter(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = subscriberSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' })
      return
    }
    await NewsletterSubscriber.updateOne(
      { email: parsed.data.email.toLowerCase() },
      { $set: { status: 'subscribed' }, $setOnInsert: { email: parsed.data.email.toLowerCase() } },
      { upsert: true },
    )
    res.status(201).json({ success: true, message: 'Thank you for subscribing.' })
  } catch (error) {
    next(error)
  }
}
