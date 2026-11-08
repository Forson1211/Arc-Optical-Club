import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import mongoose from 'mongoose'
import { initialPrograms, legacyProgramDetails } from '../data/programs.js'
import { initialTeam } from '../data/team.js'
import { initialPartners } from '../data/partners.js'

export const collections = ['outreaches', 'volunteers', 'donations', 'contactmessages', 'newslettersubscribers', 'adminusers', 'adminsessions', 'auditlogs', 'siteevents', 'programs', 'news', 'contentimages', 'paymentattempts', 'teammembers', 'partners'] as const
export type Collection = typeof collections[number]
export type RecordData = { id: string; createdAt: string; updatedAt: string; [key: string]: unknown }
type LocalDatabase = Record<Collection, RecordData[]>
let localData: LocalDatabase
let writeQueue: Promise<unknown> = Promise.resolve()
let databaseFile = ''
let mode: 'local' | 'mongodb' = 'local'

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export async function initializeStorage() {
  if (mongoose.connection.readyState === 1) {
    mode = 'mongodb'
    for (const name of ['volunteers', 'newslettersubscribers', 'adminusers'] as const) {
      await mongoose.connection.collection(name).createIndex({ email: 1 }, { unique: true, sparse: true })
    }
    await mongoose.connection.collection('adminsessions').createIndex({ tokenHash: 1 }, { unique: true })
    await mongoose.connection.collection('adminsessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    await mongoose.connection.collection('siteevents').createIndex({ eventId: 1 }, { unique: true })
    await mongoose.connection.collection('siteevents').createIndex({ createdAt: -1, type: 1 })
    await mongoose.connection.collection('auditlogs').createIndex({ eventKey: 1 }, { unique: true, sparse: true })
    await mongoose.connection.collection('auditlogs').createIndex({ createdAt: -1 })
    await mongoose.connection.collection('auditlogs').createIndex({ category: 1, createdAt: -1 })
    await mongoose.connection.collection('programs').createIndex({ initialKey: 1 }, { unique: true, sparse: true })
    await mongoose.connection.collection('teammembers').createIndex({ initialKey: 1 }, { unique: true, sparse: true })
    await mongoose.connection.collection('partners').createIndex({ initialKey: 1 }, { unique: true, sparse: true })
    await mongoose.connection.collection('paymentattempts').createIndex({ reference: 1 }, { unique: true })
    await mongoose.connection.collection('donations').createIndex({ paymentReference: 1 }, { unique: true, sparse: true })
    await seedPrograms()
    await seedTeam()
    await seedPartners()
    return
  }
  if (process.env.NODE_ENV === 'production') throw new Error('MongoDB is required in production. Set MONGODB_URI before starting the API.')
  mode = 'local'
  const directory = process.env.DATA_DIRECTORY || fileURLToPath(new URL('../../.data/', import.meta.url))
  await mkdir(directory, { recursive: true, mode: 0o700 })
  databaseFile = path.join(directory, 'arc-database.json')
  try {
    const stored = JSON.parse(await readFile(databaseFile, 'utf8'))
    // Upgrade existing local workspaces without replacing their records.
    for (const name of ['auditlogs', 'siteevents', 'programs', 'news', 'contentimages', 'paymentattempts', 'teammembers', 'partners']) if (stored[name] === undefined) stored[name] = []
    if (!collections.every(name => Array.isArray(stored[name]))) throw new Error('Invalid local database format. Restore it from a backup before restarting.')
    localData = stored
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    localData = Object.fromEntries(collections.map(name => [name, []])) as unknown as LocalDatabase
    await persist(localData)
  }
  await seedPrograms()
  await seedTeam()
  await seedPartners()
}

async function seedPartners() {
  for (const [index, partner] of initialPartners.entries()) {
    const initialKey = `concept-partner-${index}`
    if (await findRecord('partners', 'initialKey', initialKey)) continue
    try { await insertRecord('partners', { ...partner, initialKey }, ['initialKey']) }
    catch (error) { if (!(error instanceof HttpError) || error.status !== 409) throw error }
  }
}

async function seedPrograms() {
  for (const [order, program] of initialPrograms.entries()) {
    const initialKey = `initial-${order}`
    const existing = await findRecord('programs', 'initialKey', initialKey)
    if (existing) {
      if (existing.title === program.title && legacyProgramDetails[order].includes(String(existing.detail))) {
        const changes = { detail: program.detail, updatedAt: new Date().toISOString() }
        if (mode === 'mongodb') {
          await mongoose.connection.collection('programs').updateOne({ id: existing.id, title: program.title, detail: existing.detail }, { $set: changes })
        } else await mutate(draft => {
          const record = draft.programs.find(item => item.id === existing.id && item.title === program.title && item.detail === existing.detail)
          if (record) Object.assign(record, changes)
        })
      }
      continue
    }
    try { await insertRecord('programs', { ...program, initialKey, order, status: 'published' }, ['initialKey']) }
    catch (error) { if (!(error instanceof HttpError) || error.status !== 409) throw error }
  }
}

async function seedTeam() {
  for (const [index, member] of initialTeam.entries()) {
    const initialKey = `concept-team-${index}`
    if (await findRecord('teammembers', 'initialKey', initialKey)) continue
    try { await insertRecord('teammembers', { ...member, initialKey }, ['initialKey']) }
    catch (error) { if (!(error instanceof HttpError) || error.status !== 409) throw error }
  }
}

export const storageMode = () => mode

async function persist(data: LocalDatabase) {
  const temporaryFile = `${databaseFile}.${randomUUID()}.tmp`
  await writeFile(temporaryFile, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 })
  await rename(temporaryFile, databaseFile)
}

async function mutate<T>(operation: (draft: LocalDatabase) => T): Promise<T> {
  const result = writeQueue.then(async () => {
    const draft = structuredClone(localData)
    const output = operation(draft)
    await persist(draft)
    localData = draft
    return output
  })
  writeQueue = result.catch(() => undefined)
  return result
}

function normalize(document: { [key: string]: unknown }): RecordData {
  const { _id, ...rest } = document
  const fields = Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]))
  return { ...fields, id: String(rest.id || _id) } as RecordData
}

export async function listRecords(collection: Collection): Promise<RecordData[]> {
  if (mode === 'mongodb') return (await mongoose.connection.collection(collection).find({}).toArray()).map(normalize)
  await writeQueue
  return structuredClone(localData[collection])
}

export async function findRecord(collection: Collection, key: string, value: string): Promise<RecordData | undefined> {
  if (mode === 'mongodb') {
    const result = await mongoose.connection.collection(collection).findOne({ [key]: value })
    return result ? normalize(result) : undefined
  }
  await writeQueue
  return structuredClone(localData[collection].find(record => record[key] === value))
}

export async function insertRecord(collection: Collection, data: object, uniqueKeys: string[] = []): Promise<RecordData> {
  const now = new Date().toISOString()
  const record: RecordData = { ...data, id: randomUUID(), createdAt: now, updatedAt: now }
  if (mode === 'mongodb') {
    try { await mongoose.connection.collection(collection).insertOne({ ...record }); return record }
    catch (error) { if ((error as { code?: number }).code === 11000) throw new HttpError(409, 'A record with this email already exists.'); throw error }
  }
  return mutate(draft => {
    if (uniqueKeys.some(key => draft[collection].some(existing => existing[key] === record[key]))) throw new HttpError(409, 'A record with this email already exists.')
    draft[collection].push(record)
    return record
  })
}

export async function updateRecord(collection: Collection, id: string, data: object, uniqueKeys: string[] = []): Promise<RecordData> {
  const changes = { ...data, updatedAt: new Date().toISOString() }
  if (mode === 'mongodb') {
    const query = mongoose.isObjectIdOrHexString(id) ? { $or: [{ id }, { _id: new mongoose.Types.ObjectId(id) }] } : { id }
    try {
      const result = await mongoose.connection.collection(collection).findOneAndUpdate(query, { $set: changes }, { returnDocument: 'after' })
      if (!result) throw new HttpError(404, 'This record could not be found. Refresh and try again.')
      return normalize(result)
    } catch (error) { if ((error as { code?: number }).code === 11000) throw new HttpError(409, 'A record with this email already exists.'); throw error }
  }
  return mutate(draft => {
    const index = draft[collection].findIndex(record => record.id === id)
    if (index === -1) throw new HttpError(404, 'This record could not be found. Refresh and try again.')
    const updated: RecordData = { ...draft[collection][index], ...changes }
    if (uniqueKeys.some(key => draft[collection].some(existing => existing.id !== id && existing[key] === updated[key]))) throw new HttpError(409, 'A record with this email already exists.')
    draft[collection][index] = updated
    return updated
  })
}

export async function deleteRecords(collection: Collection, key: string, value: string) {
  if (mode === 'mongodb') { await mongoose.connection.collection(collection).deleteMany({ [key]: value }); return }
  await mutate(draft => { draft[collection] = draft[collection].filter(record => record[key] !== value) })
}
