import SiteImage from '../components/SiteImage'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Eye, HandHeart, LockKeyhole, ShieldCheck } from 'lucide-react'
import Container from '../components/Container'
import PageIntro from '../components/PageIntro'
import { api, apiErrorMessage } from '../lib/api'

const amounts = [50, 100, 250, 500, 1000]
const displayAmount = (amount: number) => amount.toLocaleString('en-GH', { maximumFractionDigits: 2 })
export default function Donate() {
  const [selected, setSelected] = useState(100), [custom, setCustom] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const amount = custom === '' ? selected : Number(custom)
  async function donate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return
    const form = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      const response = await api.post('/donations/initialize', { amount, name: form.get('name'), email: form.get('email'), phone: form.get('phone'), note: form.get('note'), website: form.get('website') }, { timeout: 25000 })
      window.location.assign(response.data.data.authorizationUrl)
    } catch (failure) { setError(apiErrorMessage(failure, 'We could not open checkout. Please try again.')); setBusy(false) }
  }
  return <main className="inner-page donate-page"><PageIntro label="Make a difference" title="Give the gift of sight.">Help bring eye care closer to the communities that need it.</PageIntro><Container>
    <section className="giving-feature" aria-labelledby="giving-feature-heading">
      <SiteImage src="/images/arc-eye-screening-hero.png" alt="An Arc volunteer providing an eye screening in the community"/>
      <div><HandHeart size={34} className="text-arc-yellow"/><h2 id="giving-feature-heading">A little support.<br/>A clearer tomorrow.</h2>
      <p>Support a screening, contribute supplies, partner with us or sponsor a program. Help more children, elders and communities access free eye care.</p>
      <Link className="page-button" to="/contact?subject=Partnership%20or%20sponsorship">Partner or sponsor us<ArrowUpRight size={18}/></Link>
      <small>Contact our team to arrange a contribution and receive payment details.</small></div>
    </section>
    <section className="donation-checkout" id="donation-form" aria-labelledby="donation-checkout-heading"><h2 id="donation-checkout-heading">Make a donation.</h2><p>Choose your amount and give securely through Paystack.</p></section>
    <div className="donation-layout"><form className="donation-form" onSubmit={donate}><fieldset disabled={busy}><div className="donation-form-heading"><h2>Select donation amount</h2><span><LockKeyhole size={13}/>Secure checkout</span></div><div className="donation-amounts" aria-label="Choose donation amount">{amounts.map(value => <button type="button" key={value} aria-pressed={custom === '' && selected === value} onClick={() => { setSelected(value); setCustom(''); setError('') }}>GHS {displayAmount(value)}</button>)}</div><label className="donation-custom">Or enter a custom amount (GHS)<span><b>GHS</b><input name="amount" type="number" step="0.01" min="1" max="100000" aria-label="Custom donation amount in Ghana cedis" value={custom} placeholder="e.g. 750" onChange={event => { setCustom(event.target.value); setError('') }}/></span></label><div className="donation-impact"><p><HandHeart size={15}/>YOUR IMPACT {amount > 0 ? `(GHS ${displayAmount(amount)})` : ''}</p><p>Help provide free eye screenings, community outreach and eye-health education.</p></div><div className="donation-fields"><label>Full name <span>*</span><input name="name" autoComplete="name" required minLength={2} maxLength={120} placeholder="Your full name"/></label><label>Email address <span>*</span><input name="email" type="email" autoComplete="email" required maxLength={180} placeholder="you@example.com"/></label><label className="donation-wide">Phone number <small>(optional)</small><input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+233 24 000 0000"/></label><label className="donation-wide">Dedication or encouragement <small>(optional)</small><textarea name="note" rows={3} maxLength={1000} placeholder="In honour of someone who inspires you…"/></label><label className="sr-only" aria-hidden="true">Leave this empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div><button className="donation-submit" type="submit" disabled={busy || !Number.isFinite(amount) || amount < 1 || amount > 100000}>{busy ? 'Opening secure checkout…' : `Donate GHS ${displayAmount(amount || 0)} via Paystack`}</button><div className="donation-methods"><span>Powered by <strong>Paystack</strong></span><span>Mobile money</span><span>Visa / Mastercard</span></div><p className="donation-privacy">Your payment details are handled securely by Paystack.</p></fieldset>{error && <p className="donation-error" role="alert">{error} <Link to="/contact?subject=Donation%20enquiry">Contact Arc</Link></p>}</form><aside className="donation-purpose"><h2>Where your giving goes</h2>{[{ title: 'Community eye care', text: 'Bringing free screenings and eye-care support closer to families across Ghana.', icon: Eye }, { title: 'Sight For Kids', text: 'Helping children and teachers learn about eye health and access screening.', icon: HandHeart }, { title: 'Research & education', text: 'Growing knowledge and supporting a community that puts learning into practice.', icon: BookOpen }].map(({ title, text, icon: Icon }) => <div className="donation-purpose-item" key={title}><span><Icon size={20}/></span><div><h3>{title}</h3><p>{text}</p></div></div>)}<div className="donation-assurance"><ShieldCheck size={21}/><div><h3>Care you can be part of.</h3><p>Every contribution supports Arc’s work in eye health and community service.</p></div></div><Link to="/contact?subject=Donation%20enquiry">Questions about giving? Talk to us.</Link></aside></div></Container></main>
}
