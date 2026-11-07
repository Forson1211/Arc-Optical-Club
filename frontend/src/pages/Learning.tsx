import SiteImage from '../components/SiteImage'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, GraduationCap, Microscope, UsersRound } from 'lucide-react'
import Container from '../components/Container'

export default function Learning({ research = false }: { research?: boolean }) {
  const items = research ? [
    { title: 'Journal Club', text: 'Join our monthly Journal Club to read, question and discuss papers by our members and partners.', icon: BookOpen, subject: 'Join the Journal Club', action: 'Join the conversation' },
    { title: 'Research collaboration', text: 'Explore studies we are running and opportunities to collaborate with our members and partners.', icon: Microscope, subject: 'Research collaboration', action: 'Start a conversation' },
  ] : [
    { title: 'Mentorship', text: 'Connect with people who share your interests in eye care, research and service.', icon: UsersRound, subject: 'ARC Academy mentorship', action: 'Ask about mentorship' },
    { title: 'Training', text: 'Build knowledge through discussions, practical experience and community learning.', icon: GraduationCap, subject: 'ARC Academy learning opportunities', action: 'Explore opportunities' },
  ]
  return <main className="learning-page inner-page">
    <section className="learning-banner relative grid min-h-56 place-items-center overflow-hidden px-5 py-12 text-center text-white sm:min-h-64 lg:min-h-80" aria-labelledby="learning-heading">
      <SiteImage src="/scrolling/A05A8233.JPG" alt="" loading="eager" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover"/>
      <div className="absolute inset-0 bg-arc-navy/65"/>
      <h1 id="learning-heading" className="relative text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">{research ? 'Research & education' : 'Learn & grow'}</h1>
    </section>
    <Container>
      <header className="programs-intro">
        <h2>{research ? 'Curiosity into impact.' : 'ARC Academy.'}</h2>
        <p>{research ? 'Better questions. Shared knowledge. Stronger communities.' : 'A community to learn with, and room to grow.'}</p>
      </header>
      <div className="learning-options">
        {items.map(({ title, text, icon: Icon, subject, action }) => <section key={title}>
          <Icon size={29} aria-hidden="true"/>
          <h2>{title}</h2>
          <p>{text}</p>
          <Link className="text-link" to={`/contact?subject=${encodeURIComponent(subject)}`}>{action}<ArrowUpRight size={17}/></Link>
        </section>)}
      </div>
      <div className="quiet-callout">
        <div><h2>{research ? 'Have an idea worth exploring?' : 'Your next chapter starts here.'}</h2><p>{research ? 'Tell us what you are working on.' : 'Join Arc to be part of our learning community.'}</p></div>
        <Link className="page-button" to={research ? '/contact?subject=Research%20enquiry' : '/join'}>{research ? 'Connect with Arc' : 'Join the community'}<ArrowUpRight size={18}/></Link>
      </div>
    </Container>
  </main>
}
