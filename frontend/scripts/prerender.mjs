import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pageSeo, publicPages, renderPage, seoHead, SITE_ORIGIN } from '../../backend/dist/render/entry-server.js'

const output = fileURLToPath(new URL('../dist/', import.meta.url))
const builtIndex = await readFile(path.join(output, 'index.html'), 'utf8')
const template = builtIndex.includes('<!--app-html-->') ? builtIndex : await readFile(new URL('../../backend/dist/render/template.html', import.meta.url), 'utf8')
await writeFile(new URL('../../backend/dist/render/template.html', import.meta.url), template)
for (const route of [...publicPages.filter(page => page.path !== '/news').map(page => page.path), '/donate/thank-you']) {
  // Payment receipts are a private flow; retain its client-rendered form.
  const rendered = route === '/donate/thank-you' ? { head: seoHead(pageSeo(route)), html: '' } : renderPage(route)
  const directory = path.join(output, route === '/' ? '' : route.slice(1))
  await mkdir(directory, { recursive: true })
  const html = template.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n${rendered.head}\n<!--seo:end-->`).replace('<!--app-html-->', rendered.html)
  await writeFile(path.join(directory, 'index.html'), html)
}
const admin = renderPage('/page-not-found')
await writeFile(path.join(output, 'admin.html'), template.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, seoHead(pageSeo('/admin'))).replace('<!--app-html-->', ''))
await writeFile(path.join(output, '404.html'), template.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, admin.head).replace('<!--app-html-->', admin.html))
const escapeXml = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]))
await writeFile(path.join(output, 'sitemap-pages.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPages.map(page => `<url><loc>${escapeXml(SITE_ORIGIN + page.path)}</loc></url>`).join('')}</urlset>\n`)
await writeFile(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${SITE_ORIGIN}/sitemap-pages.xml</loc></sitemap><sitemap><loc>${SITE_ORIGIN}/api/seo/news-sitemap.xml</loc></sitemap></sitemapindex>\n`)
// Leave HTML pages crawlable so Google can read their noindex directives.
await writeFile(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/admin/\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`)
console.log(`SEO: pre-rendered ${publicPages.length - 1} public pages; generated robots.txt, sitemaps and noindex fallback pages.`)
