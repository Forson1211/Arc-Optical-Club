import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, Eye, EyeOff, Globe, LockKeyhole, LogOut, ShieldCheck, UserRound, Users } from 'lucide-react'
import { adminApi, apiErrorMessage } from '../../lib/api'
import { SUPPORTED_LANGUAGES, useI18n } from './i18n'

export default function AdminSettings({ name, email, onProfileSaved, onSignOut }: { name: string; email: string; onProfileSaved: (name: string) => void; onSignOut: () => void }) {
  const { lang } = useI18n()
  const [profileName, setProfileName] = useState(name)
  const [saving, setSaving] = useState(false), [changing, setChanging] = useState(false)
  const [profileError, setProfileError] = useState(''), [passwordError, setPasswordError] = useState(''), [notice, setNotice] = useState('')
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving) return
    setSaving(true); setProfileError(''); setNotice('')
    try { const { data } = await adminApi.patch('/admin/profile', { name: profileName.trim() }); onProfileSaved(data.data.name); setProfileName(data.data.name); setNotice('Profile saved.') }
    catch (error) { setProfileError(apiErrorMessage(error, 'Your profile could not be saved.')) }
    finally { setSaving(false) }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (changing) return
    const form = event.currentTarget, values = new FormData(form)
    const currentPassword = String(values.get('currentPassword')), newPassword = String(values.get('newPassword'))
    setPasswordError(''); setNotice('')
    if (newPassword.length < 12) { setPasswordError('The new password must be at least 12 characters.'); return }
    if (newPassword !== values.get('confirmation')) { setPasswordError('The new passwords do not match.'); return }
    setChanging(true)
    try { await adminApi.post('/admin/password', { currentPassword, newPassword }); form.reset(); setPasswordOpen(false); setNotice('Password updated. Other devices have been signed out.') }
    catch (error) { setPasswordError(apiErrorMessage(error, 'Your password could not be changed.')) }
    finally { setChanging(false) }
  }

  return <div className="a-account-settings">
    {notice && <p className="a-feature-success" role="status"><Check size={18}/>{notice}</p>}
    <section className="a-panel a-preference-card">
      <div className="a-preference-heading"><span className="a-action-icon tint-0"><UserRound size={21}/></span><h2>My profile</h2></div>
      <form className="a-form a-preference-form" onSubmit={saveProfile}>
        <label>Full name<input value={profileName} onChange={e => setProfileName(e.target.value)} autoComplete="name" required minLength={2} maxLength={120} placeholder="Your full name"/></label>
        <label>Email<input type="email" value={email} readOnly aria-readonly="true"/></label>
        {profileError && <p className="a-feature-error" role="alert">{profileError}</p>}
        <button className="a-button primary" disabled={saving || profileName.trim() === name} type="submit">{saving ? 'Saving...' : 'Save changes'}</button>
      </form>
    </section>

    <section className="a-panel a-preference-card">
      <div className="a-preference-heading"><span className="a-action-icon tint-2"><LockKeyhole size={21}/></span><h2>Security</h2></div>
      <div className="a-security-state"><ShieldCheck size={20}/><span>Secure session active</span></div>
      <details className="a-password-details" open={passwordOpen} onToggle={e => setPasswordOpen(e.currentTarget.open)}>
        <summary>Change my password</summary>
        <form className="a-form a-preference-form" onSubmit={changePassword}>
          <label>
            Current password
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} name="currentPassword" autoComplete="current-password" required maxLength={256}/>
              <button
                type="button"
                className="a-icon-button"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <label>
            New password
            <input type={showPassword ? 'text' : 'password'} name="newPassword" autoComplete="new-password" required minLength={12} maxLength={256} placeholder="At least 12 characters"/>
          </label>
          <label>
            Confirm new password
            <input type={showPassword ? 'text' : 'password'} name="confirmation" autoComplete="new-password" required minLength={12} maxLength={256} placeholder="Re-type new password"/>
          </label>
          <p className="a-field-note">Other devices will be signed out.</p>
          {passwordError && <p className="a-feature-error" role="alert">{passwordError}</p>}
          <button className="a-button primary" type="submit" disabled={changing}>{changing ? 'Updating...' : 'Update password'}</button>
        </form>
      </details>
      <button className="a-button secondary a-settings-signout" onClick={onSignOut}><LogOut size={17}/>Sign out</button>
    </section>

    <section className="a-panel a-preference-card">
      <div className="a-preference-heading"><span className="a-action-icon tint-1"><Users size={21}/></span><h2>Team & access</h2></div>
      <div className="a-preference-links">
        <Link to="/admin/admins"><span><Users size={18}/>Administrators</span><ArrowUpRight size={17}/></Link>
        <Link to="/admin/audit-logs"><span><ShieldCheck size={18}/>Audit logs</span><ArrowUpRight size={17}/></Link>
      </div>
    </section>

    <section className="a-panel a-preference-card">
      <div className="a-preference-heading"><span className="a-action-icon tint-0"><Globe size={21}/></span><h2>Workspace</h2></div>
      <dl className="a-preference-list">
        <div><dt>Organization</dt><dd>Arc Optical Club</dd></div>
        <div><dt>Currency</dt><dd>GHS</dd></div>
        <div><dt>Time zone</dt><dd>Africa/Accra</dd></div>
        <div><dt>Language</dt><dd>{SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name || 'English'}</dd></div>
      </dl>
    </section>
  </div>
}
