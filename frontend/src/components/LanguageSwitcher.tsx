import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const languages = [{ code: 'pt-BR', label: 'Português' }, { code: 'en', label: 'English' }] as const

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'pt-BR'

  useEffect(() => { document.documentElement.lang = language }, [language])

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus() }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return <div ref={ref} className="relative">
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(v => !v)}
      className="finance-language-trigger"
      aria-label={t('buttons.changeLanguage', 'Change language')}
      aria-expanded={open}
      aria-haspopup="menu"
    >
      <span className="finance-language-icon"><Globe2 aria-hidden="true" /></span>
      <span className="finance-language-code">{language === 'en' ? 'EN' : 'PT'}</span>
      <ChevronDown className={`finance-language-chevron ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>

    {open && <div className="finance-language-menu" role="menu">
      <div className="finance-language-menu-title">{t('buttons.changeLanguage', 'Idioma')}</div>
      {languages.map(item => (
        <button
          key={item.code}
          type="button"
          role="menuitem"
          onClick={() => { void i18n.changeLanguage(item.code); setOpen(false) }}
          className={`finance-language-option ${item.code === language ? 'selected' : ''}`}
        >
          <span>
            <strong>{item.code === 'pt-BR' ? 'PT' : 'EN'}</strong>
            <small>{item.label}</small>
          </span>
          {item.code === language && <Check aria-hidden="true" />}
        </button>
      ))}
    </div>}
  </div>
}