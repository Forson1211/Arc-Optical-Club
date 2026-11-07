import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function RouteScrollReset() {
  const { pathname } = useLocation()
  useBrowserLayoutEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}
