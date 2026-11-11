import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Global Scroll Reveal & Interactive Motion Engine for Arc Optical Club.
 * Automatically attaches smooth, elegant scroll-reveal animations to cards,
 * headings, text blocks, and buttons across every page.
 */
export default function ScrollReveal() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    // Do not animate admin interfaces
    if (pathname.startsWith('/admin')) {
      document.documentElement.classList.remove('has-scroll-animations')
      return
    }

    const root = document.documentElement
    root.classList.add('has-scroll-animations')

    // Accessibility check: immediately reveal all elements if reduced motion is requested
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal-init').forEach(el => el.classList.add('is-revealed'))
      return
    }

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-init').forEach(el => el.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -36px 0px',
      }
    )

    function shouldExclude(el: Element): boolean {
      return (
        el.closest('nav') !== null ||
        el.closest('#site-navbar') !== null ||
        el.closest('.arc-admin') !== null ||
        el.closest('.whatsapp-float') !== null ||
        el.closest('.home-hero') !== null ||
        el.classList.contains('hero-reveal') ||
        el.classList.contains('lightbox-close') ||
        el.closest('.gallery-lightbox') !== null
      )
    }

    function registerElement(
      el: Element,
      type: 'card' | 'heading' | 'text' | 'button',
      delay = 0
    ) {
      if (shouldExclude(el)) return
      if (el.classList.contains('reveal-init')) return

      el.classList.add('reveal-init', `reveal-${type}`)
      if (delay > 0) {
        ;(el as HTMLElement).style.transitionDelay = `${delay}ms`
      }

      // If already within the visible viewport (above the fold), reveal naturally
      const rect = el.getBoundingClientRect()
      const inView = rect.top < window.innerHeight - 20 && rect.bottom > 0
      if (inView) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            el.classList.add('is-revealed')
          }, Math.min(delay, 220))
        })
      } else {
        observer.observe(el)
      }
    }

    function scan() {
      // 1. CARDS (with smart grid stagger)
      const cardSelectors = [
        '.why-arc-card',
        '.program-row',
        '.partner-item',
        '.news-card',
        '.learning-options > section',
        '.giving-options > a',
        '.photo-grid > button',
        '.values-card',
        '.donation-purpose-item',
        '.donation-form',
        '.donation-purpose',
        '.donation-assurance',
        '.program-list article',
        '.quiet-callout',
        '#our-programs article',
        '[aria-labelledby="team-heading"] article',
        '[data-reveal="card"]',
      ]

      cardSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((el, index) => {
          const parent = el.parentElement
          const siblings = parent ? Array.from(parent.children).filter((c) => c.matches(selector)) : []
          const siblingIndex = siblings.indexOf(el)
          const delay = (siblingIndex >= 0 ? siblingIndex % 4 : index % 4) * 85
          registerElement(el, 'card', delay)
        })
      })

      // Pillars 3D Cards on Home
      document.querySelectorAll('#hero + * ~ * [perspective\\:1000px], section:has(.why-arc-card) ~ *').forEach((el, index) => {
        registerElement(el, 'card', (index % 3) * 100)
      })

      // Feature banners
      document.querySelectorAll('.sight-feature, .giving-feature, #give-the-gift-of-sight > div').forEach((el) => {
        registerElement(el, 'card', 0)
      })

      // 2. HEADINGS
      const headingSelectors = [
        '.section-title',
        '.page-intro h1',
        '.programs-intro h2',
        '.donation-checkout h2',
        '.programs-page h1',
        '.learning-page h1',
        'main > section h1:not(#hero-heading)',
        'main > section h2',
        '[data-reveal="heading"]',
      ]

      headingSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          registerElement(el, 'heading', 0)
        })
      })

      // 3. TEXT & EYEBROWS
      const textSelectors = [
        '.eyebrow',
        '.page-intro > p',
        '.programs-intro > p',
        '.article-category',
        '.sight-feature-copy > p',
        '[data-reveal="text"]',
      ]

      textSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          registerElement(el, 'text', 60)
        })
      })

      // 4. BUTTONS
      const buttonSelectors = [
        '.btn-primary',
        '.btn-secondary',
        '.page-button',
        '.donation-submit',
        '.hero-button',
        '.page-filters button',
        '[data-reveal="button"]',
      ]

      buttonSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el, index) => {
          registerElement(el, 'button', (index % 2) * 75)
        })
      })
    }

    // Initial scan
    scan()

    // Re-scan when dynamic content (e.g. async fetched news, team, partners) renders
    const mutationObserver = new MutationObserver(() => {
      scan()
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    // Safety timeout: ensure everything is visible after 3s
    const fallbackTimer = setTimeout(() => {
      document.querySelectorAll('.reveal-init:not(.is-revealed)').forEach((el) => {
        el.classList.add('is-revealed')
      })
    }, 3000)

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
      clearTimeout(fallbackTimer)
    }
  }, [pathname])

  return null
}
