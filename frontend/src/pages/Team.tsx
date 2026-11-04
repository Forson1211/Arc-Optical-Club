import Container from '../components/Container'

type TeamMember = { name: string; role: string }

const teamMembers: TeamMember[] = [
  { name: 'Mr. Famous Yamoah', role: 'President & Co-founder' },
  { name: 'Mr. Obed Adarkwah Yiadom', role: 'Vice President (General Affairs)' },
  { name: 'Mr. Jerriod Paul Amoako', role: 'Managing Director' },
  { name: 'Ms. Lisa Adanye', role: 'Grants & Donor Relations Team Lead' },
  { name: 'Mr. Famous Nyayor', role: 'Vice President (Finance)' },
  { name: 'Dr. Rosina Boateng', role: 'Collaborative Care & Public Health Team Lead' },
  { name: 'Mr. Richard Donkor', role: 'Research & Development Team Lead' },
  { name: 'Ms. Alexis Andoh', role: 'Digital Communications & Design Team Lead' },
  { name: 'Ms. McBride Owusu', role: 'Partnerships & Stakeholder Engagement Team Lead' },
  { name: 'Mr. Simon Kpatt Yendu', role: 'Events & Mobilization Team Lead' },
  { name: 'Mr. Hilary Kenneth Addison', role: 'Organizational Development Team Lead' },
  { name: 'Mr. Michael Owusu', role: 'Chief Financial Officer' },
  { name: 'Ms. Karen Osafo Adjei', role: 'Recruitment Manager' },
  { name: 'Ms. Jennifer Teye', role: 'Fundraising Coordinator' },
  { name: 'Ms. Joycelyn Donkor', role: 'Advisor' },
  { name: 'Ms. Mandy Asare', role: 'Advisor' },
  { name: 'Mr. Joshua Addai-Amoah', role: 'Advisor' },
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
  return (
    <main className="bg-[#10394B] pb-20 pt-12 sm:pb-24 sm:pt-16" aria-labelledby="team-heading">
      <Container>
        <div className="max-w-2xl">
          <p className="eyebrow !text-arc-yellow">The people behind Arc</p>
          <h1 id="team-heading" className="mt-4 text-4xl font-extrabold tracking-[-0.045em] text-white sm:text-5xl">Our Team</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">Students, professionals and volunteers working together to bring eye care, education and research closer to communities across Ghana.</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-9 sm:mt-12 sm:grid-cols-3 sm:gap-x-7 sm:gap-y-11 lg:grid-cols-4">
          {teamMembers.map(member => (
            <article key={member.name} className="min-w-0">
              <div className="aspect-square overflow-hidden rounded-sm bg-[#F0F3F5] px-3 pt-3 sm:px-5 sm:pt-5">
                <ProfileIcon />
              </div>
              <div className="mt-4 border-b border-white/15 pb-4">
                <h2 className="text-sm font-extrabold leading-6 text-white sm:text-base">{member.name}</h2>
                <p className="mt-1 text-xs leading-5 text-white/65">{member.role}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </main>
  )
}
