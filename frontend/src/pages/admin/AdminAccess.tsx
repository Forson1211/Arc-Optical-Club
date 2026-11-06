import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react'
import BrandLogo from '../../components/BrandLogo'
import { adminApi, apiErrorMessage } from '../../lib/api'
import AdminDashboard from './AdminDashboard'
import './admin.css'

export default function AdminAccess() {
  const [state, setState] = useState<'checking' | 'signed-out' | 'signed-in' | 'unavailable'>('checking')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function checkSession() {
    setState('checking'); setError('')
    try { const { data } = await adminApi.get('/admin/session'); setEmail(data.data.email); setName(data.data.name || ''); setState('signed-in') }
    catch (failure) {
      if (isAxiosError(failure) && failure.response?.status === 401) setState('signed-out')
      else { setError(apiErrorMessage(failure, 'The admin workspace is unavailable. Please try again.')); setState('unavailable') }
    }
  }
  useEffect(() => {
    void checkSession()
    const interceptor = adminApi.interceptors.response.use(response => response, failure => {
      if (failure.response?.status === 401) setState('signed-out')
      return Promise.reject(failure)
    })
    return () => adminApi.interceptors.response.eject(interceptor)
  }, [])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return
    const form = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      const { data } = await adminApi.post('/admin/login', { email: String(form.get('email') || '').trim(), password: String(form.get('password') || '') })
      setEmail(data.data.email); setName(data.data.name || ''); setState('signed-in')
    } catch (failure) { setError(apiErrorMessage(failure, 'We could not sign you in. Please try again.')) }
    finally { setBusy(false) }
  }
  async function logout() {
    await adminApi.post('/admin/logout')
    setEmail(''); setName(''); setState('signed-out')
  }
  if (state === 'signed-in') return <AdminDashboard adminEmail={email} adminName={name} onProfileSaved={setName} onLogout={logout} />
  return <div className="arc-admin a-access"><div className="a-access-story"><Link to="/" aria-label="Arc Optical Club homepage"><BrandLogo /></Link><div><h1>Admin<br />Workspace.</h1><p>A place to bring our people, programs and purpose together.</p></div><p><ShieldCheck size={16} />Access. Research. Community.</p></div><main className="a-access-main"><Link to="/" className="a-access-back"><ArrowLeft size={15} />Back to Arc</Link><div className="a-access-card"><span className="a-access-icon"><LockKeyhole size={25} /></span><p className="a-eyebrow">ARC OPTICAL CLUB</p><h2>{state === 'checking' ? 'Opening your workspace…' : state === 'unavailable' ? 'Let’s reconnect.' : 'Welcome back.'}</h2><p>{state === 'checking' ? 'Checking your secure session.' : state === 'unavailable' ? 'We need a connection to the Arc server to continue.' : 'Sign in to manage the work that makes a difference.'}</p>
    {state === 'checking' ? <LoaderCircle className="animate-spin a-access-loader" size={23} /> : state === 'unavailable' ? <><p className="a-access-error" role="alert">{error}</p><button className="a-button primary" onClick={checkSession}>Try again <ArrowRight size={16} /></button></> : <form onSubmit={login} className="a-access-form"><label>Email address<input type="email" name="email" required autoComplete="username" maxLength={180} placeholder="Your admin email" /></label><label>Password<input type="password" name="password" required autoComplete="current-password" maxLength={256} placeholder="Your password" /></label>{error && <p className="a-access-error" role="alert">{error}</p>}<button className="a-button primary" disabled={busy}>{busy ? <><LoaderCircle size={16} className="animate-spin" />Signing in…</> : <>Sign in to workspace <ArrowRight size={16} /></>}</button></form>}
    <p className="a-access-note">Access is for authorized Arc administrators. Need an account or help signing in? Contact your workspace administrator.</p></div><span className="a-access-footer">Arc Optical Club · Made for a clearer tomorrow.</span></main></div>
}
