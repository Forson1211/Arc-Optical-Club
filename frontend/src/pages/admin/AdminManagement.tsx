import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { adminApi, apiErrorMessage } from '../../lib/api'

type Admin = { id: string; name: string; email: string; createdAt: string; lastLoginAt: string | null }
const date = (value: string | null) => value ? new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Accra' }) : 'Not signed in yet'

function AddAdministrator({ onClose, onCreated }: { onClose: () => void; onCreated: (admin: Admin) => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [saving, setSaving] = useState(false), [error, setError] = useState('')
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow
    ref.current?.showModal(); document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow; focused?.focus() }
  }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving) return
    const form = new FormData(event.currentTarget)
    setSaving(true); setError('')
    try {
      const response = await adminApi.post('/admin/admins', { name: String(form.get('name')).trim(), email: String(form.get('email')).trim(), password: String(form.get('password')) })
      onCreated(response.data.data)
    } catch (e) { setError(apiErrorMessage(e, 'The administrator could not be added.')); setSaving(false) }
  }
  return <dialog ref={ref} className="a-dialog" aria-labelledby="add-admin-title" onCancel={e => { if (saving) e.preventDefault(); else onClose() }}><div className="a-dialog-head"><div><h2 id="add-admin-title">Add an administrator</h2></div><button disabled={saving} onClick={onClose} className="a-icon-button" aria-label="Close"><X size={20}/></button></div><form className="a-form" onSubmit={submit}><label>Full name<input autoFocus name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Administrator’s name"/></label><label>Email address<input name="email" type="email" required maxLength={180} autoComplete="off" placeholder="name@example.com"/></label><label>Password<input name="password" type="password" required minLength={12} maxLength={256} autoComplete="new-password" placeholder="At least 12 characters"/><small>Share sign-in details directly. No invitation email is sent.</small></label><p className="a-admin-access-note"><ShieldCheck size={20}/>Full administrator access, including creating other admins.</p>{error && <p className="a-feature-error" role="alert">{error}</p>}<div className="a-form-actions"><button className="a-button secondary" type="button" disabled={saving} onClick={onClose}>Cancel</button><button className="a-button primary" disabled={saving} type="submit"><Plus size={17}/>{saving ? 'Creating account…' : 'Create administrator'}</button></div></form></dialog>
}

export default function AdminManagement({ adminEmail }: { adminEmail: string }) {
  const [admins, setAdmins] = useState<Admin[] | null>(null), [error, setError] = useState(''), [open, setOpen] = useState(false), [refresh, setRefresh] = useState(0), [notice, setNotice] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    void adminApi.get('/admin/admins', { signal: controller.signal }).then(response => { setAdmins(response.data.data); setError('') }).catch(e => { if (!controller.signal.aborted) setError(apiErrorMessage(e, 'Administrators could not be loaded.')) })
    return () => controller.abort()
  }, [refresh])
  return <><section className="a-panel a-admin-members"><div className="a-panel-heading"><div><span className="a-record-count">{admins ? admins.length : '...'} administrators</span></div><div className="a-analytics-controls"><button className="a-icon-button" aria-label="Refresh administrators" onClick={() => setRefresh(r => r + 1)}><RefreshCw size={17}/></button><button className="a-button primary" onClick={() => { setOpen(true); setNotice('') }}><Plus size={17}/>Add administrator</button></div></div>{notice && <p className="a-feature-success" role="status">{notice}</p>}{error && <p className="a-feature-error" role="alert">{error}<button className="a-text-link" onClick={() => setRefresh(r => r + 1)}>Try again</button></p>}{!admins && !error && <p className="a-feature-loading" role="status">Loading administrators…</p>}{admins && <div className="a-table-wrap"><table className="a-table"><thead><tr><th>ADMINISTRATOR</th><th>ACCESS</th><th>ADDED</th><th>LAST SIGN-IN</th></tr></thead><tbody>{admins.map(admin => <tr key={admin.id}><td><div className="a-person-cell"><span className="a-initials tint-0"><ShieldCheck size={20}/></span><div><strong>{admin.name || 'Arc administrator'} {admin.email === adminEmail && <span className="a-you">You</span>}</strong><span className="a-subline">{admin.email}</span></div></div></td><td><span className="a-badge blue">Administrator</span></td><td>{date(admin.createdAt)}</td><td>{date(admin.lastLoginAt)}</td></tr>)}</tbody></table></div>}</section>{open && <AddAdministrator onClose={() => setOpen(false)} onCreated={admin => { setAdmins(current => [...(current || []), admin]); setOpen(false); setNotice(`${admin.name} can now sign in with the credentials you created.`) }}/>}</>
}
