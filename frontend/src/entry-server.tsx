import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { ContentContext } from './lib/content-context'
import type { InitialContent } from './lib/content-context'
import { articleSeo, pageSeo, publicPages, safeJson, seoHead, SITE_ORIGIN } from './lib/seo'
import type { NewsArticle } from './lib/content'

export { pageSeo, publicPages, seoHead, SITE_ORIGIN }
export function renderPage(path: string, content: InitialContent = {}, options: { noindex?: boolean } = {}) {
  const article = /^\/news\/[^/]+$/.test(path) ? content[`/content${path}`] as NewsArticle | undefined : undefined
  const page = article ? articleSeo(article) : pageSeo(path)
  if (options.noindex) page.noindex = true
  const html = renderToString(<ContentContext.Provider value={content}><MemoryRouter initialEntries={[path]}><App/></MemoryRouter></ContentContext.Provider>)
  return { head: seoHead(page), html: `${html}<script id="initial-content" type="application/json">${safeJson(content)}</script>` }
}
