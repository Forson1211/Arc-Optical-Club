import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { email } from '../lib/validation.js'
import { findRecord, HttpError, insertRecord, updateRecord } from '../lib/store.js'

const subscriberSchema = z.object({ email })

export async function subscribeToNewsletter(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = subscriberSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' })
      return
    }
    const existing = await findRecord('newslettersubscribers', 'email', parsed.data.email)
    if (existing) await updateRecord('newslettersubscribers', existing.id, { status: 'subscribed' })
    else {
      try { await insertRecord('newslettersubscribers', { email: parsed.data.email, status: 'subscribed' }, ['email']) }
      catch (error) {
        if (!(error instanceof HttpError) || error.status !== 409) throw error
        const concurrent = await findRecord('newslettersubscribers', 'email', parsed.data.email)
        if (concurrent) await updateRecord('newslettersubscribers', concurrent.id, { status: 'subscribed' })
      }
    }
    res.status(201).json({ success: true, message: 'Thank you for subscribing.' })
  } catch (error) {
    next(error)
  }
}
