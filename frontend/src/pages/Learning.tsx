import SiteImage from '../components/SiteImage'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, GraduationCap, Microscope, UsersRound } from 'lucide-react'
import Container from '../components/Container'
import PageIntro from '../components/PageIntro'

export default function Learning({ research = false }: { research?: boolean }) {
  const items = research ? [
    { title: 'Journal Club', text: 'Read, question and discuss eye-care research with a curious community.', icon: BookOpen, subject: 'Join the Journal Club', action: 'Join the conversation' },
    { title: 'Research collaboration', text: 'Bring your questions and ideas. Explore opportunities to learn and collaborate with Arc.', icon: Microscope, subject: 'Research collaboration', action: 'Start a conversation' },
  ] : [
    { title: 'Mentorship', text: 'Connect with people who share your interests in eye care, research and service.', icon: UsersRound, subject: 'ARC Academy mentorship', action: 'Ask about mentorship' },
    { title: 'Shared learning', text: 'Build knowledge through discussions, practical experience and community learning.', icon: GraduationCap, subject: 'ARC Academy learning opportunities', action: 'Explore opportunities' },
  ]
  return <main className="inner-page"><PageIntro label={research ? 'Research & education' : 'Learn & grow'} title={research ? 'Curiosity into impact.' : 'ARC Academy.'}>{research ? 'Better questions. Shared knowledge. Stronger communities.' : 'A community to learn with, and room to grow.'}</PageIntro><Container><div className="learning-layout"><SiteImage src={research ? '/images/arc-screening-session.jpg' : '/images/arc-team-hero.jpg'} alt={research ? 'An eye screening session with Arc' : 'The Arc Optical Club community'} className="learning-photo"/><div className="learning-options">{items.map(({ title, text, icon: Icon, subject, action }) => <section key={title}><Icon size={27} className="text-arc-yellow"/><h2>{title}</h2><p>{text}</p><Link className="text-link" to={`/contact?subject=${encodeURIComponent(subject)}`}>{action}<ArrowUpRight size={17}/></Link></section>)}</div></div><div className="quiet-callout"><div><h2>{research ? 'Have an idea worth exploring?' : 'Your next chapter starts here.'}</h2><p>{research ? 'Tell us what you are working on.' : 'Join Arc to be part of our learning community.'}</p></div><Link className="page-button" to={research ? '/contact?subject=Research%20enquiry' : '/join'}>{research ? 'Connect with Arc' : 'Join the community'}<ArrowUpRight size={18}/></Link></div></Container></main>
}
