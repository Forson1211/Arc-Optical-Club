const slides = [
  { src: '/images/arc-team-hero.jpg', width: 1600, height: 1279 },
  { src: '/images/arc-eye-screening-hero.png', width: 1200, height: 628 },
  { src: '/images/arc-outreach-team-hero.png', width: 1200, height: 628 },
]

export default function HeroBackground() {
  return (
    <div className="hero-background" aria-hidden="true">
      {slides.map((slide) => (
        <div key={slide.src} className="home-hero-slide">
          <img {...slide} alt="" className="home-hero-photo" decoding="async" />
        </div>
      ))}
    </div>
  )
}
