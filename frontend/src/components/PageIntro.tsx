import type { ReactNode } from 'react'
import Container from './Container'

export default function PageIntro({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return <Container className="page-intro"><p className="eyebrow !text-arc-yellow">{label}</p><h1>{title}</h1><p>{children}</p></Container>
}
export function ContentState({ error, retry, empty }: { error?: string; retry?: () => void; empty?: string }) {
  return <div className="content-state" role={error ? 'alert' : 'status'}><p>{error || empty || 'Loading…'}</p>{error && retry && <button className="text-link" onClick={retry}>Try again</button>}</div>
}
