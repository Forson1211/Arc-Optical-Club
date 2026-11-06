import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { api, apiErrorMessage } from '../lib/api'

export default function NewsletterSignup() {
  const id = useId(), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('')
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return
    const form = event.currentTarget, email = new FormData(form).get('email')
    setBusy(true); setNotice(''); setError('')
    try { await api.post('/newsletter', { email }); setNotice('You’re subscribed. Thank you for joining us.'); form.reset() }
    catch (failure) { setError(apiErrorMessage(failure, 'Your subscription could not be saved. Please try again.')) }
    finally { setBusy(false) }
  }
  return <section className="news-signup"><p className="article-category">Stay in the loop</p><h2>News from Arc.</h2><p>Stories, community updates and opportunities to get involved.</p><form onSubmit={subscribe}><label htmlFor={id}>Email address</label><input id={id} name="email" type="email" required maxLength={180} autoComplete="email" placeholder="you@example.com" disabled={busy}/><button disabled={busy} type="submit">{busy ? 'Subscribing…' : 'Subscribe'}</button><p role={error ? 'alert' : 'status'}>{error || notice}</p></form></section>
}
