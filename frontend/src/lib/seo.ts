export const SITE_ORIGIN = 'https://arcoptical.org'
export const SITE_NAME = 'Arc Optical Club'
const defaultImage = `${SITE_ORIGIN}/images/arc-social-preview.png`

export type PageSeo = { title: string; description: string; path: string; label: string; type?: string; image?: string; imageAlt?: string; noindex?: boolean; article?: { author: string; publishedAt: string; modifiedAt?: string; category: string } }
export const publicPages: PageSeo[] = [
  { path: '/', label: 'Home', title: 'Arc Optical Club (ARC) | Eye Care & Screenings in Ghana', description: 'Arc Optical Club (ARC) is a registered NGO in Ghana bringing free eye screenings, eye-health education and research closer to communities.' },
  { path: '/about', label: 'About us', title: 'About ARC | Arc Optical Club Ghana', description: 'Meet Arc Optical Club, a Ghanaian NGO founded in October 2022. Discover our mission, vision and pillars: Access, Research & Education, and Community.' },
  { path: '/programs', label: 'Our programs', title: 'Eye Care Programs in Ghana | Arc Optical Club', description: 'Explore Sight For Kids, Operation Sight For All and Myopia Rescue: Arc Optical Club programs bringing eye screenings and support to communities in Ghana.' },
  { path: '/team', label: 'Our team', title: 'Our Team & Advisory Council | Arc Optical Club', description: 'Meet the students, professionals, team leads and advisors working together at Arc Optical Club to make eye care more accessible across Ghana.' },
  { path: '/partners', label: 'Our partners', title: 'Our Partners | Arc Optical Club Ghana', description: 'Meet the organizations supporting Arc Optical Club’s community eye care, outreach and learning in Ghana.' },
  { path: '/academy', label: 'ARC Academy', title: 'ARC Academy | Mentorship & Training | Arc Optical Club', description: 'Learn and grow with ARC Academy through mentorship, training and shared learning in eye care, research and community service.' },
  { path: '/research', label: 'Research & education', title: 'Research & Journal Club | Arc Optical Club Ghana', description: 'Join Arc Optical Club’s monthly Journal Club, explore eye-health research and connect with students and professionals through research collaboration.' },
  { path: '/gallery', label: 'Gallery', title: 'Community Outreach Gallery | Arc Optical Club', description: 'See Arc Optical Club in action: eye screenings, school visits and volunteers bringing clearer vision to communities across Ghana.' },
  { path: '/news', label: 'News & stories', title: 'ARC News & Community Stories | Arc Optical Club', description: 'Read the latest news, eye-health updates and community outreach stories from Arc Optical Club in Ghana.' },
  { path: '/donate', label: 'Donate', title: 'Donate to Eye Care in Ghana | Arc Optical Club', description: 'Give the gift of sight. Support Arc Optical Club’s free eye screenings, education and community eye-care programs across Ghana.' },
  { path: '/join', label: 'Join us', title: 'Volunteer & Join ARC | Arc Optical Club Ghana', description: 'Join Arc Optical Club as a student, professional or volunteer. Help bring eye care, education and research closer to communities across Ghana.' },
  { path: '/contact', label: 'Contact', title: 'Contact ARC | Partner with Arc Optical Club Ghana', description: 'Contact Arc Optical Club about volunteering, research, partnerships, donations or community eye screenings in Ghana.' },
]

export function pageSeo(pathname: string): PageSeo {
  const path = pathname.replace(/\/+$/, '') || '/'
  const known = publicPages.find(page => page.path === path)
  if (known) return { ...known }
  if (/^\/news\/[^/]+$/.test(path)) return { ...publicPages.find(page => page.path === '/news')!, path }
  return { path, label: 'Page', title: `${path.startsWith('/admin') ? 'Admin' : path === '/donate/thank-you' ? 'Donation receipt' : 'Page not found'} | ${SITE_NAME}`, description: 'Arc Optical Club — bringing vision into focus, together.', noindex: true }
}

export function articleSeo(article: { id: string; title: string; excerpt: string; author: string; category: string; image: string; alt: string; publishedAt: string; updatedAt?: string }): PageSeo {
  const image = article.image.startsWith('/api/content/images/') && import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/content/images/${article.image.split('/').at(-1)}` : article.image
  return { path: `/news/${encodeURIComponent(article.id)}`, label: article.title, title: `${article.title} | ${SITE_NAME}`, description: article.excerpt, type: 'article', image: new URL(image, SITE_ORIGIN).href, imageAlt: article.alt, article: { author: article.author, category: article.category, publishedAt: article.publishedAt, modifiedAt: article.updatedAt } }
}

export function structuredData(page: PageSeo) {
  const url = `${SITE_ORIGIN}${page.path}`
  const organization = { '@type': 'NGO', '@id': `${SITE_ORIGIN}/#organization`, name: SITE_NAME, alternateName: ['ARC', 'ARC Optical', 'ARC Optical Club'], url: `${SITE_ORIGIN}/`, logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/optimized/images/arc-optical-club-logo-256-8ab558acac3c.webp`, width: 256, height: 256 }, description: publicPages[0].description, foundingDate: '2022-10', areaServed: { '@type': 'Country', name: 'Ghana' } }
  const website = { '@type': 'WebSite', '@id': `${SITE_ORIGIN}/#website`, url: `${SITE_ORIGIN}/`, name: SITE_NAME, alternateName: ['ARC Optical', 'ARC', 'arcoptical.org'], publisher: { '@id': organization['@id'] }, inLanguage: 'en-GH' }
  const graph: object[] = [organization, website, { '@type': page.path === '/about' ? 'AboutPage' : page.path === '/contact' ? 'ContactPage' : 'WebPage', '@id': `${url}#webpage`, url, name: page.title, description: page.description, isPartOf: { '@id': website['@id'] }, about: { '@id': organization['@id'] }, inLanguage: 'en-GH' }]
  if (page.path !== '/' && !page.noindex) {
    const crumbs = [{ name: 'Home', item: `${SITE_ORIGIN}/` }, ...(page.article ? [{ name: 'News & stories', item: `${SITE_ORIGIN}/news` }] : []), { name: page.label, item: url }]
    graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })) })
  }
  if (page.article) graph.push({ '@type': 'NewsArticle', '@id': `${url}#article`, mainEntityOfPage: { '@id': `${url}#webpage` }, headline: page.label, description: page.description, image: [page.image || defaultImage], datePublished: page.article.publishedAt, ...(page.article.modifiedAt ? { dateModified: page.article.modifiedAt } : {}), articleSection: page.article.category, author: { '@type': 'Person', name: page.article.author }, publisher: { '@id': organization['@id'] }, inLanguage: 'en-GH' })
  return { '@context': 'https://schema.org', '@graph': graph }
}

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!))
export const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
export function seoHead(page: PageSeo) {
  const meta = (attribute: string, key: string, value: string) => `<meta data-seo ${attribute}="${key}" content="${escapeHtml(value)}" />`
  return [
    `<title>${escapeHtml(page.title)}</title>`, `<link data-seo rel="canonical" href="${escapeHtml(SITE_ORIGIN + page.path)}" />`,
    meta('name', 'description', page.description), meta('name', 'robots', page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'),
    meta('property', 'og:site_name', SITE_NAME), meta('property', 'og:locale', 'en_GH'), meta('property', 'og:type', page.type || 'website'),
    meta('property', 'og:url', SITE_ORIGIN + page.path), meta('property', 'og:title', page.title), meta('property', 'og:description', page.description),
    meta('property', 'og:image', page.image || defaultImage), meta('property', 'og:image:alt', page.imageAlt || 'Arc Optical Club — bringing vision into focus, together.'),
    ...(!page.image ? [meta('property', 'og:image:width', '1200'), meta('property', 'og:image:height', '630')] : []),
    meta('name', 'twitter:card', 'summary_large_image'), meta('name', 'twitter:title', page.title), meta('name', 'twitter:description', page.description), meta('name', 'twitter:image', page.image || defaultImage), meta('name', 'twitter:image:alt', page.imageAlt || 'Arc Optical Club'),
    ...(page.article ? [meta('property', 'article:published_time', page.article.publishedAt), ...(page.article.modifiedAt ? [meta('property', 'article:modified_time', page.article.modifiedAt)] : [])] : []),
    `<script data-seo type="application/ld+json">${safeJson(structuredData(page))}</script>`,
  ].join('\n    ')
}

export function applySeo(page: PageSeo) {
  document.head.querySelectorAll('[data-seo], title, link[rel="canonical"], meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"]').forEach(element => element.remove())
  const template = document.createElement('template')
  template.innerHTML = seoHead(page)
  document.head.append(template.content)
}
