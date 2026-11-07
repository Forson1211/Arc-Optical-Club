import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { applySeo, pageSeo } from '../lib/seo'

export default function Seo() {
  const { pathname } = useLocation()
  useEffect(() => { applySeo(pageSeo(pathname)) }, [pathname])
  return null
}
