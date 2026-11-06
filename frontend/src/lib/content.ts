import { useEffect, useRef, useState } from 'react'
import { api, apiErrorMessage } from './api'

export type ContentProgram = { id: string; title: string; category: string; description: string; detail: string; image: string; alt: string; order: number; status: 'draft' | 'published' }
export type ArticleBlock = { type: 'paragraph' | 'heading'; text: string } | { type: 'image'; src: string; alt: string; caption: string }
export type NewsArticle = { id: string; title: string; excerpt: string; author: string; category: string; image: string; alt: string; publishedAt: string; status: 'draft' | 'published'; blocks: ArticleBlock[] }

// Uploaded images belong to the API origin, including when it is hosted separately.
export function contentImage(src: string) {
  if (!src.startsWith('/api/content/images/')) return src
  return `${String(api.defaults.baseURL).replace(/\/$/, '')}/content/images/${src.split('/').slice(-1)[0]}`
}
export const articleDate = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Accra' })

export function useContent<T>(path: string) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState(''), [version, setVersion] = useState(0)
  const lastPath = useRef(path)
  useEffect(() => {
    const controller = new AbortController()
    if (lastPath.current !== path) { setData(null); lastPath.current = path }
    setError('')
    void api.get<{ data: T }>(path, { signal: controller.signal }).then(response => setData(response.data.data)).catch(failure => {
      if (!controller.signal.aborted) setError(apiErrorMessage(failure, 'This content is unavailable. Please try again.'))
    })
    return () => controller.abort()
  }, [path, version])
  useEffect(() => {
    const refresh = () => setVersion(v => v + 1)
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])
  return { data, error, retry: () => setVersion(v => v + 1) }
}
