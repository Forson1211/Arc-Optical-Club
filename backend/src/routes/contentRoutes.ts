import { Router } from 'express'
import { findRecord, HttpError, listRecords } from '../lib/store.js'

const router = Router()
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })
router.get('/partners', async (_req, res, next) => {
  try {
    const records = (await listRecords('partners')).filter(record => record.status === 'published' && !!record.image).sort((a, b) => Number(a.order) - Number(b.order))
    res.json({ success: true, data: records })
  } catch (error) { next(error) }
})
router.get('/team', async (_req, res, next) => {
  try {
    const records = (await listRecords('teammembers')).filter(record => record.status === 'published').sort((a, b) => Number(a.order) - Number(b.order))
    res.json({ success: true, data: records })
  } catch (error) { next(error) }
})
router.get('/programs', async (_req, res, next) => {
  try {
    const records = (await listRecords('programs')).filter(record => record.status === 'published').sort((a, b) => Number(a.order) - Number(b.order))
    res.json({ success: true, data: records })
  } catch (error) { next(error) }
})
router.get('/news', async (_req, res, next) => {
  try {
    const records = (await listRecords('news')).filter(record => record.status === 'published').sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
    res.json({ success: true, data: records.map(({ blocks: _blocks, ...record }) => record) })
  } catch (error) { next(error) }
})
router.get('/news/:id', async (req, res, next) => {
  try {
    const record = await findRecord('news', 'id', String(req.params.id))
    if (!record || record.status !== 'published') throw new HttpError(404, 'This story is not available.')
    res.json({ success: true, data: record })
  } catch (error) { next(error) }
})
router.get('/images/:id', async (req, res, next) => {
  try {
    const record = await findRecord('contentimages', 'id', String(req.params.id))
    if (!record) throw new HttpError(404, 'Image not found.')
    res.set('Cache-Control', 'public, max-age=31536000, immutable').set('Cross-Origin-Resource-Policy', 'cross-origin').type(String(record.contentType)).send(Buffer.from(String(record.data), 'base64'))
  } catch (error) { next(error) }
})
export default router
