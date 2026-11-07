import { createServerlessHandler } from '../backend/dist/serverless.js'

// Explicit ESM entry point: the backend also uses native ES modules.
const handle = createServerlessHandler()
export default function handler(req, res) {
  // Vercel can preserve the original path when rewriting to a function. Use an
  // explicit route parameter too, so direct article links work in either case.
  const url = new URL(req.url || '/', 'https://arcoptical.org')
  const route = url.searchParams.get('arc_seo') || url.pathname
  if (/^\/news(?:\/[^/?#]+)?$/.test(route)) req.url = `/api/seo${route}`
  return handle(req, res)
}
