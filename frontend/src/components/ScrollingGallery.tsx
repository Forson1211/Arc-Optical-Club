import { Link } from 'react-router-dom'
import Container from './Container'

const photos = [
  'A05A8135.JPG', 'A05A8233.JPG', 'A05A8246.JPG', 'A05A8257.JPG', 'A05A8262.JPG', 'A05A8266.JPG',
  'A05A8281 (1).JPG', 'A05A8287.JPG', 'A05A8328.JPG', 'IMG-20231012-WA0063.jpg', 'IMG-20231012-WA0070.jpg', 'IMG-20231012-WA0072.jpg',
  'IMG-20231012-WA0074.jpg', 'IMG-20231012-WA0075.jpg', 'IMG-20231012-WA0103.jpg', 'IMG-20231012-WA0135.jpg', 'IMG-20231012-WA0136.jpg', 'IMG-20231012-WA0151.jpg',
]
const columns = [0, 1, 2].map(column => photos.filter((_, index) => index % 3 === column))

export default function ScrollingGallery() {
  return (
    <section id="explore-images" className="scrolling-gallery overflow-hidden bg-[#10394B] pb-12 sm:pb-16" aria-labelledby="gallery-heading">
      <Container className="flex items-center justify-between gap-3 pb-7 pt-2">
        <h2 id="gallery-heading" className="text-xl font-extrabold tracking-[-0.025em] text-white sm:text-2xl">Explore Images</h2>
        <Link to="/gallery" className="justify-self-end text-[10px] font-bold text-arc-yellow underline-offset-4 hover:underline sm:text-xs">View gallery</Link>
      </Container>
      <div className="gallery-wall">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="gallery-column">
            <div className={`gallery-track gallery-track-${columnIndex}`}>
              {[false, true].map(duplicate => (
                <div key={String(duplicate)} className="gallery-group" aria-hidden={duplicate || undefined}>
                  {column.map((photo, index) => (
                    <a key={photo} href={`/scrolling/${encodeURIComponent(photo)}`} target="_blank" rel="noreferrer" tabIndex={duplicate ? -1 : 0} className="gallery-tile focus-visible:outline focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-arc-yellow">
                      <img src={`/scrolling/${encodeURIComponent(photo)}`} alt={duplicate ? '' : `Arc Optical Club outreach and community photo ${columnIndex * 6 + index + 1}`} loading="lazy" decoding="async" width={400} height={280} className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
