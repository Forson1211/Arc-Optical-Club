import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { flushTraffic, publicPath, trackSite } from '../lib/activity'

export default function SiteActivityTracker() {
  const location = useLocation()
  const last = useRef('')
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) { last.current = ''; return }
    const key = `${location.key}:${location.pathname}`
    if (last.current === key) return
    last.current = key
    let referrerHost = ''
    try { referrerHost = new URL(document.referrer).hostname.slice(0, 180) } catch { /* Direct visit. */ }
    trackSite('page_view', location.pathname, { referrerHost })
  }, [location.key, location.pathname])
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (window.location.pathname.startsWith('/admin') || !(event.target instanceof Element)) return
      const element = event.target.closest('a,button,[role="button"]')
      if (!element) return
      let target: string | undefined
      if (element instanceof HTMLAnchorElement) { try { const url = new URL(element.href); if (url.origin === window.location.origin && !url.pathname.startsWith('/admin')) target = publicPath(url.pathname) } catch { /* No navigable URL. */ } }
      trackSite('click', window.location.pathname, { element: element.tagName === 'A' ? 'link' : 'button', target })
    }
    const flush = () => { void flushTraffic() }
    document.addEventListener('click', click, true)
    window.addEventListener('online', flush); window.addEventListener('pagehide', flush)
    const timer = setInterval(flush, 15000)
    return () => { document.removeEventListener('click', click, true); window.removeEventListener('online', flush); window.removeEventListener('pagehide', flush); clearInterval(timer) }
  }, [])
  return null
}
