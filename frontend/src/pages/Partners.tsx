import Container from '../components/Container'
import SiteImage from '../components/SiteImage'
import { ContentState } from '../components/PageIntro'
import { contentImage, useContent } from '../lib/content'
import type { Partner } from '../lib/content'
import { partners } from '../data/partners'

export default function Partners() {
  const { data, error, retry } = useContent<Partner[]>('/content/partners')
  const visible = (data ?? partners).filter(partner => partner.status === 'published' && partner.image)
  return <main className="inner-page partners-page">
    <Container>
      <header className="page-intro"><h1>Our partners</h1></header>
      {error && !visible.length ? <ContentState error={error} retry={retry}/> : <div className="partner-logos" aria-label="Partner organizations">
        {visible.map(partner => {
          const logo = <SiteImage src={contentImage(partner.image)} alt={partner.alt || `${partner.title} logo`} sizes="(max-width: 639px) 240px, 320px"/>
          return partner.website ? <a key={partner.id} href={partner.website} aria-label={partner.title} target="_blank" rel="noreferrer">{logo}</a> : <div key={partner.id}>{logo}</div>
        })}
      </div>}
    </Container>
  </main>
}
