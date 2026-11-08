import { ChevronDown } from 'lucide-react'
import { pastEvents } from '../data/past-events'

export default function PastEvents() {
  return <section className="past-outreaches" id="past-events" aria-labelledby="past-events-heading">
    <h2 id="past-events-heading">Past outreaches</h2>
    <div>{pastEvents.map(event => <details key={event.id}>
      <summary><span><strong>{event.title}</strong><small>{[event.date, event.location].filter(Boolean).join(' · ')}</small></span><ChevronDown size={19} aria-hidden="true"/></summary>
      <div className="past-outreach-detail"><p className="past-outreach-impact">{event.summary}</p>{event.details.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
    </details>)}</div>
  </section>
}
