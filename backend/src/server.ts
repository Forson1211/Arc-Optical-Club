import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { connectDatabase } from './config/database.js'
import contactRoutes from './routes/contactRoutes.js'
import newsletterRoutes from './routes/newsletterRoutes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 150, standardHeaders: 'draft-7', legacyHeaders: false }))

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Arc Optical Club API is running.' })
})

app.use('/api/contact', contactRoutes)
app.use('/api/newsletter', newsletterRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

connectDatabase()
  .then(() => app.listen(port, () => console.log(`Arc Optical Club API listening on port ${port}`)))
  .catch((error) => {
    console.error('Failed to initialize server:', error)
    process.exit(1)
  })
