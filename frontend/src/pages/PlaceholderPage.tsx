import { Link } from 'react-router-dom'
import Container from '../components/Container'

export default function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="py-28">
      <Container>
        <p className="eyebrow !text-arc-yellow">Arc Optical Club</p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-[-0.06em] text-white">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-6 sm:leading-8 text-white/75">{description}</p>
        <p className="mt-5 max-w-2xl text-sm leading-6 sm:leading-7 text-white/75">This page is part of the initial project structure. Its full content and database-powered features can be developed next.</p>
        <Link to="/" className="btn-primary mt-8">Back to homepage</Link>
      </Container>
    </main>
  )
}
