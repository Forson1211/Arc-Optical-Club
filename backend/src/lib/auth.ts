import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { Request, Response, NextFunction, CookieOptions } from 'express'
import { deleteRecords, findRecord, HttpError, insertRecord, updateRecord } from './store.js'
import type { RecordData } from './store.js'

const scrypt = promisify(scryptCallback)
export const sessionCookie = 'arc_admin_session'
export const sessionDuration = 8 * 60 * 60 * 1000
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export async function createAdmin(email: string, password: string, details: { name?: string; createdBy?: string } = {}) {
  if (password.length < 12 || password.length > 256) throw new Error('Use a password between 12 and 256 characters.')
  const salt = randomBytes(24).toString('hex')
  const passwordHash = (await scrypt(password, salt, 64) as Buffer).toString('hex')
  return insertRecord('adminusers', { email: email.trim().toLowerCase(), salt, passwordHash, name: details.name || '', createdBy: details.createdBy || 'setup' }, ['email'])
}

async function passwordMatches(user: RecordData | undefined, password: string) {
  // Always do the expensive hash, including for unknown email addresses.
  const derived = await scrypt(password, String(user?.salt || 'arc-invalid-account-salt'), 64) as Buffer
  const expected = user ? Buffer.from(String(user.passwordHash), 'hex') : Buffer.alloc(64)
  return !!user && expected.length === derived.length && timingSafeEqual(expected, derived)
}

export async function authenticate(email: string, password: string) {
  const user = await findRecord('adminusers', 'email', email.toLowerCase())
  if (!await passwordMatches(user, password) || !user) throw new HttpError(401, 'The email or password is incorrect.')
  const token = randomBytes(32).toString('base64url')
  await insertRecord('adminsessions', { userId: user.id, tokenHash: hashToken(token), authVersion: user.authVersion || '0', expiresAt: new Date(Date.now() + sessionDuration) })
  await updateRecord('adminusers', user.id, { lastLoginAt: new Date().toISOString() })
  return { token, id: user.id, email: String(user.email), name: String(user.name || '') }
}

export async function changeAdminPassword(id: string, currentPassword: string, newPassword: string) {
  const user = await findRecord('adminusers', 'id', id)
  if (!await passwordMatches(user, currentPassword) || !user) throw new HttpError(400, 'Your current password is incorrect.')
  if (newPassword.length < 12 || newPassword.length > 256) throw new HttpError(400, 'Use a password between 12 and 256 characters.')
  if (currentPassword === newPassword) throw new HttpError(400, 'Choose a different password.')
  const salt = randomBytes(24).toString('hex')
  const passwordHash = (await scrypt(newPassword, salt, 64) as Buffer).toString('hex')
  await updateRecord('adminusers', id, { salt, passwordHash, authVersion: randomBytes(24).toString('hex'), passwordChangedAt: new Date().toISOString() })
  await deleteRecords('adminsessions', 'userId', id)
  // Rotate this browser's session too. Other devices must sign in again.
  return authenticate(String(user.email), newPassword)
}

export function cookieOptions(): CookieOptions {
  const sameSite = process.env.COOKIE_SAME_SITE === 'none' ? 'none' : 'lax'
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production' || sameSite === 'none', sameSite, path: '/api/admin', maxAge: sessionDuration }
}

function readToken(req: Request) {
  return req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1)
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = readToken(req)
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new HttpError(401, 'Please sign in to your admin account.')
    const session = await findRecord('adminsessions', 'tokenHash', hashToken(token))
    if (!session || !Number.isFinite(new Date(String(session.expiresAt)).getTime()) || new Date(String(session.expiresAt)).getTime() <= Date.now()) {
      if (session) await deleteRecords('adminsessions', 'tokenHash', hashToken(token))
      throw new HttpError(401, 'Your session has expired. Please sign in again.')
    }
    const user = await findRecord('adminusers', 'id', String(session.userId))
    if (!user) throw new HttpError(401, 'Please sign in to your admin account.')
    if ((session.authVersion || '0') !== (user.authVersion || '0')) throw new HttpError(401, 'Your password changed. Please sign in again.')
    res.locals.admin = { id: user.id, email: String(user.email), name: String(user.name || '') }
    next()
  } catch (error) { next(error) }
}

export async function endSession(req: Request) {
  const token = readToken(req)
  if (token) await deleteRecords('adminsessions', 'tokenHash', hashToken(token))
}
