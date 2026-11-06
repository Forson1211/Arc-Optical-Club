import { useEffect, useRef, useState } from 'react'
import SiteImage from './SiteImage'

const slides = [
  { src: '/images/arc-team-hero.jpg', width: 1600, height: 1279 },
  { src: '/images/arc-eye-screening-hero.png', width: 1200, height: 628 },
  { src: '/images/arc-outreach-team-hero.png', width: 1200, height: 628 },
]

export default function HeroBackground() {
  const ref = useRef<HTMLDivElement>(null)
  const [firstLoaded, setFirstLoaded] = useState(false), [showOtherSlides, setShowOtherSlides] = useState(false), [active, setActive] = useState(true)
  useEffect(() => {
    if (!firstLoaded) return
    const timer = setTimeout(() => setShowOtherSlides(true), 1200)
    return () => clearTimeout(timer)
  }, [firstLoaded])
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className="hero-background" data-active={active} aria-hidden="true">
      {slides.slice(0, showOtherSlides ? slides.length : 1).map((slide, index) => (
        <div key={slide.src} className="home-hero-slide">
          <SiteImage {...slide} alt="" className="home-hero-photo" sizes="(max-width: 639px) 1050px, 100vw" loading="eager" fetchPriority={index === 0 ? 'high' : 'low'} onLoad={index === 0 ? () => setFirstLoaded(true) : undefined} onError={index === 0 ? () => setFirstLoaded(true) : undefined}/>
        </div>
      ))}
    </div>
  )
}
