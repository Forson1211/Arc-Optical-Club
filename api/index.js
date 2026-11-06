import { createApp } from '../backend/dist/app.js'
import { connectDatabase } from '../backend/dist/config/database.js'
import { initializeStorage, listRecords } from '../backend/dist/lib/store.js'
import { createAdmin } from '../backend/dist/lib/auth.js'

let initialized = false
let app

export default async function handler(req, res) {
  if (!initialized) {
    if (process.env.MONGODB_URI) {
      try {
        await connectDatabase()
        await initializeStorage()
        const admins = await listRecords('adminusers').catch(() => [])
        if (!admins.length && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
          await createAdmin(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD).catch(console.error)
        }
      } catch (err) {
        console.error('Database connection error in serverless handler:', err)
      }
    }
    app = createApp()
    initialized = true
  }
  return app(req, res)
}
