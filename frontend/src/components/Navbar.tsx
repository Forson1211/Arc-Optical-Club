import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import BrandLogo, { brandLogoSize } from './BrandLogo'

const groups = [
  { label: 'About Arc', links: [{ label: 'Our story', to: '/about' }, { label: 'Our team', to: '/team' }, { label: 'Our partners', to: '/partners' }] },
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
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 40)
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

  const navColor = 'text-white/80 hover:text-white'

  return (
    <header
      ref={headerRef}
      className={`z-50 text-white transition-[background-color,box-shadow,color] duration-300 ${isHome ? 'fixed inset-x-0 top-0' : 'sticky top-0'} ${isOverlay ? 'bg-transparent' : 'bg-arc-deep'} ${scrolled ? 'shadow-[0_2px_6px_-3px_rgba(0,0,0,0.18)]' : 'shadow-none'}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          const expandedButton = headerRef.current?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')
          closeMenus()
          expandedButton?.focus()
        }
      }}
    >
      <div className="container-shell flex h-[88px] items-center justify-between gap-6">
        <button
          type="button"
          className="order-2 grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-arc-yellow text-arc-navy transition hover:bg-[#ffd149] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-arc-blue lg:hidden"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => { setOpen(!open); setActiveGroup(null); setMobileGroup(null) }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
            </motion.span>
          </AnimatePresence>
        </button>
        <Link
          to="/"
          aria-label="Arc Optical Club home"
          className={`order-1 relative inline-flex shrink-0 items-center lg:order-none ${brandLogoSize}`}
          onClick={(e) => {
            closeMenus()
            if (pathname === '/') {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
        >
          <BrandLogo
            variant="light"
            className="block h-auto w-full"
          />
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
                  className={`flex items-center gap-1.5 py-3 text-[15px] font-semibold transition ${active ? 'text-arc-yellow' : navColor}`}
                  onClick={() => setActiveGroup(expanded ? null : group.label)}
                >
                  {group.label}<ChevronDown size={14} className={`transition ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {expanded && (
                  <div id={`desktop-nav-group-${index}`} className="absolute left-0 top-full grid min-w-48 gap-1 rounded-sm bg-arc-deep p-2 text-white shadow-xl">
                    {group.links.map((link) => (
                      <NavLink key={link.to} to={link.to} onClick={closeMenus} className={({ isActive }) => `rounded-sm px-4 py-3 text-[14px] font-semibold transition hover:bg-white/10 hover:text-arc-yellow ${isActive ? 'bg-white/10 text-arc-yellow' : ''}`}>
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {directLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `py-3 text-[15px] font-semibold transition ${isActive ? 'text-arc-yellow' : navColor}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center justify-end lg:flex">
          <Link to="/donate" aria-label="Donate to Arc Optical Club" onClick={closeMenus} className="inline-flex h-11 w-11 items-center justify-center gap-5 rounded-sm bg-arc-yellow text-xs sm:text-[13px] font-extrabold uppercase tracking-[0.08em] text-arc-navy transition hover:bg-[#ffd149] lg:w-auto lg:px-6">
            <span className="hidden lg:inline">Donate Now</span>

          </Link>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-88px)] overflow-y-auto overscroll-contain bg-arc-deep pb-5 text-white shadow-2xl lg:hidden"
          >
            <div className="container-shell">
              {mobileItems.map((item, index) => {
                if ('links' in item) {
                  const expanded = mobileGroup === item.label
                  return (
                    <div key={item.label}>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={`mobile-nav-group-${index}`}
                        onClick={() => setMobileGroup(expanded ? null : item.label)}
                        className="flex min-h-14 w-full items-center justify-between py-4 px-3 text-left text-[15px] font-extrabold text-white transition hover:bg-white/5"
                      >
                        {item.label}
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            id={`mobile-nav-group-${index}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: 'easeInOut' }}
                            className="grid overflow-hidden bg-black/10 py-1"
                          >
                            {item.links.map(link => (
                              <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={closeMenus}
                                className={({ isActive }) => `px-7 py-3 text-sm font-semibold transition hover:text-arc-yellow ${isActive ? 'text-arc-yellow' : 'text-white/80'}`}
                              >
                                {link.label}
                              </NavLink>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }
                return (
                  <div key={item.label}>
                    <NavLink
                      to={item.to}
                      end
                      onClick={closeMenus}
                      className="flex min-h-14 items-center py-4 px-3 text-[15px] font-extrabold text-white transition hover:bg-white/5"
                    >
                      {item.label}
                    </NavLink>
                  </div>
                )
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
