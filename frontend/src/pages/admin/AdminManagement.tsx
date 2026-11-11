import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertTriangle, Eye, EyeOff, KeyRound, Lock, Plus, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react'
import { adminApi, apiErrorMessage } from '../../lib/api'

type Admin = { id: string; name: string; email: string; createdAt: string; lastLoginAt: string | null }
const date = (value: string | null) => value ? new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Accra' }) : 'Not signed in yet'

function AddAdministrator({ onClose, onCreated }: { onClose: () => void; onCreated: (admin: Admin) => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [saving, setSaving] = useState(false), [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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

  return (
    <dialog ref={ref} className="a-dialog" aria-labelledby="add-admin-title" onCancel={e => { if (saving) e.preventDefault(); else onClose() }}>
      <div className="a-dialog-head">
        <div><h2 id="add-admin-title">Add an administrator</h2></div>
        <button disabled={saving} onClick={onClose} className="a-icon-button" aria-label="Close"><X size={20}/></button>
      </div>
      <form className="a-form" onSubmit={submit}>
        <label>Full name<input autoFocus name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Administrator’s name"/></label>
        <label>Email address<input name="email" type="email" required maxLength={180} autoComplete="off" placeholder="name@example.com"/></label>
        <label>
          Password
          <div style={{ position: 'relative' }}>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={12}
              maxLength={256}
              autoComplete="new-password"
              placeholder="At least 12 characters"
            />
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
          <small>Share sign-in details directly. No invitation email is sent.</small>
        </label>
        <p className="a-admin-access-note"><ShieldCheck size={20}/>Full administrator access, including creating and managing other admins.</p>
        {error && <p className="a-feature-error" role="alert">{error}</p>}
        <div className="a-form-actions">
          <button className="a-button secondary" type="button" disabled={saving} onClick={onClose}>Cancel</button>
          <button className="a-button primary" disabled={saving} type="submit"><Plus size={17}/>{saving ? 'Creating account…' : 'Create administrator'}</button>
        </div>
      </form>
    </dialog>
  )
}

function ChangeAdminPasswordModal({
  admin,
  onClose,
  onSuccess,
}: {
  admin: Admin
  onClose: () => void
  onSuccess: (notice: string) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    ref.current?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      focused?.focus()
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const form = new FormData(event.currentTarget)
    const newPassword = String(form.get('newPassword'))
    const confirmPassword = String(form.get('confirmPassword'))

    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const response = await adminApi.post(`/admin/admins/${admin.id}/password`, { newPassword })
      onSuccess(response.data.message || `Password updated for ${admin.name || admin.email}.`)
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not change password.'))
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={ref}
      className="a-dialog"
      aria-labelledby="change-pw-title"
      onCancel={(e) => {
        if (saving) e.preventDefault()
        else onClose()
      }}
    >
      <div className="a-dialog-head">
        <div>
          <h2 id="change-pw-title">Change administrator password</h2>
          <p className="a-subline" style={{ marginTop: 4 }}>For {admin.name || 'administrator'} ({admin.email})</p>
        </div>
        <button disabled={saving} onClick={onClose} className="a-icon-button" aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <form className="a-form" onSubmit={submit}>
        <label>
          New password
          <div style={{ position: 'relative' }}>
            <input
              autoFocus
              type={showPassword ? 'text' : 'password'}
              name="newPassword"
              required
              minLength={12}
              maxLength={256}
              autoComplete="new-password"
              placeholder="At least 12 characters"
            />
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
          <small>Must be at least 12 characters.</small>
        </label>
        <label>
          Confirm new password
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            required
            minLength={12}
            maxLength={256}
            autoComplete="new-password"
            placeholder="Re-type new password"
          />
        </label>
        <p className="a-admin-access-note">
          <KeyRound size={18} />
          Active sessions on other devices for this account will be terminated immediately.
        </p>
        {error && <p className="a-feature-error" role="alert">{error}</p>}
        <div className="a-form-actions">
          <button className="a-button secondary" type="button" disabled={saving} onClick={onClose}>
            Cancel
          </button>
          <button className="a-button primary" disabled={saving} type="submit">
            <Lock size={16} />
            {saving ? 'Updating password…' : 'Update password'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

function DeleteAdminModal({
  admin,
  isSelf,
  canDelete,
  onClose,
  onDeleted,
}: {
  admin: Admin
  isSelf: boolean
  canDelete: boolean
  onClose: () => void
  onDeleted: (adminId: string, wasSelf: boolean) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    ref.current?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      focused?.focus()
    }
  }, [])

  async function handleDelete() {
    if (deleting || !canDelete) return
    setDeleting(true)
    setError('')
    try {
      const response = await adminApi.delete(`/admin/admins/${admin.id}`)
      onDeleted(admin.id, response.data.data?.wasSelf || isSelf)
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not delete administrator.'))
      setDeleting(false)
    }
  }

  return (
    <dialog
      ref={ref}
      className="a-dialog"
      aria-labelledby="delete-admin-title"
      onCancel={(e) => {
        if (deleting) e.preventDefault()
        else onClose()
      }}
    >
      <div className="a-dialog-head">
        <div>
          <h2 id="delete-admin-title">
            {!canDelete
              ? 'Cannot delete administrator'
              : isSelf
              ? 'Delete your admin account?'
              : 'Delete administrator?'}
          </h2>
        </div>
        <button disabled={deleting} onClick={onClose} className="a-icon-button" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div className="a-form" style={{ marginTop: 12 }}>
        {!canDelete ? (
          <>
            <p className="a-feature-error" style={{ margin: 0 }}>
              <AlertTriangle size={18} />
              You cannot delete the only administrator. At least one administrator account must exist to manage the Arc workspace.
            </p>
            <div className="a-form-actions" style={{ marginTop: 24 }}>
              <button className="a-button secondary" type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : isSelf ? (
          <>
            <p style={{ color: '#466473', lineHeight: 1.6, margin: 0 }}>
              You are about to delete your own administrator account (<strong>{admin.email}</strong>).
            </p>
            <p className="a-feature-error" style={{ margin: '14px 0 0' }}>
              <AlertTriangle size={18} />
              You will be signed out immediately and will permanently lose access to the admin workspace.
            </p>
            {error && <p className="a-feature-error" role="alert">{error}</p>}
            <div className="a-form-actions" style={{ marginTop: 24 }}>
              <button className="a-button secondary" type="button" disabled={deleting} onClick={onClose}>
                Cancel
              </button>
              <button className="a-button danger" disabled={deleting} type="button" onClick={handleDelete}>
                <Trash2 size={16} />
                {deleting ? 'Deleting account…' : 'Yes, delete my account'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: '#466473', lineHeight: 1.6, margin: 0 }}>
              Are you sure you want to remove <strong>{admin.name || 'this administrator'}</strong> ({admin.email})?
            </p>
            <p className="a-admin-access-note" style={{ margin: '14px 0 0' }}>
              <Trash2 size={18} />
              They will lose access immediately and all active sessions will be terminated.
            </p>
            {error && <p className="a-feature-error" role="alert">{error}</p>}
            <div className="a-form-actions" style={{ marginTop: 24 }}>
              <button className="a-button secondary" type="button" disabled={deleting} onClick={onClose}>
                Cancel
              </button>
              <button className="a-button danger" disabled={deleting} type="button" onClick={handleDelete}>
                <Trash2 size={16} />
                {deleting ? 'Deleting…' : 'Delete administrator'}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}

export default function AdminManagement({ adminEmail }: { adminEmail: string }) {
  const [admins, setAdmins] = useState<Admin[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [notice, setNotice] = useState('')
  const [passwordTarget, setPasswordTarget] = useState<Admin | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    void adminApi
      .get('/admin/admins', { signal: controller.signal })
      .then((response) => {
        setAdmins(response.data.data)
        setError('')
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(apiErrorMessage(e, 'Administrators could not be loaded.'))
      })
    return () => controller.abort()
  }, [refresh])

  return (
    <>
      <section className="a-panel a-admin-members">
        <div className="a-panel-heading">
          <div>
            <span className="a-record-count">{admins ? admins.length : '...'} administrators</span>
          </div>
          <div className="a-analytics-controls">
            <button className="a-icon-button" aria-label="Refresh administrators" onClick={() => setRefresh((r) => r + 1)}>
              <RefreshCw size={17} />
            </button>
            <button
              className="a-button primary"
              onClick={() => {
                setOpen(true)
                setNotice('')
              }}
            >
              <Plus size={17} />
              Add administrator
            </button>
          </div>
        </div>
        {notice && (
          <p className="a-feature-success" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="a-feature-error" role="alert">
            {error}
            <button className="a-text-link" onClick={() => setRefresh((r) => r + 1)}>
              Try again
            </button>
          </p>
        )}
        {!admins && !error && <p className="a-feature-loading" role="status">Loading administrators…</p>}
        {admins && (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>ADMINISTRATOR</th>
                  <th>ACCESS</th>
                  <th>ADDED</th>
                  <th>LAST SIGN-IN</th>
                  <th style={{ textAlign: 'right', paddingRight: 8 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div className="a-person-cell">
                        <span className="a-initials tint-0">
                          <ShieldCheck size={20} />
                        </span>
                        <div>
                          <strong>
                            {admin.name || 'Arc administrator'} {admin.email === adminEmail && <span className="a-you">You</span>}
                          </strong>
                          <span className="a-subline">{admin.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="a-badge blue">Administrator</span>
                    </td>
                    <td>{date(admin.createdAt)}</td>
                    <td>{date(admin.lastLoginAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="a-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="a-button secondary a-btn-sm"
                          onClick={() => {
                            setNotice('')
                            setPasswordTarget(admin)
                          }}
                          title={`Change password for ${admin.name || admin.email}`}
                        >
                          <KeyRound size={14} />
                          <span>Password</span>
                        </button>
                        <button
                          type="button"
                          className="a-button secondary danger-text a-btn-sm"
                          onClick={() => {
                            setNotice('')
                            setDeleteTarget(admin)
                          }}
                          title={`Delete administrator ${admin.name || admin.email}`}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {open && (
        <AddAdministrator
          onClose={() => setOpen(false)}
          onCreated={(admin) => {
            setAdmins((current) => [...(current || []), admin])
            setOpen(false)
            setNotice(`${admin.name || admin.email} can now sign in with the credentials you created.`)
          }}
        />
      )}

      {passwordTarget && (
        <ChangeAdminPasswordModal
          admin={passwordTarget}
          onClose={() => setPasswordTarget(null)}
          onSuccess={(msg) => {
            setNotice(msg)
            setPasswordTarget(null)
          }}
        />
      )}

      {deleteTarget && (
        <DeleteAdminModal
          admin={deleteTarget}
          isSelf={deleteTarget.email === adminEmail}
          canDelete={(admins?.length || 0) > 1}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(adminId, wasSelf) => {
            if (wasSelf) {
              window.location.href = '/admin'
              return
            }
            setAdmins((current) => (current || []).filter((a) => a.id !== adminId))
            setDeleteTarget(null)
            setNotice(`Administrator ${deleteTarget.name || deleteTarget.email} was removed.`)
          }}
        />
      )}
    </>
  )
}
