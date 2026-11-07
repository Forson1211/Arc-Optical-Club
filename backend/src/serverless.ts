import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Express } from 'express'
import { createApp } from './app.js'
import { connectDatabase } from './config/database.js'
import { createAdmin } from './lib/auth.js'
import { HttpError, initializeStorage, listRecords } from './lib/store.js'

async function initializeApp() {
  // Never serve requests with uninitialized storage or use temporary serverless
  // files as a substitute for the production database.
  const missing = ['MONGODB_URI', 'CLIENT_URL'].filter(key => !process.env[key]?.trim())
  if (missing.length) throw new Error(`Missing server environment variables: ${missing.join(', ')}`)
  const app = createApp()
  await connectDatabase()
  await initializeStorage()
  const admins = await listRecords('adminusers')
  if (!admins.length && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    try { await createAdmin(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD) }
    catch (error) {
      // Two cold instances can both attempt the initial account. The unique
      // email index makes the second insert harmless, without hiding other errors.
      if (!(error instanceof HttpError) || error.status !== 409) throw error
    }
  }
  return app
}

export function createServerlessHandler(initialize: () => Promise<Express> = initializeApp) {
  let startup: Promise<Express> | undefined
  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Share startup across simultaneous requests. A failure must remain
      // retryable instead of marking a broken instance as initialized forever.
      startup ||= initialize().catch(error => { startup = undefined; throw error })
      const app = await startup
      return app(req, res)
    } catch (error) {
      // Log diagnostic names only; MongoDB errors may include credentials/hosts.
      const missing = ['MONGODB_URI', 'CLIENT_URL'].filter(key => !process.env[key]?.trim())
      const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'number' ? error.code : undefined
      console.error('API startup failed:', missing.length ? `Set ${missing.join(', ')} in the hosting environment.` : error instanceof Error ? error.name : 'UnknownError', code ?? '')
      res.statusCode = 503
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('Retry-After', '15')
      res.end(JSON.stringify({ success: false, code: missing.length ? 'API_CONFIGURATION_REQUIRED' : 'API_STARTUP_FAILED',
        message: 'The server is temporarily unavailable. Please try again shortly.' }))
    }
  }
}
