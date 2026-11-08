import SiteImage from '../components/SiteImage'
import { contentImage, useContent } from '../lib/content'
import type { TeamProfile } from '../lib/content'
import { teamMembers } from '../data/team'
import Container from '../components/Container'

const groups = [
  { title: 'Core Team', categories: ['Core Team'] },
  { title: 'Team Leads', categories: ['Team Leads'] },
  { title: 'Team Members', categories: ['Team Members', 'Operations'] },
  { title: 'Advisory Council', categories: ['Advisory Council'] },
]

function ProfileIcon() {
  return (
    <svg viewBox="0 0 240 240" className="h-full w-full text-[#7D8A96]" fill="currentColor" aria-hidden="true">
      <circle cx="120" cy="86" r="43" />
      <path d="M30 231c7-52 40-85 90-85s83 33 90 85H30Z" />
    </svg>
  )
}

export default function Team() {
  const { data } = useContent<TeamProfile[]>('/content/team')
  const members = data ?? teamMembers
  return (
    <main className="bg-[#10394B] pb-20 pt-12 sm:pb-24 sm:pt-16" aria-labelledby="team-heading">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow !text-arc-yellow">The people behind Arc</p>
          <h1 id="team-heading" className="mt-4 text-4xl font-extrabold tracking-[-0.045em] text-white sm:text-5xl">Our Team</h1>
          <p className="mt-5 max-w-xl text-sm leading-6 sm:leading-7 text-white/75 sm:text-base">Students, professionals and volunteers working together to bring eye care, education and research closer to communities across Ghana.</p>
        </div>

        {groups.map(group => {
          const profiles = members.filter(member => group.categories.includes(member.category))
          if (!profiles.length) return null
          return <section className="mt-10 sm:mt-12" key={group.title} aria-label={group.title}>
          <h2 className="mb-6 text-xl font-extrabold text-white sm:text-2xl">{group.title}</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 sm:gap-x-7 sm:gap-y-11 lg:grid-cols-4">
          {profiles.map(member => (
            <article key={member.id} className="min-w-0">
              <div className="aspect-square overflow-hidden rounded-sm bg-[#F0F3F5] px-3 pt-3 sm:px-5 sm:pt-5">
                {member.image ? <SiteImage src={contentImage(member.image)} alt={member.alt || member.title} className="h-full w-full object-cover"/> : <ProfileIcon />}
              </div>
              <div className="mt-4 border-b border-white/15 pb-4">
                <h3 className="text-sm font-extrabold leading-6 text-white sm:text-base">{member.title}</h3>
                <p className="mt-1 text-xs leading-5 text-white/65">{member.role}</p>
              </div>
            </article>
          ))}
          </div></section>
        })}
      </Container>
    </main>
  )
}
