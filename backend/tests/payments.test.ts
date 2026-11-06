import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac, randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createApp } from '../src/app.js'
import { initializeStorage, listRecords } from '../src/lib/store.js'

test('Paystack checkout, verification, webhook signatures and duplicate delivery', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arc-payment-test-'))
  process.env.NODE_ENV = 'test'; process.env.DATA_DIRECTORY = directory
  process.env.CLIENT_URL = 'http://localhost:5173'
  delete process.env.PAYSTACK_SECRET_KEY; delete process.env.PAYSTACK_WEBHOOK_SECRET
  await initializeStorage()
  const key = `sk_test_${randomBytes(24).toString('hex')}`
  const charges = new Map<string, { reference: string; amount: number; currency: string; domain: string; status: string }>()
  let maliciousRedirect = false
  const paymentFetch: typeof fetch = async (input, init) => {
    const url = String(input)
    assert(url.startsWith('https://api.paystack.co/transaction/'))
    assert.equal((init?.headers as Record<string, string>).Authorization, `Bearer ${process.env.PAYSTACK_SECRET_KEY}`)
    if (url.endsWith('/initialize')) {
      const data = JSON.parse(String(init?.body))
      assert.equal(data.currency, 'GHS'); assert.equal(data.callback_url, 'http://localhost:5173/donate/thank-you')
      assert.equal(data.email, 'donor@example.com')
      charges.set(data.reference, { reference: data.reference, amount: data.amount, currency: data.currency, domain: process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test', status: 'pending' })
      return Response.json({ status: true, data: { reference: data.reference, authorization_url: maliciousRedirect ? 'https://untrusted.example/checkout' : 'https://checkout.paystack.com/test-checkout' } })
    }
    return Response.json({ status: true, data: charges.get(url.split('/').at(-1)!) })
  }
  const server = createApp({ paymentFetch }).listen(0, '127.0.0.1')
  await new Promise<void>(resolve => { if (server.listening) resolve(); else server.once('listening', resolve) })
  const address = server.address(); assert(address && typeof address === 'object')
  const base = `http://127.0.0.1:${address.port}/api/donations`
  const donor = { name: 'Test donor', email: 'DONOR@example.com', amount: 100, phone: '+233 24 000 0000', note: 'For healthier communities.' }
  const checkout = (body: unknown = donor, origin = 'http://localhost:5173') => fetch(base + '/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) })
  const verify = (reference: string) => fetch(base + '/verify/' + reference)
  const legacyWebhook = (body: string, signature = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(body).digest('hex')) => fetch(base + '/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Paystack-Signature': signature }, body })
  try {
    assert.equal((await checkout()).status, 503)
    process.env.PAYSTACK_SECRET_KEY = key
    assert.equal((await checkout(donor, 'https://untrusted.example')).status, 403)
    for (const data of [{ ...donor, amount: 0 }, { ...donor, amount: 1.001 }, { ...donor, amount: 100001 }, { ...donor, email: 'invalid' }, { ...donor, website: 'spam' }]) assert.equal((await checkout(data)).status, 400)
    const initialized = await checkout()
    assert.equal(initialized.status, 201)
    const result = await initialized.json() as any, reference = result.data.reference
    assert.match(reference, /^arc-[a-f0-9]{48}$/)
    assert.equal(result.data.authorizationUrl, 'https://checkout.paystack.com/test-checkout')
    assert.equal(JSON.stringify(result).includes(key), false)
    assert.equal((await listRecords('donations')).length, 0)
    assert.equal((await (await verify(reference)).json() as any).data.status, 'pending')
    const charge = charges.get(reference)!
    charge.status = 'success'
    charge.amount = 9999
    assert.equal((await verify(reference)).status, 409)
    assert.equal((await listRecords('donations')).length, 0)
    charge.amount = 10000; charge.currency = 'NGN'
    assert.equal((await verify(reference)).status, 409)
    charge.currency = 'GHS'; charge.domain = 'live'
    assert.equal((await verify(reference)).status, 409)
    charge.domain = 'test'
    const body = JSON.stringify({ event: 'charge.success', data: charge })
    assert.equal((await legacyWebhook(body, 'invalid')).status, 401)
    assert.equal((await verify('forged')).status, 400)
    assert.equal((await verify(`arc-${'0'.repeat(48)}`)).status, 404)
    const deliveries = await Promise.all([verify(reference), verify(reference), legacyWebhook(body), legacyWebhook(body)])
    assert(deliveries.every(response => response.status === 200))
    const donations = await listRecords('donations')
    assert.equal(donations.length, 1); assert.equal(donations[0].status, 'Test'); assert.equal(donations[0].amount, 100)
    assert.equal((await listRecords('auditlogs')).filter(log => log.action === 'donation.payment_received').length, 1)
    const receipt = await (await verify(reference)).json() as any
    for (const secret of [key, donor.email.toLowerCase(), donor.phone, donor.note, donor.name]) assert.equal(JSON.stringify(receipt).includes(secret), false)
    // Timestamped signatures are required when a webhook signing secret is set.
    process.env.PAYSTACK_WEBHOOK_SECRET = `whsec_${randomBytes(24).toString('hex')}`
    assert.equal((await legacyWebhook(body)).status, 401)
    const modernWebhook = (time: number, content = body) => {
      const hash = createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!).update(`${time}.`).update(content).digest('hex')
      return fetch(base + '/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Paystack-Signature': `t=${time},v1=whk_test:${hash}` }, body: content })
    }
    const now = Math.floor(Date.now() / 1000)
    assert.equal((await modernWebhook(now - 600)).status, 401)
    assert.equal((await modernWebhook(now)).status, 200)
    assert.equal((await modernWebhook(now, JSON.stringify({ event: 'charge.success', data: { reference: 'other-integration' } }))).status, 200)
    // A real-mode charge is counted only after authoritative confirmation.
    process.env.PAYSTACK_SECRET_KEY = `sk_live_${randomBytes(24).toString('hex')}`
    const live = await (await checkout({ ...donor, amount: 250 })).json() as any
    charges.get(live.data.reference)!.status = 'success'
    assert.equal((await verify(live.data.reference)).status, 200)
    assert.equal((await listRecords('donations')).filter(record => record.status === 'Received').length, 1)
    maliciousRedirect = true
    assert.equal((await checkout()).status, 502)
    await initializeStorage()
    assert.equal((await listRecords('donations')).length, 2)
    assert.equal((await listRecords('paymentattempts')).filter(record => record.status === 'received').length, 2)
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()))
    delete process.env.PAYSTACK_SECRET_KEY; delete process.env.PAYSTACK_WEBHOOK_SECRET
    assert(path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(directory).startsWith('arc-payment-test-'))
    await rm(directory, { recursive: true, force: true })
  }
})
