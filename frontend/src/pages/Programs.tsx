import SiteImage from '../components/SiteImage'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/Container'
import { ContentState } from '../components/PageIntro'
import { contentImage, useContent } from '../lib/content'
import type { ContentProgram } from '../lib/content'
import { programs as defaultPrograms } from '../data/programs'

export default function Programs() {
  const { data } = useContent<ContentProgram[]>('/content/programs')
  const programs = data && data.length ? data : defaultPrograms
  const [expanded, setExpanded] = useState<string | null>(null)
  return <main className="programs-page inner-page">
    <section className="relative grid min-h-44 place-items-center overflow-hidden px-5 py-12 text-center text-white" aria-labelledby="programs-heading">
      <SiteImage loading="eager" fetchPriority="high" src="/images/arc-outreach-team-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_45%]"/>
      <div className="absolute inset-0 bg-arc-navy/65"/>
      <h1 id="programs-heading" className="relative text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">Our Programs</h1>
    </section>
    <Container className="max-w-[1180px]"><header className="programs-intro"><h2>Programs & community initiatives</h2><p>Free screenings, eye-health education and community care. Explore how we’re bringing vision into focus, together.</p></header>{!programs ? <ContentState error={error} retry={retry}/> : !programs.length ? <ContentState empty="New initiatives are on the way. Contact us to get involved."/> : <div className="program-rows">{programs.map((program, index) => { const open = expanded === program.id; return <article key={program.id} className="program-row"><div className="program-row-main"><div className="program-number"><strong>{String(index + 1).padStart(2, '0')}</strong><span>Initiative</span></div><SiteImage src={contentImage(program.image)} alt={program.alt} loading="lazy"/><div className="program-summary"><h2>{program.title}</h2><p className="program-category">{program.category}</p><p>{program.description}</p></div><button type="button" aria-expanded={open} aria-controls={`program-${program.id}`} aria-label={`${open ? 'Close' : 'Read more about'} ${program.title}`} onClick={() => setExpanded(open ? null : program.id)}>{open ? 'Close' : 'Read more'}</button></div>{open && <div id={`program-${program.id}`} className="program-row-detail"><p>{program.detail}</p><Link to={`/contact?subject=${encodeURIComponent(program.title)}`}>Get involved with this program</Link></div>}</article> })}</div>}</Container></main>
}
