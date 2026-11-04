import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Handshake, Linkedin, Mail, MapPin } from 'lucide-react'
import Container from '../components/Container'
import { api } from '../lib/api'

const fields = [
  { name: 'name', label: 'Name', type: 'text', required: true, minLength: 2, maxLength: 120, autoComplete: 'name' },
  { name: 'company', label: 'Company / organization', type: 'text', required: false, maxLength: 160, autoComplete: 'organization' },
  { name: 'phone', label: 'Phone', type: 'tel', required: false, maxLength: 40, autoComplete: 'tel' },
  { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 180, autoComplete: 'email' },
]
const inputClass = 'min-h-11 w-full min-w-0 border border-transparent bg-slate-100 px-3.5 py-3 text-sm text-arc-navy placeholder:text-slate-400 focus:border-arc-blue focus:outline-none focus:ring-2 focus:ring-arc-blue/10'

export default function Contact() {
  const [search] = useSearchParams()
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return
    const form = event.currentTarget
    const data = new FormData(form)
    const value = (name: string) => String(data.get(name) || '').trim()
    const payload = {
      name: value('name'), email: value('email'), subject: value('subject'), message: value('message'),
      ...(value('company') ? { company: value('company') } : {}),
      ...(value('phone') ? { phone: value('phone') } : {}),
    }
    setStatus('sending')
    try {
      const response = await api.post<{ success: boolean }>('/contact', payload, { timeout: 10000 })
      if (!response.data.success) throw new Error('Message was not saved')
      form.reset()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="bg-[#10394B] pb-16 sm:pb-20">
      <section className="relative overflow-hidden pb-36 pt-14 text-center text-white sm:pb-40 sm:pt-16" aria-labelledby="contact-heading">
        <img src="/images/arc-outreach-team-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_45%]" />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,106,171,0.94),rgba(20,43,59,0.76)_65%,rgba(183,134,0,0.8))]" />
        <Container className="relative">
          <h1 id="contact-heading" className="text-4xl font-extrabold uppercase tracking-[-0.04em] sm:text-5xl">Contact Us</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-[15px]">Have a question, an idea or a heart for service? Let’s bring clearer vision to more communities, together.</p>
        </Container>
      </section>

      <Container className="relative z-10 -mt-24 max-w-[1100px]">
        <div className="grid bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:grid-cols-[0.85fr_1.15fr]">
          <section className="flex flex-col border-b border-slate-100 p-7 sm:p-10 md:border-b-0 md:border-r" aria-labelledby="get-in-touch-heading">
            <h2 id="get-in-touch-heading" className="text-2xl font-extrabold tracking-[-0.04em] text-arc-navy">Get in touch</h2>
            <p className="mt-3 text-sm leading-6 text-arc-slate">Reach out about our eye-health programs, research, volunteering, sponsorships or partnerships.</p>
            <div className="mt-7 grid gap-6">
              {[
                { icon: MapPin, title: 'Our community', text: 'Serving communities across Ghana through eye care, education and outreach.' },
                { icon: Mail, title: 'General enquiries', text: 'Send a message using the form and tell us how we can help.' },
                { icon: Handshake, title: 'Work with Arc', text: 'Volunteer, partner with us or support an initiative that brings eye care closer to people.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-arc-blue text-white"><Icon size={18} aria-hidden="true" /></span>
                  <div><h3 className="text-sm font-extrabold text-arc-navy">{title}</h3><p className="mt-1 text-xs leading-5 text-arc-slate">{text}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-9 border-t border-slate-100 pt-5 md:mt-auto md:pt-6">
              <p className="text-xs font-bold text-arc-navy">Stay connected with Arc</p>
              <div className="mt-3 flex items-center gap-3">
                <a href="https://www.linkedin.com/company/arc-optical-club/" target="_blank" rel="noreferrer" aria-label="Arc Optical Club on LinkedIn" className="grid h-9 w-9 place-items-center rounded-full bg-arc-blue text-white transition hover:bg-arc-navy"><Linkedin size={16} aria-hidden="true" /></a>
                <Link to="/join" className="text-xs font-extrabold text-arc-blue hover:underline">Join our community</Link>
              </div>
            </div>
          </section>

          <section id="contact-form" className="p-7 sm:p-10" aria-labelledby="message-heading">
            <h2 id="message-heading" className="text-2xl font-extrabold tracking-[-0.04em] text-arc-navy">Send us a message</h2>
            <form onSubmit={sendMessage} className="mt-6" aria-labelledby="message-heading">
              <fieldset disabled={status === 'sending'} className="grid min-w-0 gap-4 sm:grid-cols-2 disabled:opacity-70">
                {fields.map(field => (
                  <label key={field.name} className="grid min-w-0 gap-2 text-xs font-semibold text-arc-slate">
                    <span>{field.label}{!field.required && <span className="ml-1 font-normal text-slate-400">(optional)</span>}</span>
                    <input {...field} placeholder={field.label} className={inputClass} />
                  </label>
                ))}
                <label className="grid gap-2 text-xs font-semibold text-arc-slate sm:col-span-2">
                  Subject
                  <input name="subject" placeholder="How can we help?" defaultValue={search.get('subject') || ''} required minLength={2} maxLength={180} className={inputClass} />
                </label>
                <label className="grid gap-2 text-xs font-semibold text-arc-slate sm:col-span-2">
                  Message
                  <textarea name="message" placeholder="Tell us a little more…" required minLength={10} maxLength={5000} rows={4} className={`${inputClass} resize-y`} />
                </label>
                <button type="submit" className="mt-1 min-h-12 bg-arc-blue px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#01598f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-arc-blue sm:col-span-2">{status === 'sending' ? 'Sending…' : 'Send message'}</button>
              </fieldset>
              <p role="status" aria-live="polite" className={`mt-3 min-h-5 text-xs leading-5 ${status === 'error' ? 'text-red-700' : 'text-arc-blue'}`}>
                {status === 'success' && 'Your message has been received. Thank you for reaching out to Arc.'}
                {status === 'error' && 'We couldn’t send your message just now. Please try again, or connect with Arc on LinkedIn.'}
              </p>
            </form>
          </section>
        </div>
      </Container>
    </main>
  )
}
