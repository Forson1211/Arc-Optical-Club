import { Router } from 'express'
import { readFile } from 'node:fs/promises'
import { findRecord, listRecords } from '../lib/store.js'

const origin = 'https://arcoptical.org'
const escapeXml = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]!))
type Renderer = { renderPage: (path: string, content?: Record<string, unknown>, options?: { noindex?: boolean }) => { head: string; html: string }; template: string }
let renderer: Promise<Renderer> | undefined
async function loadRenderer(): Promise<Renderer> {
  renderer ||= Promise.all([import(new URL('../render/entry-server.js', import.meta.url).href), readFile(new URL('../render/template.html', import.meta.url), 'utf8')]).then(([module, template]) => ({ renderPage: module.renderPage, template })).catch(error => { renderer = undefined; throw error })
  return renderer
}

export function seoRoutes(load = loadRenderer) {
  const router = Router()
  router.get('/news-sitemap.xml', async (_req, res, next) => {
    try {
      const news = (await listRecords('news')).filter(article => article.status === 'published')
      const urls = news.map(article => {
        const updated = new Date(String(article.updatedAt))
        return `<url><loc>${origin}/news/${encodeURIComponent(article.id)}</loc>${Number.isNaN(updated.valueOf()) ? '' : `<lastmod>${updated.toISOString()}</lastmod>`}</url>`
      }).join('')
      res.set('Cache-Control', 'no-store').type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`)
    } catch (error) { next(error) }
  })
  router.get(['/news', '/news/:id'], async (req, res, next) => {
    try {
      const news = (await listRecords('news')).filter(article => article.status === 'published').sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
      const id = typeof req.params.id === 'string' ? req.params.id : ''
      const article = id ? await findRecord('news', 'id', id) : undefined
      const missing = Boolean(id && (!article || article.status !== 'published'))
      const route = id ? `/news/${encodeURIComponent(id)}` : '/news'
      const content = { '/content/news': news.map(({ blocks: _blocks, ...record }) => record), ...(article?.status === 'published' ? { [`/content${route}`]: article } : {}) }
      const { renderPage, template } = await load()
      const page = renderPage(missing ? '/page-not-found' : route, content, { noindex: missing })
      // HTML and assets follow the same policies as static public pages, including uploaded HTTPS photos.
      res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'")
      res.set('Cache-Control', 'no-store')
      if (missing) res.set('X-Robots-Tag', 'noindex, follow')
      res.status(missing ? 404 : 200).type('html').send(template.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, page.head).replace('<!--app-html-->', page.html))
    } catch (error) { next(error) }
  })
  return router
}
