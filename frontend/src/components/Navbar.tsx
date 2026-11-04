import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import BrandLogo from './BrandLogo'

const groups = [
  { label: 'About Arc', links: [{ label: 'Our story', to: '/about' }, { label: 'Our team', to: '/team' }] },
  { label: 'Our work', links: [{ label: 'Our programs', to: '/programs' }, { label: 'Gallery', to: '/gallery' }] },
  { label: 'Learn & grow', links: [{ label: 'ARC Academy', to: '/academy' }, { label: 'Research', to: '/research' }] },
]
const directLinks = [{ label: 'News', to: '/news' }, { label: 'Contact', to: '/contact' }]

type MobileItem = { label: string; to: string } | { label: string; links: { label: string; to: string }[] }
const mobileItems: MobileItem[] = [
  { label: 'Home', to: '/' },
  ...groups,
  { label: 'News', to: '/news' },
  { label: 'Get involved', links: [{ label: 'Join Arc', to: '/join' }, { label: 'Donate', to: '/donate' }, { label: 'Partner with us', to: '/contact' }] },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [mobileGroup, setMobileGroup] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(() => window.scrollY > 40)
  const headerRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const isOverlay = isHome && !scrolled && !open

  const closeMenus = () => {
    setOpen(false)
    setActiveGroup(null)
    setMobileGroup(null)
  }

  useEffect(() => {
    setOpen(false)
    setActiveGroup(null)
    setMobileGroup(null)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => {
      if (desktop.matches) {
        setOpen(false)
        setMobileGroup(null)
      }
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => {
      document.body.style.overflow = previousOverflow
      desktop.removeEventListener('change', closeOnDesktop)
    }
  }, [open])

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 40)
    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })
    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])

  useEffect(() => {
    if (!open && !activeGroup) return
    const closeOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setActiveGroup(null)
        setMobileGroup(null)
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open, activeGroup])

  const navColor = isOverlay ? 'text-white/80 hover:text-white' : 'text-arc-navy/75 hover:text-arc-blue'

  return (
    <header
      ref={headerRef}
      className={`z-50 border-b transition-[background-color,border-color,box-shadow,color] duration-300 ${isHome ? 'fixed inset-x-0 top-0' : 'sticky top-0'} ${isOverlay ? 'border-transparent bg-transparent text-white' : 'border-arc-blue/10 bg-white text-arc-navy shadow-[0_2px_16px_rgba(20,43,59,0.06)]'}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          const expandedButton = headerRef.current?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')
          closeMenus()
          expandedButton?.focus()
        }
      }}
    >
      <div className="container-shell flex h-24 items-center justify-between gap-6 lg:h-28">
        <button
          type="button"
          className="order-2 grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-arc-yellow text-arc-navy transition hover:bg-[#ffd149] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-arc-blue lg:hidden"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => { setOpen(!open); setActiveGroup(null); setMobileGroup(null) }}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <Link to="/" aria-label="Arc Optical Club home" className="order-1 inline-flex shrink-0 items-center lg:order-none" onClick={closeMenus}>
          <BrandLogo variant={isOverlay ? 'light' : 'color'} className="block h-auto w-[132px] sm:w-36" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex xl:gap-9" aria-label="Main navigation">
          {groups.map((group, index) => {
            const expanded = activeGroup === group.label
            const active = group.links.some((link) => link.to === pathname)
            return (
              <div key={group.label} className="relative">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`desktop-nav-group-${index}`}
                  className={`flex items-center gap-1.5 py-3 text-[13px] font-semibold transition ${active ? (isOverlay ? 'text-arc-yellow' : 'text-arc-blue') : navColor}`}
                  onClick={() => setActiveGroup(expanded ? null : group.label)}
                >
                  {group.label}<ChevronDown size={13} className={`transition ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {expanded && (
                  <div id={`desktop-nav-group-${index}`} className="absolute left-0 top-full grid min-w-48 gap-1 rounded-sm border-t-2 border-arc-yellow bg-white p-2 text-arc-navy shadow-xl">
                    {group.links.map((link) => (
                      <NavLink key={link.to} to={link.to} onClick={closeMenus} className={({ isActive }) => `rounded-sm px-4 py-3 text-[13px] font-semibold transition hover:bg-arc-ice hover:text-arc-blue ${isActive ? 'bg-arc-ice text-arc-blue' : ''}`}>
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {directLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `py-3 text-[13px] font-semibold transition ${isActive ? (isOverlay ? 'text-arc-yellow' : 'text-arc-blue') : navColor}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center justify-end lg:flex">
          <Link to="/donate" aria-label="Donate to Arc Optical Club" onClick={closeMenus} className="inline-flex h-11 w-11 items-center justify-center gap-5 rounded-sm bg-arc-yellow text-[11px] font-extrabold uppercase tracking-[0.08em] text-arc-navy transition hover:bg-[#ffd149] lg:w-auto lg:px-6">
            <span className="hidden lg:inline">Donate Now</span>

          </Link>
        </div>
      </div>

      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain border-t border-slate-100 bg-white pb-4 text-arc-navy shadow-xl lg:hidden">
          <div className="container-shell">
            {mobileItems.map((item, index) => {
              if ('links' in item) {
                const expanded = mobileGroup === item.label
                const active = item.links.some(link => link.to === pathname)
                return (
                  <div key={item.label} className="border-b border-slate-200/80">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`mobile-nav-group-${index}`}
                      onClick={() => setMobileGroup(expanded ? null : item.label)}
                      className={`flex min-h-14 w-full items-center justify-between border-l-4 py-4 pl-3 pr-2 text-left text-[15px] font-extrabold transition hover:bg-arc-ice ${active ? 'border-arc-yellow text-arc-blue' : 'border-transparent'}`}
                    >
                      {item.label}<ChevronDown size={15} className={`transition ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    {expanded && (
                      <div id={`mobile-nav-group-${index}`} className="grid bg-arc-ice/60 py-1">
                        {item.links.map(link => (
                          <NavLink key={link.to} to={link.to} onClick={closeMenus} className={({ isActive }) => `px-7 py-3 text-sm font-semibold transition hover:text-arc-blue ${isActive ? 'text-arc-blue' : 'text-arc-navy/75'}`}>
                            {link.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <div key={item.label} className="border-b border-slate-200/80">
                  <NavLink to={item.to} end onClick={closeMenus} className={({ isActive }) => `flex min-h-14 items-center border-l-4 py-4 pl-3 pr-2 text-[15px] font-extrabold transition hover:bg-arc-ice ${isActive ? 'border-arc-yellow bg-arc-yellow/5 text-arc-blue' : 'border-transparent'}`}>
                    {item.label}
                  </NavLink>
                </div>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
