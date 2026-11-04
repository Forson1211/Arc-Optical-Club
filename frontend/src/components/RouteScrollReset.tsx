import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteScrollReset() {
  const { pathname } = useLocation()
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}
