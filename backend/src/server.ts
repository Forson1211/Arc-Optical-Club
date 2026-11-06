import 'dotenv/config'
import { connectDatabase } from './config/database.js'
import { createApp } from './app.js'
import { initializeStorage, listRecords, storageMode } from './lib/store.js'
import { createAdmin } from './lib/auth.js'

const port = Number(process.env.PORT) || 5001

connectDatabase()
  .then(initializeStorage)
  .then(async () => {
    const admins = await listRecords('adminusers')
    if (!admins.length && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await createAdmin(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD)
      console.log('Initial administrator created from server environment.')
    } else if (!admins.length) {
      console.log('No administrator exists yet. Run npm run setup:admin --workspace backend to create your account.')
    }
    createApp().listen(port, () => {
      console.log(`Arc Optical Club API listening on port ${port} (${storageMode()} storage).`)
      if (process.send) process.send({ type: 'api-ready', port })
    }).once('error', error => {
      console.error(`Could not start the API on port ${port}:`, error.message)
      process.exit(1)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize server:', error)
    process.exit(1)
  })
