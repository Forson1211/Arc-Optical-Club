import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function RouteScrollReset() {
  const { pathname, hash } = useLocation()
  useBrowserLayoutEffect(() => {
    const target = hash ? document.getElementById(hash.slice(1)) : null
    if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}
