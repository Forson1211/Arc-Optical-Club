import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { writeAudit } from './activity.js'
import { findRecord, HttpError, insertRecord, updateRecord } from './store.js'

export const donationCheckoutSchema = z.object({
  name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(180).transform(value => value.toLowerCase()),
  amount: z.number().min(1, 'The minimum donation is GHS 1.').max(100000).multipleOf(.01),
  phone: z.string().trim().max(40).regex(/^[+\d\s().-]*$/, 'Enter a valid phone number.').default(''),
  note: z.string().trim().max(1000).default(''),
  website: z.string().max(0).optional(),
})
export const paymentReference = z.string().regex(/^arc-[a-f0-9]{48}$/)
const key = () => process.env.PAYSTACK_SECRET_KEY || ''
export const paymentsEnabled = () => /^sk_(?:test|live)_/.test(key())

async function gateway(path: string, fetcher: typeof fetch, body?: object) {
  if (!paymentsEnabled()) throw new HttpError(503, 'Online donations are being set up. Please contact Arc to arrange your contribution.')
  try {
    const response = await fetcher(`https://api.paystack.co${path}`, {
      method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
    })
    const result = await response.json() as { status?: boolean; data?: unknown }
    if (!response.ok || !result.status || !result.data) throw new Error('Gateway rejected the request')
    return result.data
  } catch { throw new HttpError(502, 'We could not connect to Paystack. Please try again shortly.') }
}

export async function initializeDonation(donor: z.infer<typeof donationCheckoutSchema>, origin: string, fetcher: typeof fetch) {
  if (!paymentsEnabled()) throw new HttpError(503, 'Online donations are being set up. Please contact Arc to arrange your contribution.')
  const callback = new URL('/donate/thank-you', origin)
  const reference = `arc-${randomBytes(24).toString('hex')}`
  const amountMinor = Math.round(donor.amount * 100)
  // Save the expected amount before handing control to the payment provider.
  const attempt = await insertRecord('paymentattempts', { name: donor.name, email: donor.email, phone: donor.phone, note: donor.note, amountMinor, reference, currency: 'GHS', paymentMode: key().startsWith('sk_live_') ? 'live' : 'test', status: 'pending' }, ['reference'])
  const data = await gateway('/transaction/initialize', fetcher, {
    email: donor.email, amount: amountMinor, currency: 'GHS', reference, callback_url: callback.href,
    metadata: { donor_name: donor.name, donation_reference: reference },
  }) as { authorization_url?: string; reference?: string }
  let checkout: URL
  try { checkout = new URL(String(data.authorization_url)) } catch { throw new HttpError(502, 'Paystack did not return a checkout link. Please try again.') }
  if (checkout.protocol !== 'https:' || checkout.hostname !== 'checkout.paystack.com' || checkout.username || checkout.password || data.reference !== reference) throw new HttpError(502, 'Paystack did not return a valid checkout link. Please try again.')
  await updateRecord('paymentattempts', attempt.id, { checkoutInitialized: true })
  return { reference, authorizationUrl: checkout.href }
}

const verifiedChargeSchema = z.object({ reference: paymentReference, status: z.string(), amount: z.number().int(), currency: z.string(), domain: z.enum(['test', 'live']) })
export async function recordVerifiedCharge(input: unknown) {
  const parsed = verifiedChargeSchema.safeParse(input)
  if (!parsed.success) throw new HttpError(502, 'The payment response could not be verified.')
  const charge = parsed.data
  const attempt = await findRecord('paymentattempts', 'reference', charge.reference)
  if (!attempt) throw new HttpError(404, 'This donation reference was not found.')
  if (charge.amount !== attempt.amountMinor || charge.currency !== 'GHS' || charge.domain !== attempt.paymentMode) throw new HttpError(409, 'The payment details do not match this donation. Please contact Arc with your reference.')
  if (charge.status !== 'success') return { status: 'pending', reference: charge.reference }
  const data = { name: String(attempt.name), amount: charge.amount / 100, program: 'General fund', date: new Date().toISOString().slice(0, 10), status: charge.domain === 'live' ? 'Received' : 'Test', source: 'paystack', paymentReference: charge.reference, paymentMode: charge.domain }
  let donation = await findRecord('donations', 'paymentReference', charge.reference)
  if (!donation) {
    try { donation = await insertRecord('donations', data, ['paymentReference']) }
    catch (error) { if (!(error instanceof HttpError) || error.status !== 409) throw error; donation = await findRecord('donations', 'paymentReference', charge.reference) }
  }
  await updateRecord('paymentattempts', attempt.id, { status: 'received', donationId: donation?.id })
  await writeAudit({ eventKey: `payment:${charge.reference}`, action: 'donation.payment_received', category: 'giving', description: 'Paystack donation verified and recorded', outcome: 'success', actorType: 'system', source: 'server', resourceId: donation?.id })
  return { status: 'received', reference: charge.reference, amount: charge.amount / 100, currency: 'GHS', mode: charge.domain }
}

export async function verifyDonation(reference: string, fetcher: typeof fetch) {
  if (!await findRecord('paymentattempts', 'reference', reference)) throw new HttpError(404, 'This donation reference was not found.')
  const result = await gateway(`/transaction/verify/${encodeURIComponent(reference)}`, fetcher)
  if (!result || typeof result !== 'object' || !('reference' in result) || result.reference !== reference) throw new HttpError(409, 'The payment reference could not be verified.')
  return recordVerifiedCharge(result)
}

export function validWebhookSignature(body: Buffer, signature: string, legacySignature: string) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET
  if (secret) {
    const parts = signature.split(',').map(part => part.trim()), timestamps = parts.filter(part => part.startsWith('t='))
    if (timestamps.length !== 1 || !/^t=\d+$/.test(timestamps[0])) return false
    const time = Number(timestamps[0].slice(2))
    if (Math.abs(Date.now() / 1000 - time) > 300) return false
    const expected = createHmac('sha512', secret).update(`${time}.`).update(body).digest()
    return parts.filter(part => part.startsWith('v1=')).some(part => {
      const hex = part.slice(part.indexOf(':') + 1)
      return /^v1=whk_[^:]+:/.test(part) && /^[a-f0-9]{128}$/.test(hex) && timingSafeEqual(expected, Buffer.from(hex, 'hex'))
    })
  }
  if (!paymentsEnabled() || !/^[a-f0-9]{128}$/.test(legacySignature)) return false
  return timingSafeEqual(createHmac('sha512', key()).update(body).digest(), Buffer.from(legacySignature, 'hex'))
}
