import { useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/Container'
import { programs } from '../data/programs'



export default function Programs() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <main className="bg-[#10394B] pb-16 sm:pb-20">
      <section className="relative grid min-h-44 place-items-center overflow-hidden px-5 py-12 text-center text-white" aria-labelledby="programs-heading">
        <img src="/images/arc-outreach-team-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_45%]" />
        <div className="absolute inset-0 bg-arc-navy/65" />
        <h1 id="programs-heading" className="relative text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">Our Programs</h1>
      </section>
      <Container className="max-w-[1180px]">
        <div className="mx-auto max-w-2xl py-10 text-center sm:py-12">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-white sm:text-3xl">Programs & community initiatives</h2>
          <p className="mt-3 text-sm leading-6 text-white/75">Free screenings, eye-health education and community care. Explore how we’re bringing vision into focus, together.</p>
        </div>
        <div className="grid gap-6">
          {programs.map((program, index) => {
            const open = expanded === program.title
            return (
              <article key={program.title} className="border border-slate-200 bg-white p-5 sm:p-6 lg:p-7">
                <div className="grid items-center gap-5 sm:grid-cols-[56px_180px_minmax(0,1fr)] lg:grid-cols-[64px_220px_minmax(0,1fr)_110px] lg:gap-7">
                  <div className="flex items-center gap-3 text-arc-navy sm:block sm:text-center">
                    <p className="text-3xl font-extrabold tracking-[-0.04em]">{String(index + 1).padStart(2, '0')}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-arc-slate sm:mt-2">Initiative</p>
                  </div>
                  <img src={program.image} alt={program.alt} loading="lazy" className="h-48 w-full object-cover sm:h-40" />
                  <div>
                    <h3 className="text-[17px] font-extrabold text-arc-navy">{program.title}</h3>
                    <p className="mt-3 text-xs font-bold text-arc-blue">{program.category}</p>
                    <p className="mt-2 text-[13px] leading-6 text-arc-slate">{program.description}</p>
                  </div>
                  <button type="button" aria-expanded={open} aria-controls={`program-detail-${index}`} aria-label={`${open ? 'Close' : 'Read more about'} ${program.title}`} onClick={() => setExpanded(open ? null : program.title)} className="min-h-11 bg-arc-blue px-5 py-3 text-xs font-extrabold text-white transition hover:bg-[#01598f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-arc-blue sm:col-start-3 sm:justify-self-start lg:col-start-auto lg:justify-self-stretch">{open ? 'Close' : 'Read more'}</button>
                </div>
                {open && (
                  <div id={`program-detail-${index}`} className="mt-6 border-t border-slate-100 pt-5 sm:pl-[236px] lg:pl-[312px]">
                    <p className="text-sm leading-6 sm:leading-7 text-arc-slate">{program.detail}</p>
                    <Link to={`/contact?subject=${encodeURIComponent(program.title)}`} className="mt-4 inline-flex text-sm font-extrabold text-arc-blue underline-offset-4 hover:underline">Get involved with this program</Link>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </Container>
    </main>
  )
}
