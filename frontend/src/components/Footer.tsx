import { useState } from 'react'
import type { FormEvent, SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Instagram } from 'lucide-react'
import Container from './Container'
import BrandLogo from './BrandLogo'
import { api } from '../lib/api'

const sections = [
  {
    title: 'Get involved',
    links: [
      { label: 'Join Arc', to: '/join' },
      { label: 'Donate or partner', to: '/donate' },
    ],
  },
  {
    title: 'Organization',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Our team', to: '/team' },
      { label: 'Our programs', to: '/programs' },
      { label: 'Gallery', to: '/gallery' },
    ],
  },
  {
    title: 'Research & learning',
    links: [
      { label: 'ARC Academy', to: '/academy' },
      { label: 'Research', to: '/research' },
    ],
  },
  {
    title: 'Connect',
    links: [{ label: 'Contact Arc', to: '/contact' }],
    description:
      'We work to make quality eye care and eye-health knowledge more accessible to communities across Ghana.',
  },
]

type SocialIconProps = SVGProps<SVGSVGElement> & { size?: number }
function FacebookIcon({ size = 18, ...props }: SocialIconProps) {
  return <svg viewBox="0 0 24 24" width={size} height={size} {...props}><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.6V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2V11H7.6v3h2.7v8Z" fill="#10394B"/></svg>
}
function XIcon({ size = 18, ...props }: SocialIconProps) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}><path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.4l-5.02-6.57L6.03 22H2.9l7.25-8.29L1.8 2h6.56l4.54 6L18.9 2ZM17.8 20h1.73L7.42 3.87H5.56L17.8 20Z"/></svg>
}
function TikTokIcon({ size = 18, ...props }: SocialIconProps) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...props}><path d="M16.5 2c.3 2.6 1.8 4.1 4.5 4.3v3.6a10 10 0 0 1-4.5-1.4v7.1a6.4 6.4 0 1 1-5.6-6.3v3.6a2.8 2.8 0 1 0 2 2.7V2h3.6Z"/></svg>
}
function YouTubeIcon({ size = 18, ...props }: SocialIconProps) {
  return <svg viewBox="0 0 24 24" width={size} height={size} {...props}><rect x="1" y="4.5" width="22" height="15" rx="4" fill="currentColor"/><path d="m10 8 6 4-6 4Z" fill="#10394B"/></svg>
}
// Replace platform roots with the organization's profile URLs when supplied.
const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'X', href: 'https://x.com', icon: XIcon },
  { label: 'TikTok', href: 'https://www.tiktok.com', icon: TikTokIcon },
  { label: 'YouTube', href: 'https://youtube.com', icon: YouTubeIcon },
]

export default function Footer() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    try {
      const { data } = await api.post<{ success: boolean }>('/newsletter', { email: email.trim() }, { timeout: 10000 })
      if (!data.success) throw new Error('Subscription was not saved')
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <footer id="site-footer" className="bg-[#10394B] text-white">
      {/* Newsletter Signup Row */}
      <div className="border-b border-white/10">
        <Container>
          <div className="grid gap-6 py-9 sm:py-11 lg:grid-cols-[1fr_430px] lg:items-center lg:gap-12">
            <div>
              <h2 id="footer-newsletter-heading" className="text-xl font-extrabold tracking-[-0.025em] text-white sm:text-2xl">
                Subscribe to our newsletter
              </h2>
              <p className="mt-2 max-w-lg text-sm sm:text-base leading-6 text-white font-medium">
                Get our news, research, events and eye-health tips directly in your inbox.
              </p>
            </div>
            <form onSubmit={subscribe} aria-labelledby="footer-newsletter-heading">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  required
                  maxLength={180}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (status !== 'sending') setStatus('idle')
                  }}
                  disabled={status === 'sending'}
                  aria-describedby="footer-newsletter-status"
                  className="min-h-12 min-w-0 border-0 bg-white px-4 py-3 text-base text-arc-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-arc-yellow disabled:opacity-75"
                />
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="min-h-12 bg-arc-yellow px-7 py-3 text-base font-extrabold text-arc-navy transition hover:bg-[#ffd149] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70"
                >
                  {status === 'sending' ? 'Sending…' : 'Send'}
                </button>
              </div>
              <p
                id="footer-newsletter-status"
                role="status"
                aria-live="polite"
                className={`mt-2 min-h-5 text-sm leading-5 ${status === 'error' ? 'text-amber-200' : 'text-white font-medium'}`}
              >
                {status === 'success' && 'You’re subscribed. Thank you for joining our community.'}
                {status === 'error' && (
                  <>
                    We couldn’t save your subscription. Please try again or{' '}
                    <Link to="/contact" className="underline underline-offset-2">
                      contact Arc
                    </Link>
                    .
                  </>
                )}
              </p>
            </form>
          </div>
        </Container>
      </div>

      <Container>
        {/* Top Branding & Social Media Row (Clean: Logo on left, Social Icons on right) */}
        <div className="flex items-center justify-between gap-3 border-b border-white/15 py-7 sm:py-8">
          <Link to="/" aria-label="Arc Optical Club home" className="inline-flex shrink-0">
            <BrandLogo className="h-auto w-28 min-[375px]:w-32 sm:w-44" />
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3" aria-label="Social media links">
            {socialLinks.map(({ label, href, icon: Icon }) => <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={label}
              className="inline-flex h-8 w-7 items-center justify-center text-white/65 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Icon size={18} aria-hidden="true" />
            </a>)}
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid pb-10 pt-8 md:grid-cols-4 md:gap-8 md:pb-14 md:pt-10">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className="border-b border-white/10 md:border-0"
              aria-labelledby={`footer-heading-${index}`}
            >
              {/* Desktop Header: Bold Arc Yellow */}
              <h3
                id={`footer-heading-${index}`}
                className="hidden text-sm sm:text-base font-extrabold uppercase tracking-wider text-arc-yellow md:block md:mb-5"
              >
                {section.title}
              </h3>

              {/* Mobile Collapsible Trigger */}
              <button
                type="button"
                aria-expanded={expanded === section.title}
                aria-controls={`footer-links-${index}`}
                onClick={() => setExpanded(expanded === section.title ? null : section.title)}
                className="flex min-h-[60px] w-full items-center justify-between gap-4 text-left text-base font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:hidden"
              >
                {section.title}
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={`transition ${expanded === section.title ? 'rotate-180 text-arc-yellow' : 'text-white/65'}`}
                />
              </button>

              {/* Links: Clear High-Contrast White Text */}
              <div
                id={`footer-links-${index}`}
                className={`${
                  expanded === section.title ? 'grid' : 'hidden'
                } gap-1 pb-5 text-sm leading-6 md:grid md:gap-3 md:pb-0 md:text-[17px] md:leading-8`}
              >
                {section.links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setExpanded(null)}
                    className="w-fit font-normal text-white/60 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:font-semibold md:text-white md:hover:text-arc-yellow"
                  >
                    {link.label}
                  </Link>
                ))}
                {section.description && (
                  <p className="mt-2 max-w-sm text-sm leading-6 font-normal text-white/60 md:text-base md:font-medium md:text-white">
                    {section.description}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Copyright and Bottom Links */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/15 py-6 text-sm sm:text-base font-medium text-white sm:flex-row sm:flex-wrap sm:items-center">
          <p>© {new Date().getFullYear()} Arc Optical Club. All rights reserved.</p>
          <p className="text-white/90">Bringing vision into focus, together.</p>
          <p className="text-sm font-semibold text-white/90">
            Developed by <span className="font-extrabold text-white md:text-arc-yellow">Oflex Creative</span>
          </p>
        </div>
      </Container>
    </footer>
  )
}
