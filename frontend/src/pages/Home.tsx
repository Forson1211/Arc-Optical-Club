
import { Link } from 'react-router-dom'
import Container from '../components/Container'
import HeroBackground from '../components/HeroBackground'
import ScrollingGallery from '../components/ScrollingGallery'
import { AboutPreview, Pillars, ProgramsPreview, EventFeature, WhyArc, DonateFeature } from '../sections/HomeSections'

const impact = [
  { value: '850+', label: 'People screened' },
  { value: '60+', label: 'Passionate members' },
  { value: '2022', label: 'Our journey began' },
]

export default function Home() {
  return (
    <>
      <section className="home-hero" aria-labelledby="hero-heading">
        <HeroBackground />
        <div className="home-hero-shade" aria-hidden="true" />

        <Container className="relative z-10 flex flex-1 flex-col items-center justify-center pb-20 pt-52 text-center sm:items-start sm:pb-20 sm:pt-44 sm:text-left">
          <h1 id="hero-heading" className="hero-reveal hero-title">
            Bringing vision<br />
            into focus, together
          </h1>
          <p className="hero-reveal mt-5 max-w-xs text-sm leading-6 text-white/80 sm:mt-6 sm:max-w-[32rem] sm:text-base sm:leading-7">
            <span className="sm:hidden">Free eye screenings, education and research for healthier communities across Ghana.</span>
            <span className="hidden sm:inline">Free eye screenings. Eye-health education. Research that matters. Together, we’re making clearer sight a reality for communities across Ghana.</span>
          </p>
          <div className="hero-reveal mt-7 flex w-full max-w-xs flex-col justify-start gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:gap-4">
            <Link to="/join" className="hero-button bg-arc-blue text-white hover:bg-[#057fc5] lg:min-w-[180px]">
              Join Us
            </Link>
            <Link to="/programs" className="hero-button bg-arc-yellow text-arc-navy hover:bg-[#ffd149] lg:min-w-[180px]">
              Our Programs
            </Link>
          </div>
        </Container>

        <Container className="relative z-10 hidden sm:block">
          <div className="flex flex-col items-center justify-between gap-8 border-t border-white/20 py-7 text-center md:flex-row md:gap-12 md:py-8 md:text-left">
            <a href="#our-mission" className="group flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.17em] text-white/80 transition hover:text-white sm:text-[11px]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-arc-yellow" aria-hidden="true" />
              Rooted in Ghana. United by purpose.

            </a>
            <dl className="grid w-full max-w-lg grid-cols-3 md:w-auto md:min-w-[380px] md:gap-10 lg:gap-14">
              {impact.map(({ value, label }) => (
                <div key={label} className="flex flex-col px-2 text-center md:px-0 md:text-left">
                  <dt className="mt-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white/65 sm:text-[10px]">{label}</dt>
                  <dd className="-order-1 text-[28px] font-extrabold leading-none tracking-[-0.04em] text-white sm:text-[32px]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <div id="our-mission" className="scroll-mt-6"><AboutPreview /></div>
      <Pillars />
      <ProgramsPreview />
      <EventFeature />
      <WhyArc />
      <ScrollingGallery />
      <DonateFeature />
    </>
  )
}
