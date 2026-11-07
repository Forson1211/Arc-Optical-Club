import SiteImage from '../components/SiteImage'
import { Eye, HandHeart, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import Container from '../components/Container'

const values = [
  { title: 'Our Vision', icon: Eye, text: 'A Ghana where no one loses sight to a problem that could have been found early, treated or prevented.' },
  { title: 'Our Mission', icon: Heart, text: 'To bring quality eye care and eye-health knowledge within reach of every community in Ghana, through free screenings, education, research and a family of passionate students and professionals.' },
  { title: 'Our Aim', icon: HandHeart, text: 'To unite students, professionals and volunteers in practical action for healthier eyes and stronger communities.' },
]

export default function OurStory() {
  return (
    <main className="bg-[#10394B] pb-16 sm:pb-20">
      <section className="relative min-h-[390px] overflow-hidden px-5 pb-32 pt-14 text-center text-white sm:min-h-[430px] sm:pt-16" aria-labelledby="story-heading">
        <SiteImage loading="eager" fetchPriority="high" src="/images/arc-team-hero.jpg" alt="Arc Optical Club volunteers celebrating together" className="absolute inset-0 h-full w-full object-cover object-[50%_40%]" />
        <div className="absolute inset-0 bg-arc-navy/55" />
        <div className="relative mx-auto max-w-2xl">
          <h1 id="story-heading" className="text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">Who We Are</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/90 sm:text-base">We are a community of students, professionals and volunteers bringing vision into focus through access, research and service.</p>
          <Link to="/join" className="mt-6 inline-flex min-h-11 items-center justify-center bg-arc-yellow px-7 py-3 text-xs font-extrabold text-arc-navy transition hover:bg-[#ffd149]">Join Us</Link>
        </div>
      </section>

      <Container className="relative z-10 -mt-20 max-w-[1100px]">
        <div className="grid gap-5 md:grid-cols-3">
          {values.map(({ title, icon: Icon, text }) => (
            <section key={title} className="flex flex-col items-center rounded-xl bg-white px-6 py-8 text-center shadow-[0_18px_45px_rgba(20,43,59,0.1)] sm:px-8 md:min-h-[246px]">
              <Icon size={44} strokeWidth={1.5} className="text-arc-blue" aria-hidden="true" />
              <h2 className="mt-5 text-lg font-extrabold tracking-[-0.025em] text-arc-navy">{title}</h2>
              <p className="mt-3 text-[13px] leading-6 text-arc-slate">{text}</p>
            </section>
          ))}
        </div>
      </Container>

      <Container className="max-w-[920px] pt-14 sm:pt-16">
        <h2 className="text-center text-3xl font-extrabold tracking-[-0.035em] text-white sm:text-4xl">About Arc Optical Club</h2>
        <div className="mt-5 grid gap-3 text-justify text-sm leading-[1.5] text-white/75 sm:text-[15px]">
          <p>Arc Optical Club is a registered NGO in Ghana, founded in October 2022. We bring together students and professionals across the world, in and outside the eye-care space, united by the belief that everyone deserves to see clearly.</p>
          <p>Our work is built on three pillars: Access, Research & Education, and Community. Through free screenings, eye-health education and research, we help bring eye care and practical knowledge closer to the people who need them.</p>
          <p>Since our beginnings, we have screened more than 850 people. Our initiatives include Sight For Kids, Operation Sight For All and Myopia Rescue, connecting community outreach with learning, awareness and support.</p>
          <p>Our name comes from the arc at the front of the eye, seen in corneal topography and OCT scans, where light first enters and clear vision begins. We aim to be the first step towards clear sight for every community we reach.</p>
          <p>Our teams cover Collaborative Care &amp; Public Health, Digital Communications &amp; Design, Events &amp; Mobilization, Research &amp; Development, Organizational Development, Partnerships &amp; Stakeholder Engagement, and Grants &amp; Donor Relations.</p>
          <p>Our partners include Pilmart Pharmacy and Clinic, the Optometry Students Association of Ghana, and the University of Cape Coast.</p>
        </div>
      </Container>
    </main>
  )
}
