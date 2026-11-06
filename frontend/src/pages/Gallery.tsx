import SiteImage from '../components/SiteImage'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import Container from '../components/Container'
import PageIntro from '../components/PageIntro'

const photos = [
  ...['A05A8135.JPG', 'A05A8233.JPG', 'A05A8246.JPG', 'A05A8257.JPG', 'A05A8262.JPG', 'A05A8266.JPG', 'A05A8281 (1).JPG', 'A05A8287.JPG', 'A05A8328.JPG'].map(file => ({ file, category: 'Community' })),
  ...['IMG-20231012-WA0063.jpg', 'IMG-20231012-WA0070.jpg', 'IMG-20231012-WA0072.jpg', 'IMG-20231012-WA0074.jpg', 'IMG-20231012-WA0075.jpg', 'IMG-20231012-WA0103.jpg', 'IMG-20231012-WA0135.jpg', 'IMG-20231012-WA0136.jpg', 'IMG-20231012-WA0151.jpg'].map(file => ({ file, category: 'Outreach' })),
]
function Lightbox({ photos: items, start, onClose }: { photos: typeof photos; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start), ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow
    ref.current?.showModal(); document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow; focused?.focus() }
  }, [])
  const previous = () => setIndex(i => (i + items.length - 1) % items.length), next = () => setIndex(i => (i + 1) % items.length)
  return <dialog className="gallery-lightbox" ref={ref} aria-label="Gallery image viewer" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }} onKeyDown={event => { if (event.key === 'ArrowLeft') previous(); if (event.key === 'ArrowRight') next() }}><button className="lightbox-close" onClick={onClose} aria-label="Close image"><X/></button><SiteImage loading="eager" sizes="90vw" src={`/scrolling/${encodeURIComponent(items[index].file)}`} alt={`Arc Optical Club ${items[index].category.toLowerCase()} photograph ${index + 1}`}/><div><button onClick={previous} aria-label="Previous image"><ArrowLeft/></button><p aria-live="polite">{index + 1} / {items.length}</p><button onClick={next} aria-label="Next image"><ArrowRight/></button></div></dialog>
}
export default function Gallery() {
  const [filter, setFilter] = useState('All'), [selected, setSelected] = useState<number | null>(null)
  const items = photos.filter(photo => filter === 'All' || photo.category === filter)
  return <main className="inner-page"><PageIntro label="Life at Arc" title="Moments that matter.">People, places and a shared purpose.</PageIntro><Container><div className="page-filters" aria-label="Filter photographs">{['All', 'Community', 'Outreach'].map(value => <button key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setSelected(null) }}>{value}</button>)}</div><div className="photo-grid">{items.map((photo, index) => <button key={photo.file} onClick={() => setSelected(index)} aria-label={`Enlarge ${photo.category.toLowerCase()} photograph ${index + 1}`}><SiteImage sizes="(max-width: 767px) 50vw, 33vw" src={`/scrolling/${encodeURIComponent(photo.file)}`} alt={`Arc Optical Club ${photo.category.toLowerCase()} photograph ${index + 1}`} loading="lazy"/><span>{photo.category}<ArrowRight size={18}/></span></button>)}</div></Container>{selected !== null && <Lightbox photos={items} start={selected} onClose={() => setSelected(null)}/>}</main>
}
