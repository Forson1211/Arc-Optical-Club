import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { SUPPORTED_LANGUAGES, useI18n } from './i18n'
import type { LanguageInfo, SupportedLanguage } from './i18n'

export default function LanguageSwitcher({ onSelect }: { onSelect?: (lang: LanguageInfo) => void }) {
  const [open, setOpen] = useState(false)
  const { lang: currentCode, setLang } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentCode) || SUPPORTED_LANGUAGES[0]

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleSelect = (langItem: LanguageInfo) => {
    setLang(langItem.code as SupportedLanguage)
    setOpen(false)
    if (onSelect) onSelect(langItem)
  }

  return (
    <div className="a-lang-switcher" ref={containerRef}>
      <button
        type="button"
        className="a-lang-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Select language (current: ${currentLang.name})`}
        onClick={() => setOpen(prev => !prev)}
      >
        <Globe size={15} className="a-lang-globe" />
        <span className="a-lang-current-name">{currentLang.name}</span>
        <span className="a-lang-current-short">{currentLang.short}</span>
        <ChevronDown size={13} className="a-lang-chevron" />
      </button>

      {open && (
        <div className="a-lang-menu" role="menu" aria-label="Language options">
          {SUPPORTED_LANGUAGES.map(langItem => {
            const isSelected = langItem.code === currentLang.code
            return (
              <button
                key={langItem.code}
                type="button"
                role="menuitem"
                className={`a-lang-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelect(langItem)}
              >
                <span className="a-lang-item-left">
                  <span className="a-lang-badge">{langItem.short}</span>
                  <span>{langItem.name}</span>
                </span>
                {isSelected && <Check size={14} className="a-lang-check" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
