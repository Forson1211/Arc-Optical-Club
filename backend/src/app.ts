import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import contactRoutes from './routes/contactRoutes.js'
import newsletterRoutes from './routes/newsletterRoutes.js'
import joinRoutes from './routes/joinRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import contentRoutes from './routes/contentRoutes.js'
import { donationRoutes, paystackWebhook } from './routes/donationRoutes.js'
import { auditApiRequests } from './lib/activity.js'
import { adminRoutes } from './routes/adminRoutes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { storageMode } from './lib/store.js'

export function createApp({ paymentFetch = fetch }: { paymentFetch?: typeof fetch } = {}) {
  const app = express()
  const production = process.env.NODE_ENV === 'production'
  if (production && !process.env.CLIENT_URL) throw new Error('CLIENT_URL must be configured in production.')
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(origin => origin.trim()).filter(Boolean)
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors({ origin: allowedOrigins, credentials: true }))
  app.post('/api/donations/webhook', express.raw({ type: 'application/json', limit: '64kb' }), paystackWebhook)
  app.use(auditApiRequests)
  app.use(express.json({ limit: '64kb' }))
  app.use(express.urlencoded({ extended: false, limit: '64kb' }))
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Too many requests. Please try again shortly.' } }))
  app.get('/api/health', (_req, res) => { res.json({ success: true, message: 'Arc Optical Club API is running.', storage: storageMode() }) })
  app.use('/api/join', joinRoutes)
  app.use('/api/contact', contactRoutes)
  app.use('/api/newsletter', newsletterRoutes)
  app.use('/api/activity', activityRoutes)
  app.use('/api/content', contentRoutes)
  app.use('/api/donations', donationRoutes(allowedOrigins, paymentFetch))
  app.use('/api/admin', adminRoutes(allowedOrigins))
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
