import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, ChevronDown, Linkedin, Mail } from 'lucide-react'
import Container from './Container'
import BrandLogo from './BrandLogo'
import { api } from '../lib/api'

const sections = [
  { title: 'Organization', links: [{ label: 'About us', to: '/about' }, { label: 'Our team', to: '/team' }, { label: 'Our programs', to: '/programs' }, { label: 'Gallery', to: '/gallery' }] },
  { title: 'Get involved', links: [{ label: 'Join Arc', to: '/join' }, { label: 'Donate or partner', to: '/donate' }] },
  { title: 'Research & learning', links: [{ label: 'ARC Academy', to: '/academy' }, { label: 'Research', to: '/research' }] },
  { title: 'Connect', links: [{ label: 'Contact Arc', to: '/contact' }], description: 'We work to make quality eye care and eye-health knowledge more accessible to communities across Ghana.' },
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
    <footer id="site-footer" className="border-t-2 border-arc-yellow bg-[#10394B] text-white">
      <div className="border-b border-white/10">
        <Container>
          <div className="grid gap-6 py-9 sm:py-11 lg:grid-cols-[1fr_430px] lg:items-center lg:gap-12">
            <div>
              <h2 id="footer-newsletter-heading" className="text-xl font-extrabold tracking-[-0.025em] sm:text-2xl">Subscribe to our newsletter</h2>
              <p className="mt-3 max-w-lg text-[13px] leading-6 text-white/60">Get our news, research, events and eye-health tips in your inbox.</p>
            </div>
            <form onSubmit={subscribe} aria-labelledby="footer-newsletter-heading">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
                <input
                  id="footer-newsletter-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  required
                  maxLength={180}
                  value={email}
                  onChange={event => { setEmail(event.target.value); if (status !== 'sending') setStatus('idle') }}
                  disabled={status === 'sending'}
                  aria-describedby="footer-newsletter-status"
                  className="min-h-12 min-w-0 rounded-sm border border-white/10 bg-white px-4 py-3 text-sm text-arc-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-arc-yellow disabled:opacity-75"
                />
                <button type="submit" disabled={status === 'sending'} className="min-h-12 rounded-sm bg-arc-yellow px-7 py-3 text-sm font-extrabold text-arc-navy transition hover:bg-[#ffd149] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70">
                  {status === 'sending' ? 'Sending…' : 'Send'}
                </button>
              </div>
              <p id="footer-newsletter-status" role="status" aria-live="polite" className={`mt-2 min-h-5 text-xs leading-5 ${status === 'error' ? 'text-amber-200' : 'text-white/75'}`}>
                {status === 'success' && 'You’re subscribed. Thank you for joining our community.'}
                {status === 'error' && <>We couldn’t save your subscription. Please try again or <Link to="/contact" className="underline underline-offset-2">contact Arc</Link>.</>}
              </p>
            </form>
          </div>
        </Container>
      </div>

      <Container>
        <div className="flex items-center justify-between gap-5 border-b border-white/15 py-7 sm:py-8">
          <Link to="/" aria-label="Arc Optical Club home" className="inline-flex shrink-0">
            <BrandLogo className="h-auto w-32 sm:w-40" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3" aria-label="Connect with Arc">
            <a href="https://www.linkedin.com/company/arc-optical-club/" target="_blank" rel="noreferrer" aria-label="Arc Optical Club on LinkedIn" className="grid h-9 w-9 place-items-center rounded-sm text-white/65 transition hover:bg-white/10 hover:text-arc-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-yellow">
              <Linkedin size={18} aria-hidden="true" />
            </a>
            <Link to="/contact" aria-label="Contact Arc Optical Club" className="grid h-9 w-9 place-items-center rounded-sm text-white/65 transition hover:bg-white/10 hover:text-arc-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-yellow">
              <Mail size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="grid pb-8 pt-4 md:grid-cols-4 md:gap-8 md:pb-11 md:pt-8">
          {sections.map((section, index) => (
            <section key={section.title} className="border-b border-white/15 md:border-0" aria-labelledby={`footer-heading-${index}`}>
              <h3 id={`footer-heading-${index}`} className="hidden border-b border-white/15 pb-3 text-[13px] font-extrabold md:block">{section.title}</h3>
              <button
                type="button"
                aria-expanded={expanded === section.title}
                aria-controls={`footer-links-${index}`}
                onClick={() => setExpanded(expanded === section.title ? null : section.title)}
                className="flex min-h-[62px] w-full items-center justify-between gap-4 text-left text-sm font-extrabold transition hover:text-arc-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-yellow md:hidden"
              >
                {section.title}<ChevronDown size={16} aria-hidden="true" className={`text-white/55 transition ${expanded === section.title ? 'rotate-180' : ''}`} />
              </button>
              <div id={`footer-links-${index}`} className={`${expanded === section.title ? 'grid' : 'hidden'} gap-3 pb-6 text-[13px] leading-6 text-white/60 md:mt-3 md:grid md:gap-2 md:pb-0`}>
                {section.links.map(link => <Link key={link.to} to={link.to} onClick={() => setExpanded(null)} className="w-fit transition hover:text-arc-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arc-yellow">{link.label}</Link>)}
                {section.description && <p className="max-w-sm text-xs leading-6 text-white/50">{section.description}</p>}
              </div>
            </section>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/15 py-6 text-[10px] leading-5 text-white/50 sm:flex-row sm:flex-wrap sm:items-center">
          <p>© {new Date().getFullYear()} Arc Optical Club. All rights reserved.</p>
          <p>Bringing vision into focus, together.</p>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })} className="inline-flex min-h-9 items-center gap-2 border border-white/25 px-3 text-[9px] font-extrabold uppercase tracking-wider text-white/75 transition hover:border-arc-yellow hover:text-arc-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-arc-yellow">
            Back to top <ArrowUp size={12} aria-hidden="true" />
          </button>
        </div>
      </Container>
    </footer>
  )
}
