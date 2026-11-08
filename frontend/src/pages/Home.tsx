
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
    <main>
      <section className="home-hero" aria-labelledby="hero-heading">
        <HeroBackground />
        <div className="home-hero-shade" aria-hidden="true" />

        <Container className="relative z-10 flex flex-1 flex-col items-center justify-center pb-8 pt-32 text-center sm:items-start sm:pb-20 sm:pt-44 sm:text-left">
          <h1 id="hero-heading" className="hero-reveal hero-title">
            <span className="block whitespace-nowrap">Bringing vision</span>
            <span className="block whitespace-nowrap">into focus, together</span>
          </h1>
          <p className="hero-reveal mt-5 max-w-xs text-sm leading-6 text-white/80 sm:mt-6 sm:max-w-[32rem] sm:text-base sm:leading-7">
            <span className="hero-mobile-description sm:hidden"><span>Free eye screenings, education and research for</span><span>healthier communities across Ghana.</span></span>
            <span className="hidden sm:inline">A registered NGO of students and professionals giving communities across Ghana free eye screenings, eye education and research that matters.</span>
          </p>
          <div className="hero-reveal mt-7 flex w-full max-w-xs flex-col justify-start gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:gap-4">
            <Link to="/join" className="hero-button bg-arc-blue text-white hover:bg-[#057fc5] lg:min-w-[180px]">
              Join Arc
            </Link>
            <Link to="/programs" className="hero-button bg-arc-yellow text-arc-navy hover:bg-[#ffd149] lg:min-w-[180px]">
              Our Programs
            </Link>
          </div>
        </Container>

        <Container className="relative z-10">
          <div className="mx-auto flex w-full max-w-xs flex-col items-center justify-between gap-5 border-t border-white/15 pb-8 pt-5 text-center sm:mx-0 sm:max-w-none sm:border-white/20 sm:py-7 lg:flex-row lg:gap-12 lg:py-8 lg:text-left">
            <a href="#our-mission" className="hidden group items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.17em] text-white/80 transition hover:text-white sm:flex sm:text-[11px]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-arc-yellow" aria-hidden="true" />
              Registered NGO in Ghana. United by purpose.
            </a>
            <dl className="grid w-full grid-cols-3 gap-2 text-center sm:max-w-lg lg:w-auto lg:min-w-[380px] lg:gap-14 lg:text-left">
              {impact.map(({ value, label }) => (
                <div key={label} className="flex flex-col text-center lg:text-left">
                  <dt className="mt-1.5 whitespace-nowrap text-[7px] font-bold uppercase tracking-normal text-white/70 min-[375px]:text-[8px] sm:mt-2 sm:text-[10px] sm:tracking-[0.06em]">{label}</dt>
                  <dd className="-order-1 text-[22px] font-extrabold leading-none tracking-[-0.04em] text-white sm:text-[32px]">{value}</dd>
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
    </main>
  )
}
