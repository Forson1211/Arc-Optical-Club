import SiteImage from '../../components/SiteImage'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, Bell, BookOpen, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Eye, HandHeart, Heart, LayoutDashboard, Mail, MapPin, Menu, Plus, Search, Settings, ShieldCheck, Sparkles, Users, X } from 'lucide-react'
import BrandLogo from '../../components/BrandLogo'
import ContentManager from './ContentManager'
import { useContent } from '../../lib/content'
import type { ContentProgram } from '../../lib/content'
import { downloadCsv, emptyWorkspace, money, programNames, shortDate, todayInGhana } from './data'
import type { Donation, Outreach, Volunteer, Workspace } from './data'
import { adminApi, apiErrorMessage } from '../../lib/api'
import { trackAdmin } from '../../lib/activity'
import AnalyticsPanel from './AnalyticsPanel'
import AdminManagement from './AdminManagement'
import AuditLogs from './AuditLogs'
import AdminSettings from './AdminSettings'
import LanguageSwitcher from './LanguageSwitcher'
import { I18nProvider, useI18n } from './i18n'
import './admin.css'

type Editor = { kind: 'outreach'; record?: Outreach } | { kind: 'volunteer'; record?: Volunteer } | { kind: 'donation'; record?: Donation }
const titles: Record<string, [string, string]> = {
  '': ['Overview', ''], outreaches: ['Outreaches', ''], programs: ['Programs', ''], news: ['News & stories', ''], team: ['Team', ''], partners: ['Partners', ''],
  volunteers: ['Volunteers', ''], donations: ['Donations', ''], messages: ['Messages', ''],
  subscribers: ['Subscribers', ''], reports: ['Reports', ''], settings: ['Settings', ''],
  analytics: ['Analytics', ''], admins: ['Administrators', ''], 'audit-logs': ['Audit logs', ''],
}

function Badge({ children }: { children: ReactNode }) {
  const text = String(children)
  return <span className={`a-badge ${['Completed', 'Active', 'Received'].includes(text) ? 'green' : ['Pending', 'Planning', 'Pledged'].includes(text) ? 'amber' : 'blue'}`}><i/>{children}</span>
}

function Modal({ title, description, children, onClose }: { title: string; description?: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    ref.current?.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous; previouslyFocused?.focus() }
  }, [])
  return <dialog ref={ref} aria-label={title} className="a-dialog" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}><div className="a-dialog-head"><div><span className="a-eyebrow">ARC WORKSPACE</span><h2>{title}</h2>{description && <p>{description}</p>}</div><button className="a-icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</dialog>
}

function RecordEditor({ editor, onClose, onSave, saving }: { editor: Editor; onClose: () => void; onSave: (editor: Editor, form: FormData) => void; saving: boolean }) {
  const record = editor.record
  const { data: publishedPrograms } = useContent<ContentProgram[]>('/content/programs')
  const availablePrograms = [...new Set([...(publishedPrograms?.map(program => program.title) || programNames), ...(record && 'program' in record ? [record.program] : [])])]
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSave(editor, new FormData(event.currentTarget)) }
  const programSelect = <label>Program<select name="program" required defaultValue={record && 'program' in record ? record.program : ''}><option value="" disabled>Choose a program</option>{availablePrograms.map(p => <option key={p}>{p}</option>)}</select></label>
  return <Modal title={`${record ? 'Edit' : 'Add'} ${editor.kind === 'outreach' ? 'an outreach' : editor.kind === 'volunteer' ? 'a volunteer' : 'a donation'}`} description="Changes are saved to the Arc workspace." onClose={onClose}><form onSubmit={submit} className="a-form">
    <label>{editor.kind === 'outreach' ? 'Outreach name' : editor.kind === 'donation' ? 'Donor / organization' : 'Full name'}<input name="name" required maxLength={120} defaultValue={record?.name} placeholder={editor.kind === 'outreach' ? 'e.g. Community vision day' : 'Enter a name'}/></label>
    {editor.kind === 'outreach' && <>{programSelect}<div className="a-form-row"><label>Location<input name="location" required maxLength={120} defaultValue={editor.record?.location} placeholder="Town or community"/></label><label>Date<input type="date" name="date" required defaultValue={editor.record?.date || todayInGhana()}/></label></div><div className="a-form-row"><label>Screening target<input type="number" name="target" required min="1" max="100000" defaultValue={editor.record?.target || 100}/></label><label>People screened<input type="number" name="screened" required min="0" max="100000" defaultValue={editor.record?.screened || 0}/></label></div><label>Status<select name="status" defaultValue={editor.record?.status || 'Planning'}><option>Planning</option><option>Confirmed</option><option>Completed</option></select></label></>}
    {editor.kind === 'volunteer' && <><label>Email address<input name="email" type="email" required maxLength={180} defaultValue={editor.record?.email} placeholder="volunteer@example.com"/></label><label>Role<input name="role" required maxLength={100} defaultValue={editor.record?.role} placeholder="e.g. Student volunteer"/></label><label>Status<select name="status" defaultValue={editor.record?.status || 'Pending'}><option>Pending</option><option>Active</option><option>Declined</option></select></label></>}
    {editor.kind === 'donation' && <><div className="a-form-row"><label>Amount (GHS)<input type="number" step="0.01" name="amount" required min="0.01" max="100000000" defaultValue={editor.record?.amount}/></label><label>Date<input type="date" name="date" required defaultValue={editor.record?.date || todayInGhana()}/></label></div>{programSelect}<label>Status<select name="status" defaultValue={editor.record?.status || 'Received'}><option>Received</option><option>Pledged</option></select></label></>}
    {editor.kind === 'volunteer' && editor.record?.source === 'join-form' && <section className="a-application-details"><h3>Application details</h3><dl><div><dt>Phone</dt><dd>{editor.record.phone}</dd></div><div><dt>Location</dt><dd>{editor.record.location}</dd></div><div><dt>Organization</dt><dd>{editor.record.organization || 'Not provided'}</dd></div><div><dt>Availability</dt><dd>{editor.record.availability}</dd></div><div><dt>Interests</dt><dd>{editor.record.interests?.join(', ')}</dd></div><div><dt>Submitted</dt><dd>{editor.record.createdAt?.slice(0, 10)}</dd></div></dl><h4>Why they want to join</h4><p>{editor.record.motivation}</p></section>}
    <div className="a-form-actions"><button type="button" className="a-button secondary" onClick={onClose}>Cancel</button><button className="a-button primary" type="submit" disabled={saving}><Check size={16}/>{saving ? 'Saving…' : `Save ${editor.kind}`}</button></div>
  </form></Modal>
}

function ImpactChart({ outreaches, period, setPeriod }: { outreaches: Outreach[]; period: string; setPeriod: (value: string) => void }) {
  const { t, lang } = useI18n()
  const chartPrograms = [...new Set([...programNames, ...outreaches.map(record => record.program)])]
  const dates = outreaches.map(o => o.date.slice(0, 7)).sort()
  const latest = dates[dates.length - 1] || todayInGhana().slice(0, 7)
  const end = new Date(`${latest}-01T12:00:00Z`)
  // Prefer the current Ghana calendar month; future planned events do not shift the chart.
  const current = new Date(`${todayInGhana().slice(0, 7)}-01T12:00:00Z`)
  if (end > current) end.setTime(current.getTime())
  const length = Number(period)
  const monthLocale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB'
  const months = Array.from({ length }, (_, i) => {
    const d = new Date(end); d.setUTCMonth(end.getUTCMonth() - length + i + 1)
    const key = d.toISOString().slice(0, 7)
    return { key, label: d.toLocaleDateString(monthLocale, { month: 'short', timeZone: 'Africa/Accra' }), counts: chartPrograms.map(p => outreaches.filter(o => o.status === 'Completed' && o.program === p && o.date.startsWith(key)).reduce((sum, o) => sum + o.screened, 0)) }
  })
  const total = months.reduce((sum, m) => sum + m.counts.reduce((s, c) => s + c, 0), 0)
  const maximum = Math.max(100, Math.ceil(Math.max(...months.map(m => m.counts.reduce((s, c) => s + c, 0))) / 100) * 100)
  return <section className="a-panel a-impact"><div className="a-panel-heading"><div><h2>{t('peopleScreened')} <span className="a-live-dot"/></h2></div><label className="a-select"><span className="sr-only">{t('chartPeriod')}</span><select value={period} onChange={e => setPeriod(e.target.value)}><option value="6">{t('last6Months')}</option><option value="3">{t('last3Months')}</option><option value="12">{t('last12Months')}</option></select></label></div><div className="a-chart-summary"><strong>{total.toLocaleString()}</strong><span>{t('peopleReached')} <span className="a-chart-year">/ {months[0].key.slice(0, 4)}{months[0].key.slice(0, 4) !== months[months.length - 1]?.key.slice(0, 4) ? `–${months[months.length - 1]?.key.slice(0, 4)}` : ''}</span></span></div><div className="a-chart" role="img" aria-label={`${t('peopleScreened')}: ${months.map(m => `${m.label} ${m.key.slice(0, 4)}: ${m.counts.reduce((s, c) => s + c, 0)}`).join('; ')}`}><div className="a-chart-axis">{[maximum, maximum * .75, maximum * .5, maximum * .25, 0].map(t => <span key={t}>{t}</span>)}</div><div className="a-chart-plot"><div className="a-chart-grid">{[0, 1, 2, 3, 4].map(i => <i key={i}/>)}</div><div className="a-bars">{months.map(m => <div className="a-bar-column" key={m.key}><div className="a-bar-stack" title={`${m.label}: ${m.counts.reduce((s, c) => s + c, 0)} people`}>{m.counts.map((c, i) => <div key={i} className={`a-bar-segment program-${i % 3}`} style={{ height: `${c / maximum * 100}%` }}/>)}</div><span>{m.label}</span></div>)}</div></div></div><div className="a-chart-legend">{chartPrograms.map((p, i) => <span key={p}><i className={`program-${i % 3}`}/>{p}</span>)}</div></section>
}

function AdminDashboardInner({ adminEmail, adminName = '', onProfileSaved, onLogout }: { adminEmail: string; adminName?: string; onProfileSaved: (name: string) => void; onLogout: () => Promise<void> }) {
  const { t, formatDate, lang } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const requestedSection = location.pathname.replace(/^\/admin\/?/, '').replace(/\/$/, '')
  const section = Object.prototype.hasOwnProperty.call(titles, requestedSection) ? requestedSection : ''
  const [workspace, setWorkspace] = useState(emptyWorkspace)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('6')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [toast, setToast] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [messageId, setMessageId] = useState<string | null>(null)
  const [connection, setConnection] = useState<'loading' | 'ready' | 'error'>('loading')
  const [connectionError, setConnectionError] = useState('')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [clock, setClock] = useState(() => new Date())
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('All statuses')
  const today = todayInGhana()
  const pending = workspace.volunteers.filter(v => v.status === 'Pending').length
  const unread = workspace.messages.filter(m => !m.read).length
  const screened = workspace.outreaches.filter(o => o.status === 'Completed').reduce((s, o) => s + o.screened, 0)
  const received = workspace.donations.filter(d => d.status === 'Received').reduce((s, d) => s + d.amount, 0)
  const active = workspace.volunteers.filter(v => v.status === 'Active').length
  const scheduled = workspace.outreaches.filter(o => o.status !== 'Completed').sort((a, b) => a.date.localeCompare(b.date))
  const completed = workspace.outreaches.filter(o => o.status === 'Completed').length
  const selectedMessage = workspace.messages.find(m => m.id === messageId)
  const lastActivity = useRef('')
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Accra', hour: 'numeric', hourCycle: 'h23' }).format(clock))
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening')
  const displayName = adminName.trim().split(/\s+/)[0] || 'Admin'

  const navigation = [
    { section: t('navSectionWorkspace'), items: [
      { path: '', label: t('overview'), icon: LayoutDashboard },
      { path: 'analytics', label: t('analytics'), icon: Activity },
      { path: 'outreaches', label: t('outreaches'), icon: Eye },
      { path: 'programs', label: t('programs'), icon: BookOpen },
      { path: 'news', label: t('news'), icon: BookOpen },
    ] },
    { section: t('navSectionCommunity'), items: [
      { path: 'team', label: t('team'), icon: Users },
      { path: 'partners', label: t('partners'), icon: HandHeart },
      { path: 'volunteers', label: t('volunteers'), icon: Users },
      { path: 'donations', label: t('donations'), icon: HandHeart },
      { path: 'messages', label: t('messages'), icon: Mail },
      { path: 'subscribers', label: t('subscribers'), icon: Users },
    ] },
    { section: t('navSectionAdmin'), items: [
      { path: 'reports', label: t('reports'), icon: Activity },
      { path: 'admins', label: t('admins'), icon: ShieldCheck },
      { path: 'audit-logs', label: t('auditLogs'), icon: BookOpen },
      { path: 'settings', label: t('settings'), icon: Settings },
    ] },
  ]

  useEffect(() => { const timer = setInterval(() => setClock(new Date()), 60000); return () => clearInterval(timer) }, [])

  useEffect(() => {
    const key = `${location.key}:${section}`
    if (lastActivity.current !== key) { lastActivity.current = key; trackAdmin('page_view', `/admin${section ? '/' + section : ''}`, 'navigation') }
  }, [location.key, section])
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.arc-admin a,.arc-admin button')) return
      const current = window.location.pathname.replace(/^\/admin\/?/, '').replace(/\/$/, '')
      if (Object.prototype.hasOwnProperty.call(titles, current)) trackAdmin('click', `/admin${current ? '/' + current : ''}`, 'button')
    }
    document.addEventListener('click', click, true)
    return () => document.removeEventListener('click', click, true)
  }, [])

  useEffect(() => { const previousTitle = document.title; return () => { document.title = previousTitle } }, [])
  const refresh = useCallback(async () => {
    setSyncing(true)
    try {
      const { data } = await adminApi.get<{ data: Workspace; storage: string }>('/admin/workspace')
      setWorkspace(data.data); setConnection('ready'); setConnectionError(''); setLastSynced(new Date())
    } catch (error) { setConnectionError(apiErrorMessage(error, 'We could not load your workspace.')); setConnection('error') }
    finally { setSyncing(false) }
  }, [])
  useEffect(() => {
    void refresh()
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 30000)
    const onFocus = () => { void refresh() }
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [refresh])
  useEffect(() => { setMobileOpen(false); setQuery(''); setPage(1); setFilter('All statuses'); document.title = `${navigation.flatMap(n => n.items).find(n => n.path === section)?.label || t('overview')} | Arc Admin` }, [section, lang])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 5500); return () => clearTimeout(timer) }, [toast])
  useEffect(() => { if (!mobileOpen) return; const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false) }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close) }, [mobileOpen])

  const matches = (values: (string | number)[]) => values.join(' ').toLowerCase().includes(query.toLowerCase().trim())
  async function save(editorState: Editor, form: FormData) {
    if (saving) return
    const value = (key: string) => String(form.get(key) || '').trim()
    if (!value('name') || (editorState.kind === 'outreach' && !value('location')) || (editorState.kind === 'volunteer' && !value('role'))) { setToast('Please complete all required fields.'); return }
    const collection = editorState.kind === 'outreach' ? 'outreaches' : editorState.kind === 'volunteer' ? 'volunteers' : 'donations'
    const payload = editorState.kind === 'outreach' ? { name: value('name'), program: value('program'), location: value('location'), date: value('date'), target: Number(value('target')), screened: Number(value('screened')), status: value('status') }
      : editorState.kind === 'volunteer' ? { name: value('name'), email: value('email'), role: value('role'), status: value('status') }
      : { name: value('name'), amount: Number(value('amount')), program: value('program'), date: value('date'), status: value('status') }
    setSaving(true)
    try {
      const response = editorState.record ? await adminApi.patch('/admin/' + collection + '/' + editorState.record.id, payload) : await adminApi.post('/admin/' + collection, payload)
      const record = response.data.data
      setWorkspace(w => ({ ...w, [collection]: editorState.record ? w[collection].map(r => r.id === record.id ? record : r) : [...w[collection], record] }))
      setEditor(null); setToast('Your ' + editorState.kind + ' has been saved.')
    } catch (error) { setToast(apiErrorMessage(error, 'We could not save this record. Please try again.')) }
    finally { setSaving(false) }
  }
  async function approveVolunteer(volunteer: Volunteer) {
    if (saving) return
    setSaving(true)
    try {
      const { data } = await adminApi.patch('/admin/volunteers/' + volunteer.id, { name: volunteer.name, email: volunteer.email, role: volunteer.role, status: 'Active' })
      setWorkspace(w => ({ ...w, volunteers: w.volunteers.map(v => v.id === volunteer.id ? data.data : v) }))
      setToast(volunteer.name + ' has been approved.')
    } catch (error) { setToast(apiErrorMessage(error, 'We could not approve this application.')) }
    finally { setSaving(false) }
  }
  function exportReport() {
    trackAdmin('export', location.pathname, 'outreach.export')
    downloadCsv('arc-outreach-report.csv', [['ARC OPTICAL CLUB — OUTREACH REPORT'], ['Name', 'Program', 'Location', 'Date', 'Status', 'Screened', 'Target'], ...workspace.outreaches.map(o => [o.name, o.program, o.location, o.date, o.status, o.screened, o.target])])
    setToast('Outreach report exported.')
  }
  async function openMessage(id: string) {
    try {
      await adminApi.patch('/admin/messages/' + id, { status: 'read' })
      setWorkspace(w => ({ ...w, messages: w.messages.map(m => m.id === id ? { ...m, read: true, status: 'read' } : m) })); setMessageId(id)
    } catch (error) { setToast(apiErrorMessage(error, 'We could not open this message.')) }
  }
  async function toggleSubscriber(id: string, status: 'subscribed' | 'unsubscribed') {
    try {
      const { data } = await adminApi.patch('/admin/subscribers/' + id, { status })
      setWorkspace(w => ({ ...w, subscribers: w.subscribers.map(s => s.id === id ? data.data : s) }))
      setToast('Subscription updated.')
    } catch (error) { setToast(apiErrorMessage(error, 'We could not update this subscription.')) }
  }
  async function signOut() {
    try { await onLogout() }
    catch (error) { setToast(apiErrorMessage(error, 'We could not sign you out. Please try again.')) }
  }

  const outreachRows = workspace.outreaches.filter(o => matches([o.name, o.program, o.location, o.status]) && (filter === 'All statuses' || o.status === filter)).sort((a, b) => b.date.localeCompare(a.date))
  const volunteerRows = workspace.volunteers.filter(v => matches([v.name, v.email, v.role, v.status]) && (filter === 'All statuses' || v.status === filter))
  const donationRows = workspace.donations.filter(d => matches([d.name, d.program, d.amount, d.status]) && (filter === 'All statuses' || d.status === filter)).sort((a, b) => b.date.localeCompare(a.date))

  function outreachTable(compact = false) {
    const rows = compact ? scheduled.filter(o => matches([o.name, o.program, o.location])).slice(0, 3) : outreachRows.slice((page - 1) * 8, page * 8)
    return <div className="a-table-wrap"><table className="a-table"><thead><tr><th>OUTREACH / PROGRAM</th><th>COMMUNITY</th><th>DATE</th><th>STATUS</th><th><span className="sr-only">Open outreach</span></th></tr></thead><tbody>{rows.map(o => <tr key={o.id}><td><div className="a-person-cell"><span className={`a-table-icon tint-${Math.max(0, programNames.indexOf(o.program)) % 3}`}><Eye size={18}/></span><div><button className="a-name-button" onClick={() => setEditor({ kind: 'outreach', record: o })}>{o.name}</button><span className="a-subline">{o.program}</span></div></div></td><td><span className="a-location"><MapPin size={13}/>{o.location}</span></td><td>{shortDate(o.date)}<span className="a-subline">{o.date.slice(0, 4)}</span></td><td><Badge>{o.status}</Badge></td><td><button className="a-icon-button" aria-label={`Edit ${o.name}`} onClick={() => setEditor({ kind: 'outreach', record: o })}><ArrowUpRight size={17}/></button></td></tr>)}</tbody></table>{!rows.length && <Empty text="No outreaches match this view."/>}</div>
  }

  function toolbar(statuses: string[], label: string, kind: Editor['kind']) {
    return <div className="a-toolbar"><label className="a-search"><Search size={17}/><input aria-label={`Search ${label}`} placeholder={`Search ${label}…`} value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}/></label><div><label className="a-select"><span className="sr-only">Filter by status</span><select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}><option>All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></label><button className="a-button primary" onClick={() => setEditor({ kind } as Editor)}><Plus size={16}/>Add {kind}</button></div></div>
  }

  return <div className="arc-admin">
    <a href="#admin-content" className="a-skip">{t('skipToContent')}</a>
    {mobileOpen && <button className="a-mobile-shade" aria-label={t('closeNav')} onClick={() => setMobileOpen(false)}/>}
    <aside className={`a-sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="Admin sidebar"><Link className="a-brand" to="/admin" aria-label="Arc Optical Club admin overview"><BrandLogo variant="white"/><span>{t('impactWorkspace')}</span></Link><button className="a-mobile-close a-icon-button" aria-label={t('closeNav')} onClick={() => setMobileOpen(false)}><X size={20}/></button><nav aria-label="Admin navigation">{navigation.map(group => <div className="a-nav-group" key={group.section}><p>{group.section}</p>{group.items.map(({ path, label, icon: Icon }) => <NavLink key={path} to={`/admin${path ? `/${path}` : ''}`} end className={({ isActive }) => `a-nav-link ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.8}/><span>{label}</span>{path === 'messages' && unread > 0 && <b>{unread}</b>}{path === 'volunteers' && pending > 0 && <i className="a-nav-indicator"/>}</NavLink>)}</div>)}</nav><div className="a-sidebar-bottom"><button className="a-profile" onClick={() => navigate('/admin/settings')}><span className="a-avatar">AC<span/></span><span><strong>{displayName || t('adminRole')}</strong><small>{t('adminSubrole')}</small></span><ChevronDown size={15}/></button></div></aside>
    <div className="a-main"><header className="a-topbar"><div className="a-breadcrumb"><button className="a-menu a-icon-button" aria-label={t('openNav')} aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={22}/></button><span>{t('workspace')}</span><ChevronRight size={13}/><strong>{navigation.flatMap(n => n.items).find(n => n.path === section)?.label || t('overview')}</strong></div><div className="a-topbar-actions"><LanguageSwitcher onSelect={() => setToast(t('languageChanged'))} /><span className="a-topbar-divider"/><Link to="/" className="a-visit" target="_blank" rel="noreferrer">{t('viewWebsite')} <ArrowUpRight size={14}/></Link><button className="a-notifications a-icon-button" aria-label={`${unread} ${t('messages')}`} onClick={() => navigate('/admin/messages')}><Bell size={20}/>{unread > 0 && <i/>}</button><button className="a-top-avatar" aria-label={t('workspaceSettings')} onClick={() => navigate('/admin/settings')}>AC</button></div></header>
    <main id="admin-content" className="a-content">{section === '' ? <>
      <div className="a-page-heading a-overview-heading"><div><h1>{greeting}, {displayName}</h1><p>{connection === 'ready' ? <>{t('youHave')} <strong>{scheduled.filter(o => o.date >= today).length} {scheduled.filter(o => o.date >= today).length === 1 ? t('upcomingOutreaches') : t('upcomingOutreachesPlural')}</strong> {t('and')} {pending} {pending === 1 ? t('volunteerApplications') : t('volunteerApplicationsPlural')} {t('toReview')}</> : t('overviewSub')}</p></div><div className="a-overview-actions"><span className="a-overview-date"><CalendarDays size={16}/>{formatDate(clock, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span><button className="a-button secondary" disabled={syncing} onClick={() => { void refresh() }}><Activity size={16}/>{syncing ? t('syncing') : t('syncLiveData')}</button><button className="a-button primary" onClick={() => setEditor({ kind: 'outreach' })}><Plus size={16}/>{t('newOutreach')}</button></div></div>
      <section className="a-welcome" aria-labelledby="admin-welcome-title"><SiteImage className="a-welcome-photo" src="/images/arc-eye-screening-hero.png" alt=""/><div className="a-welcome-shade"/><div className="a-welcome-copy"><h2 id="admin-welcome-title">{t('welcomeBack')}</h2><p>{t('overviewSub')}</p><span className={`a-welcome-status ${connection}`} role="status"><i/>{connection === 'ready' ? <>{t('liveDataActive')} &middot; {t('updated')} {formatDate(lastSynced || clock, { hour: 'numeric', minute: '2-digit', hour12: true })}</> : connection === 'error' ? t('connectionInterrupted') : t('connecting')}</span></div><div className="a-welcome-actions"><Link to="/admin/outreaches" className="a-button a-welcome-primary"><CalendarDays size={16}/>{t('manageOutreaches')}</Link><Link to="/admin/volunteers" className="a-button a-welcome-secondary"><Users size={16}/>{t('volunteers')}</Link></div></section>
    </> : <div className="a-page-heading a-section-heading"><h1>{navigation.flatMap(n => n.items).find(n => n.path === section)?.label || titles[section][0]}</h1></div>}



    {connection !== 'ready' ? <section className="a-panel a-connection-state"><Activity size={27}/><h2>{connection === 'loading' ? 'Loading your workspace…' : 'We could not load your workspace.'}</h2><p>{connection === 'loading' ? 'Getting your latest records from the server.' : connectionError}</p>{connection === 'error' && <button className="a-button primary" onClick={() => { void refresh() }}>Try again</button>}</section> : <>
    {(section === '' || section === 'reports') && <>
      <div className="a-stats">
        {[
          { label: t('peopleScreened'), value: screened.toLocaleString(), note: `${completed} ${t('completedVisits')}`, icon: Eye, color: 'blue', path: 'outreaches' },
          { label: t('activeVolunteers'), value: active.toString().padStart(2, '0'), note: `${pending} ${t('volunteerApplicationsPlural')} ${t('toReview')}`, icon: Users, color: 'teal', path: 'volunteers' },
          { label: t('donationsReceived'), value: money(received), note: `${workspace.donations.filter(d => d.status === 'Received').length} contributions`, icon: HandHeart, color: 'gold', path: 'donations' },
          { label: t('plannedOutreaches'), value: scheduled.length.toString().padStart(2, '0'), note: `${scheduled.reduce((s, o) => s + o.target, 0)} ${t('aimToReach')}`, icon: CalendarDays, color: 'violet', path: 'outreaches' },
        ].map(({ label, value, note, icon: Icon, color, path }) => <Link to={`/admin/${path}`} className={`a-stat ${color}`} key={label}><div className="a-stat-top"><span>{label}</span><span className="a-stat-icon"><Icon size={20} strokeWidth={1.7}/></span></div><strong>{value}</strong><span className="a-stat-note"><span/>{note}</span></Link>)}
      </div>
      <div className={`a-middle-grid a-middle-overview`}><ImpactChart outreaches={workspace.outreaches} period={period} setPeriod={setPeriod}/></div>
    </>}

    {section === '' && <><div className="a-lower-grid"><section className="a-panel a-outreach-panel"><div className="a-panel-heading"><div><h2>{t('upcomingOutreachesPlural')} <span className="a-count">{scheduled.length}</span></h2></div><Link className="a-text-link" to="/admin/outreaches">{t('viewAll')} <ArrowRight size={14}/></Link></div>{outreachTable(true)}</section><section className="a-panel a-attention"><div className="a-panel-heading"><div><h2>{t('needsAttention')}</h2></div><Sparkles size={18}/></div><Link to="/admin/volunteers"><span className="a-action-icon tint-1"><Users size={18}/></span><span><strong>{t('volunteerApplicationsPlural')}</strong><small>{pending} {t('volunteerApplicationsPlural')} {t('toReview')}</small></span><ChevronRight size={16}/></Link><Link to="/admin/messages"><span className="a-action-icon tint-0"><Mail size={18}/></span><span><strong>{t('messages')}</strong><small>{unread} {t('messages').toLowerCase()}</small></span><ChevronRight size={16}/></Link><Link to="/admin/donations"><span className="a-action-icon tint-2"><Heart size={18}/></span><span><strong>{t('pledgedDonations')}</strong><small>{money(workspace.donations.filter(d => d.status === 'Pledged').reduce((s, d) => s + d.amount, 0))} in support pledged</small></span><ChevronRight size={16}/></Link></section></div></>}

    {(section === '' || section === 'analytics') && <AnalyticsPanel compact={section === ''}/>}
    {section === 'admins' && <AdminManagement adminEmail={adminEmail}/>}
    {section === 'audit-logs' && <AuditLogs/>}

    {section === 'outreaches' && <section className="a-panel">{toolbar(['Planning', 'Confirmed', 'Completed'], 'outreaches', 'outreach')}{outreachTable()}<Pagination total={outreachRows.length} page={page} setPage={setPage}/></section>}

    {section === 'volunteers' && <><div className="a-mini-stats"><div><Users/><span><strong>{workspace.volunteers.length}</strong>Total volunteers</span></div><div><Check/><span><strong>{active}</strong>Active volunteers</span></div><div><Activity/><span><strong>{pending}</strong>Awaiting review</span></div></div><section className="a-panel">{toolbar(['Active', 'Pending', 'Declined'], 'volunteers', 'volunteer')}<div className="a-table-wrap"><table className="a-table"><thead><tr><th>VOLUNTEER</th><th>ROLE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{volunteerRows.slice((page - 1) * 8, page * 8).map((v, i) => <tr key={v.id}><td><div className="a-person-cell"><span className={`a-initials tint-${i % 3}`}>{v.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span><div><button className="a-name-button" onClick={() => setEditor({ kind: 'volunteer', record: v })}>{v.name}</button><span className="a-subline">{v.email}</span></div></div></td><td>{v.role}</td><td><Badge>{v.status}</Badge></td><td>{v.status === 'Pending' ? <button className="a-text-link" disabled={saving} onClick={() => { void approveVolunteer(v) }}>Approve <Check size={14}/></button> : <button className="a-text-link" onClick={() => setEditor({ kind: 'volunteer', record: v })}>Edit <ArrowUpRight size={14}/></button>}</td></tr>)}</tbody></table>{!volunteerRows.length && <Empty text="No volunteers match this view."/>}</div><Pagination total={volunteerRows.length} page={page} setPage={setPage}/></section></>}

    {section === 'donations' && <><div className="a-mini-stats"><div><HandHeart/><span><strong>{money(received)}</strong>Received contributions</span></div><div><Heart/><span><strong>{money(workspace.donations.filter(d => d.status === 'Pledged').reduce((s, d) => s + d.amount, 0))}</strong>Pledged support</span></div><div><Users/><span><strong>{workspace.donations.length}</strong>Recorded contributions</span></div></div><section className="a-panel">{toolbar(['Received', 'Pledged', 'Test'], 'donations', 'donation')}<div className="a-table-wrap"><table className="a-table"><thead><tr><th>SUPPORTER</th><th>PROGRAM</th><th>AMOUNT</th><th>DATE</th><th>STATUS</th><th><span className="sr-only">Edit donation</span></th></tr></thead><tbody>{donationRows.slice((page - 1) * 8, page * 8).map(d => <tr key={d.id}><td><strong>{d.name}</strong></td><td>{d.program}</td><td><strong>{money(d.amount)}</strong></td><td>{shortDate(d.date)} {d.date.slice(0, 4)}</td><td><Badge>{d.status}</Badge></td><td>{d.source === 'paystack' ? <span className="a-badge blue">{d.paymentMode === 'test' ? 'Test payment' : 'Paystack verified'}</span> : <button className="a-icon-button" aria-label={`Edit contribution from ${d.name}`} onClick={() => setEditor({ kind: 'donation', record: d })}><ArrowUpRight size={17}/></button>}</td></tr>)}</tbody></table>{!donationRows.length && <Empty text="No donations match this view."/>}</div><Pagination total={donationRows.length} page={page} setPage={setPage}/></section><p className="a-section-note">Paystack donations appear after verification. Test payments are excluded from received totals. You can also record contributions received outside the website.</p></>}

    {(section === 'programs' || section === 'news' || section === 'team' || section === 'partners') && <ContentManager key={section} kind={section}/>}

    {section === 'messages' && <section className="a-panel"><div className="a-toolbar"><label className="a-search"><Search size={17}/><input aria-label="Search messages" placeholder="Search messages…" value={query} onChange={e => setQuery(e.target.value)}/></label><span className="a-section-note">{unread} unread · Contact enquiries</span></div><div className="a-message-list">{workspace.messages.filter(m => matches([m.name, m.subject, m.message])).map(m => <button className={`a-message ${m.read ? '' : 'unread'}`} key={m.id} onClick={() => openMessage(m.id)}><span className="a-action-icon tint-0"><Mail size={20}/></span><span><span className="a-message-name">{m.name}{!m.read && <i/>}</span><strong>{m.subject}</strong><small>{m.message}</small></span><time dateTime={m.date}>{shortDate(m.date)}</time><ChevronRight size={17}/></button>)}{!workspace.messages.some(m => matches([m.name, m.subject, m.message])) && <Empty text="No messages match your search."/>}</div></section>}

    {section === 'subscribers' && <section className="a-panel"><div className="a-toolbar"><label className="a-search"><Search size={17}/><input aria-label="Search subscribers" placeholder="Search subscribers…" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}/></label><button className="a-button secondary" onClick={() => { downloadCsv('arc-newsletter-subscribers.csv', [['Email', 'Status', 'Subscribed on'], ...workspace.subscribers.map(s => [s.email, s.status, s.createdAt.slice(0, 10)])]); trackAdmin('export', location.pathname, 'subscribers.export'); setToast('Subscribers exported.') }}><ArrowDownToLine size={16}/>Export subscribers</button></div><div className="a-table-wrap"><table className="a-table"><thead><tr><th>EMAIL ADDRESS</th><th>SUBSCRIBED ON</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{workspace.subscribers.filter(s => matches([s.email, s.status])).slice((page - 1) * 8, page * 8).map(s => <tr key={s.id}><td><strong>{s.email}</strong></td><td>{s.createdAt.slice(0, 10)}</td><td><Badge>{s.status === 'subscribed' ? 'Active' : 'Unsubscribed'}</Badge></td><td><button className="a-text-link" onClick={() => { void toggleSubscriber(s.id, s.status === 'subscribed' ? 'unsubscribed' : 'subscribed') }}>{s.status === 'subscribed' ? 'Unsubscribe' : 'Resubscribe'}</button></td></tr>)}</tbody></table>{!workspace.subscribers.some(s => matches([s.email, s.status])) && <Empty text="No subscribers match this view."/>}</div><Pagination total={workspace.subscribers.filter(s => matches([s.email, s.status])).length} page={page} setPage={setPage}/><p className="a-inbox-note">Export this list to your newsletter service.</p></section>}

    {section === 'reports' && <section className="a-panel a-report-card"><span className="a-action-icon tint-0"><ArrowDownToLine size={24}/></span><div><h2>Export outreach data</h2><p>{workspace.outreaches.length} outreach records</p></div><button className="a-button primary" onClick={exportReport}><ArrowDownToLine size={16}/>Download CSV</button></section>}

    {section === 'settings' && <AdminSettings name={adminName} email={adminEmail} onProfileSaved={onProfileSaved} onSignOut={() => { void signOut() }}/>}

    </>}
    <footer className="a-footer"><span>© {new Date().getFullYear()} Arc Optical Club <span className="a-footer-dot">·</span> Made for a clearer tomorrow.</span><button onClick={() => setHelpOpen(true)}><CircleHelp size={14}/>Workspace help</button></footer></main></div>
    {editor && <RecordEditor editor={editor} onClose={() => setEditor(null)} onSave={save} saving={saving}/>}
    {helpOpen && <Modal title="Welcome to your impact workspace" description="Your connected workspace for Arc Optical Club’s purpose." onClose={() => setHelpOpen(false)}><div className="a-help-content"><p>Plan eye screenings, manage volunteer applications, record donations and explore the difference your programs make.</p><ul><li>Add and edit records using the action buttons.</li><li>Approve volunteers and open messages to mark them read.</li><li>Search and filter records, or export outreach data as CSV.</li><li>Changes are saved to the server. The workspace refreshes every 30 seconds.</li></ul><p>Join Us applications appear under Volunteers, contact enquiries under Messages, and newsletter signups under Subscribers. Verified Paystack donations appear alongside contributions you record manually. Test payments are excluded from received totals.</p><button className="a-button primary" onClick={() => setHelpOpen(false)}>Let’s get started <ArrowRight size={16}/></button></div></Modal>}
    {selectedMessage && <Modal title={selectedMessage.subject} description={`${selectedMessage.name} · ${shortDate(selectedMessage.date)}, ${selectedMessage.date.slice(0, 4)}`} onClose={() => setMessageId(null)}><div className="a-help-content"><p className="a-message-contact">{selectedMessage.email}<br/>{selectedMessage.phone}{selectedMessage.company && <><br/>{selectedMessage.company}</>}</p><p className="a-message-body">{selectedMessage.message}</p>{selectedMessage.email && <a className="a-button secondary" href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent('Re: ' + selectedMessage.subject)}`}>Reply by email <ArrowUpRight size={15}/></a>}<button className="a-button primary" onClick={() => setMessageId(null)}>Done <Check size={16}/></button></div></Modal>}
    {toast && <div className="a-toast" role="status"><Check size={18}/><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15}/></button></div>}
  </div>
}

export default function AdminDashboard(props: { adminEmail: string; adminName?: string; onProfileSaved: (name: string) => void; onLogout: () => Promise<void> }) {
  return (
    <I18nProvider>
      <AdminDashboardInner {...props} />
    </I18nProvider>
  )
}

function Empty({ text }: { text: string }) { return <div className="a-empty"><Search size={25}/><h3>{text}</h3></div> }
function Pagination({ total, page, setPage }: { total: number; page: number; setPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / 8))
  return <div className="a-pagination"><span>{total ? `${(page - 1) * 8 + 1}–${Math.min(page * 8, total)} of ${total} records` : '0 records'}</span><div><button className="a-icon-button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={17}/></button><span>{page} / {pages}</span><button className="a-icon-button" aria-label="Next page" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight size={17}/></button></div></div>
}
