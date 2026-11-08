import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { existsSync } from 'node:fs'
import express from 'express'
import { seoRoutes } from '../src/routes/seoRoutes.js'
import { errorHandler } from '../src/middleware/errorHandler.js'
import { initializeStorage, insertRecord, updateRecord } from '../src/lib/store.js'

test('published stories render crawlable HTML, sharing metadata and an automatically updated sitemap', { skip: existsSync(new URL('../../dist/render/template.html', import.meta.url)) ? false : 'Build the frontend first to run server-rendered SEO checks.' }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'arc-seo-'))
  process.env.NODE_ENV = 'test'
  process.env.DATA_DIRECTORY = directory
  delete process.env.MONGODB_URI
  await initializeStorage()
  const module = await import(new URL('../../dist/render/entry-server.js', import.meta.url).href)
  const template = await readFile(new URL('../../dist/render/template.html', import.meta.url), 'utf8')
  const app = express().use('/api/seo', seoRoutes(async () => ({ renderPage: module.renderPage, template }))).use(errorHandler)
  const server = app.listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', resolve))
  const address = server.address()
  assert(address && typeof address !== 'string')
  const base = `http://127.0.0.1:${address.port}/api/seo`
  try {
    const values = { title: 'ARC community eye screening', excerpt: 'Free screenings in Ghana with Arc Optical Club.', author: 'Arc Optical Club', category: 'Community', image: '/images/arc-screening-session.jpg', alt: 'An Arc eye screening', publishedAt: '2026-11-07', blocks: [{ type: 'paragraph', text: 'Community eye care <script>unsafe()</script> remains accessible.' }] }
    const article = await insertRecord('news', { ...values, status: 'published' })
    const draft = await insertRecord('news', { ...values, title: 'Private draft headline', status: 'draft' })
    const response = await fetch(`${base}/news/${article.id}`)
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type')!, /text\/html/)
    const html = await response.text()
    assert.match(html, /<h1>ARC community eye screening<\/h1>/)
    assert.match(html, /Community eye care &lt;script&gt;/)
    assert(!html.includes('<script>unsafe()'))
    assert(!html.includes(draft.title as string))
    assert(html.includes(`rel="canonical" href="https://arcoptical.org/news/${article.id}"`))
    assert(html.includes('property="og:type" content="article"'))
    assert(html.includes('property="og:image" content="https://arcoptical.org/images/arc-screening-session.jpg"'))
    const schema = JSON.parse(html.match(/<script data-seo type="application\/ld\+json">([\s\S]*?)<\/script>/)![1])
    assert.equal(schema['@graph'].find((item: any) => item['@type'] === 'NewsArticle').headline, values.title)
    const bootstrap = JSON.parse(html.match(/<script id="initial-content" type="application\/json">([\s\S]*?)<\/script>/)![1])
    assert.equal(bootstrap[`/content/news/${article.id}`].blocks[0].text, values.blocks[0].text)
    assert(!html.includes('<script>unsafe()'))
    const listingResponse = await fetch(`${base}/news`)
    assert.equal(listingResponse.status, 200)
    const listing = await listingResponse.text()
    assert(listing.includes(`href="/news/${article.id}"`))
    assert(!listing.includes(draft.title as string))
    let sitemap = await (await fetch(`${base}/news-sitemap.xml`)).text()
    assert(sitemap.includes(article.id) && !sitemap.includes(draft.id))
    await updateRecord('news', draft.id, { status: 'published' })
    sitemap = await (await fetch(`${base}/news-sitemap.xml`)).text()
    assert(sitemap.includes(draft.id))
    await updateRecord('news', article.id, { status: 'draft' })
    sitemap = await (await fetch(`${base}/news-sitemap.xml`)).text()
    assert(!sitemap.includes(article.id))
    for (const id of [article.id, 'unknown-story']) {
      const missing = await fetch(`${base}/news/${id}`)
      assert.equal(missing.status, 404)
      assert.equal(missing.headers.get('x-robots-tag'), 'noindex, follow')
      assert.match(await missing.text(), /content="noindex, follow"/)
    }
    for (const page of module.publicPages) {
      const result = module.renderPage(page.path, { '/content/news': [] })
      assert(result.head.includes(`href="https://arcoptical.org${page.path}"`))
      assert(result.head.includes(page.title.replace(/&/g, '&amp;')))
      assert(result.html.includes('<h1'))
    }
    // An empty published list must not revive hidden programs from the seed data.
    const emptyPrograms = module.renderPage('/programs', { '/content/programs': [] })
    assert(!emptyPrograms.html.includes('class="program-row"'))
    assert(emptyPrograms.html.includes('New initiatives are on the way.'))
    const injection = module.renderPage(`/news/${draft.id}`, { [`/content/news/${draft.id}`]: { ...draft, title: '</title><script>attack()</script>' }, '/content/news': [] })
    assert(!injection.head.includes('</title><script>attack()'))
    assert(!injection.html.includes('<script>attack()'))
  } finally {
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
    assert(path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(directory).startsWith('arc-seo-'))
    await rm(directory, { recursive: true, force: true })
  }
})
