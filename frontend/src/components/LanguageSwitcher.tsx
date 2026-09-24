import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const languages = [{ code: 'pt-BR', label: 'Português', short: 'PT' }, { code: 'en', label: 'English', short: 'EN' }] as const

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'pt-BR'
  const current = languages.find(item => item.code === language) ?? languages[0]

  useEffect(() => { document.documentElement.lang = language }, [language])
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus() } }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKeyDown) }
  }, [open])

  return <div ref={ref} className="relative">
    <button ref={triggerRef} type="button" onClick={() => setOpen(v => !v)} className="language-switcher-trigger" aria-label={t('changeLanguage','Change language')} aria-expanded={open} aria-haspopup="menu">
      <Globe2 className="h-3.5 w-3.5" aria-hidden="true" /><span>{current.short}</span><ChevronDown className={open ? 'h-3 w-3 rotate-180' : 'h-3 w-3'} aria-hidden="true" />
    </button>
    {open && <div className="language-switcher-menu" role="menu">
      {languages.map(item => <button key={item.code} type="button" role="menuitem" onClick={() => { void i18n.changeLanguage(item.code); setOpen(false) }} className={item.code === language ? 'language-option active' : 'language-option'}><span><b>{item.short}</b>{item.label}</span>{item.code === language && <Check className="h-3.5 w-3.5" aria-hidden="true" />}</button>)}
    </div>}
  </div>
}