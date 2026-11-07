import SiteImage from '../components/SiteImage'
import { useState } from 'react'
import { ArrowUpRight, Eye, BookOpen, Users, MoveUpRight, Handshake, ShieldCheck, HeartHandshake, BookOpenCheck, UsersRound, RotateCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import Container from '../components/Container'
import SectionHeading from '../components/SectionHeading'
import { contentImage, useContent } from '../lib/content'
import type { ContentProgram } from '../lib/content'
import { programs as defaultPrograms } from '../data/programs'



export function ImpactStrip() {
  return <div className="bg-arc-blue py-8 text-white"><Container><div className="grid grid-cols-3 gap-4 text-center"><div><p className="text-3xl font-extrabold sm:text-4xl">850+</p><p className="mt-1 text-[11px] font-semibold text-white/75 sm:text-sm">People screened</p></div><div className="border-x border-white/20"><p className="text-3xl font-extrabold sm:text-4xl">60+</p><p className="mt-1 text-[11px] font-semibold text-white/75 sm:text-sm">Members</p></div><div><p className="text-2xl font-extrabold sm:text-4xl">Ghana</p><p className="mt-1 text-[11px] font-semibold text-white/75 sm:text-sm">Registered NGO</p></div></div></Container></div>
}

export function AboutPreview() {
  return <section className="py-24"><Container><div className="grid items-center gap-14 lg:grid-cols-2"><div className="relative"><SiteImage src="/images/arc-screening-session.jpg" alt="Arc Optical Club eye care professional testing patient vision" className="aspect-[5/4] w-full rounded-[2rem] object-cover object-[50%_35%] shadow-soft" /><div className="absolute -bottom-6 -right-4 rounded-2xl bg-arc-yellow p-5 shadow-soft sm:right-6"><Eye className="mb-2 text-arc-navy" size={25} /><p className="text-sm font-extrabold text-arc-navy">Clear sight.<br />Stronger communities.</p></div></div><div><p className="eyebrow mb-4 !text-arc-yellow">Who we are</p><h2 className="section-title !text-white">A clearer vision for every community.</h2><p className="mt-6 text-justify text-base leading-6 sm:leading-8 text-white/75">Arc Optical Club is a registered NGO in Ghana, founded in October 2022. We bring together students and professionals across the world, in and outside the eye-care space, who believe everyone deserves to see clearly.</p><p className="mt-4 text-justify text-base leading-6 sm:leading-8 text-white/75">Through free screenings, eye education and research, we take care of eyes where it is needed most. To date, we have screened more than 850 people, and we are just getting started.</p><Link to="/about" className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-arc-yellow">Discover our story <ArrowUpRight size={17} /></Link></div></div></Container></section>
}

export function Pillars() {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})

  const items = [
    {
      letter: 'A',
      title: 'Access',
      icon: Eye,
      text: 'Free screenings, reading glasses, medication and prescription glasses.',
    },
    {
      letter: 'R',
      title: 'Research & Education',
      icon: BookOpen,
      text: 'Eye-health education, Journal Club, papers, studies and shared learning.',
    },
    {
      letter: 'C',
      title: 'Community',
      icon: Users,
      text: 'Professional development, mentorship, scholarships, volunteering, partners and donors.',
    },
  ]

  const toggle = (letter: string) => {
    setFlipped((prev) => ({ ...prev, [letter]: !prev[letter] }))
  }

  return (
    <section className="bg-[#10394B] py-24">
      <Container>
        <SectionHeading
          eyebrow="What drives us"
          title="The three pillars of ARC."
          description="Click on A, R, or C to rotate and view their full details."
          centered
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map(({ letter, title, icon: Icon, text }) => {
            const isFlipped = !!flipped[letter]
            return (
              <div
                key={letter}
                onClick={() => toggle(letter)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggle(letter)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isFlipped}
                aria-label={`${title} pillar. Click to ${isFlipped ? 'flip back' : 'reveal explanations'}.`}
                className="group h-[250px] sm:h-[300px] md:h-[350px] w-full cursor-pointer select-none rounded-2xl sm:rounded-[1.75rem] [perspective:1000px] focus:outline-none focus-visible:ring-4 focus-visible:ring-arc-yellow"
              >
                <div
                  className={`relative h-full w-full rounded-2xl sm:rounded-[1.75rem] transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
                >
                  {/* Front of Card: Normal Shape & Clean Letter A / R / C without dot */}
                  <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-between rounded-2xl sm:rounded-[1.75rem] border border-arc-blue/10 bg-white p-5 sm:p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl [backface-visibility:hidden]">
                    <div className="flex w-full items-center justify-between">
                      <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-arc-slate">Pillar</span>
                      <span className="grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-xl sm:rounded-2xl bg-arc-ice text-arc-blue transition group-hover:bg-arc-blue group-hover:text-white">
                        <Icon size={19} className="sm:h-[22px] sm:w-[22px]" />
                      </span>
                    </div>

                    <div className="my-auto text-center">
                      <span className="block text-7xl font-black leading-none tracking-tight text-arc-blue sm:text-8xl md:text-9xl">
                        {letter}
                      </span>
                      <h3 className="mt-2 text-base font-extrabold text-arc-navy sm:mt-3 sm:text-xl md:text-2xl">{title}</h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-arc-slate">
                      <RotateCw size={14} aria-hidden="true" />
                      <span>View details</span>
                    </div>
                  </div>

                  {/* Back of Card: Rotates 180deg to show full text explanations */}
                  <div className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-2xl sm:rounded-[1.75rem] border border-arc-blue/15 bg-white p-5 sm:p-8 shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
                      <span className="text-2xl sm:text-3xl font-black text-arc-blue">
                        {letter}
                      </span>
                      <span className="grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-xl sm:rounded-2xl bg-arc-blue/10 text-arc-blue">
                        <Icon size={19} className="sm:h-[22px] sm:w-[22px]" />
                      </span>
                    </div>

                    <div className="my-auto py-1 sm:py-2">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-arc-yellow">Overview</span>
                      <h3 className="mt-0.5 text-base font-extrabold text-arc-navy sm:mt-1 sm:text-xl md:text-2xl">{title}</h3>
                      <p className="mt-2 text-xs leading-5 sm:text-base sm:leading-7 text-arc-slate">{text}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 sm:pt-4">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-arc-blue">Arc Optical Club</span>
                      <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-arc-slate hover:text-arc-navy">
                        <RotateCw size={12} /> Click to flip back
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

export function ProgramsPreview() {
  const { data } = useContent<ContentProgram[]>('/content/programs')
  const programs = data && data.length ? data : defaultPrograms
  return <section id="our-programs" className="py-24"><Container><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><SectionHeading title="Our Programs" description="Free eye screenings, eye-health education and community care for children, families and communities across Ghana." /><Link to="/programs" className="inline-flex shrink-0 items-center gap-2 text-sm font-extrabold text-arc-yellow">Explore programs <ArrowUpRight size={17} /></Link></div><div className="mt-12 grid gap-6 md:grid-cols-3">{programs.map(p => <article key={p.title} className="overflow-hidden rounded-[1.6rem] bg-white transition hover:-translate-y-1 hover:shadow-soft"><SiteImage sizes="(max-width: 767px) 100vw, 380px" src={contentImage(p.image)} alt={p.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" /><div className="p-6"><p className="eyebrow">{p.category}</p><h3 className="mt-3 text-xl font-extrabold text-arc-navy">{p.title}</h3><p className="mt-3 text-sm leading-6 sm:leading-7 text-arc-slate">{p.description}</p><Link to="/programs" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-arc-blue">Learn more <ArrowUpRight size={16} /></Link></div></article>)}</div></Container></section>
}

export function EventFeature() {
  return (
    <section id="sight-for-kids" className="sight-feature" aria-labelledby="sight-feature-heading">
      <SiteImage sizes="(max-width: 639px) 1300px, 100vw" src="/images/sight-for-kids-background.png" alt="" className="sight-feature-background" loading="lazy" />
      <div className="sight-feature-shade" aria-hidden="true" />
      <Container className="relative z-10">
        <div className="sight-feature-copy">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-arc-yellow">Coming soon</p>
          <h2 id="sight-feature-heading" className="mt-5 text-4xl font-extrabold leading-tight tracking-[-0.05em] sm:text-5xl">Sight For Kids.</h2>
          <p className="mt-5 text-base leading-8 text-white/90">Eye education and free screening for school children. On 25 November 2022, our first project in Offinso-Abofo reached nearly 150 teachers and pupils; about 98% had never had an eye exam. A new edition is coming. Watch out!</p>
          <Link to="/programs" className="mt-8 inline-flex items-center gap-2 rounded-full bg-arc-yellow px-6 py-3.5 text-sm font-extrabold text-arc-navy">Explore the initiative <ArrowUpRight size={17} /></Link>
        </div>
      </Container>
    </section>
  )
}

export function WhyArc() {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const reasons = [
    {
      title: 'Proven Community Impact',
      description: 'Since 2022, we have screened more than 850 people, helping children, families and communities take the first step towards clearer, healthier sight.',
      color: 'bg-arc-blue',
      icon: Handshake,
    },
    {
      title: 'Care Close to Home',
      description: 'From school visits to community outreaches, we bring free eye screenings and practical eye-health education closer to people across Ghana.',
      color: 'bg-[#00A981]',
      icon: HeartHandshake,
    },
    {
      title: 'Research Into Action',
      description: 'Our Journal Club, research and shared learning connect curious minds with the knowledge to better understand eye health and inform community care.',
      color: 'bg-[#EF6856]',
      icon: BookOpenCheck,
    },
    {
      title: 'Stronger Together',
      description: 'Students, professionals and volunteers come together through mentorship, learning and service, united by one purpose: making quality eye care more accessible.',
      color: 'bg-[#E8A619]',
      icon: UsersRound,
    },
  ]

  return (
    <section id="why-arc" className="bg-[#10394B] py-16 sm:py-20" aria-labelledby="why-arc-heading">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="why-arc-heading" className="text-3xl font-extrabold leading-tight tracking-[-0.035em] text-white sm:text-[38px]">Why Arc Optical Club?</h2>
          <p className="mx-auto mt-4 max-w-[43rem] text-[15px] leading-6 sm:leading-7 text-white/75 sm:text-base">
            We bring eye care, knowledge and people together to help communities across Ghana see a brighter future.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ title, description, color, icon: Icon }, index) => {
            const isFlipped = !!flipped[title]
            return (
              <button
                key={title}
                type="button"
                data-flipped={isFlipped}
                aria-pressed={isFlipped}
                aria-label={`${title}. ${isFlipped ? 'Show icon and title' : 'View explanation'}.`}
                aria-describedby={isFlipped ? `why-arc-description-${index}` : undefined}
                onClick={() => setFlipped(previous => ({ ...previous, [title]: !previous[title] }))}
                className="why-arc-card group w-full rounded-sm text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-arc-yellow"
              >
                <span className="why-arc-card-inner">
                  <span aria-hidden={isFlipped} className="why-arc-card-face flex min-h-[320px] flex-col items-center justify-center rounded-sm border border-slate-100 bg-white px-6 py-8 shadow-[0_2px_18px_rgba(20,43,59,0.06)] lg:min-h-[346px] lg:px-5">
                    <span className={`relative grid h-[104px] w-[104px] shrink-0 place-items-center rounded-full text-white ${color}`} aria-hidden="true">
                      {index === 0 ? (
                        <>
                          <ShieldCheck size={30} strokeWidth={1.8} className="absolute left-1/2 top-4 -translate-x-1/2" />
                          <Handshake size={48} strokeWidth={1.8} className="absolute bottom-4 left-1/2 -translate-x-1/2" />
                        </>
                      ) : <Icon size={50} strokeWidth={1.65} />}
                    </span>
                    <span className="mt-6 block text-[16px] font-extrabold leading-6 text-arc-navy">{title}</span>
                    <span className="mt-5 flex items-center gap-1.5 text-[11px] font-semibold text-arc-slate"><RotateCw size={14} aria-hidden="true" />View details</span>
                  </span>
                  <span aria-hidden={!isFlipped} className="why-arc-card-face why-arc-card-back flex min-h-[320px] flex-col items-center justify-center rounded-sm border border-slate-100 bg-white px-6 py-8 shadow-[0_2px_18px_rgba(20,43,59,0.06)] lg:min-h-[346px] lg:px-5">
                    <span className="block text-[16px] font-extrabold leading-6 text-arc-navy">{title}</span>
                    <span id={`why-arc-description-${index}`} className="mt-4 block max-w-[26rem] text-[14px] leading-6 text-arc-slate">{description}</span>
                    <span className="mt-5 flex items-center gap-1.5 text-[11px] font-semibold text-arc-slate"><RotateCw size={14} aria-hidden="true" />Back to icon</span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

export function DonateFeature() {
  return (
    <section id="give-the-gift-of-sight" className="pb-24 lg:bg-arc-yellow lg:pb-0">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-arc-yellow px-8 py-14 text-arc-navy sm:px-14 sm:py-16 lg:rounded-none lg:px-0">
          <div className="absolute -right-12 -top-24 h-72 w-72 rounded-full border-[35px] border-arc-navy/5" aria-hidden="true" />
          <div className="relative max-w-2xl text-center sm:text-left">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-arc-navy">Give the gift of sight</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.05em] sm:text-5xl">Help bring clearer vision within reach.</h2>
            <p className="mt-5 max-w-xl text-sm leading-6 sm:leading-8 text-arc-navy/80">Your gift helps us screen more children, elders and communities for free. Every contribution brings us closer to a Ghana where preventable vision loss does not stand in the way of opportunity.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Link to="/donate" className="btn-primary">Donate with us <MoveUpRight size={16} className="ml-2" /></Link>
              <Link to="/contact" className="rounded-full border border-arc-navy/30 px-6 py-3.5 text-sm font-bold text-arc-navy transition hover:bg-white/25">Partner with us</Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
