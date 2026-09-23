import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const languages = [{ code: 'pt-BR', label: 'Português' }, { code: 'en', label: 'English' }] as const

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'pt-BR'
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return <div ref={ref} className="relative">
    <button type="button" onClick={() => setOpen(v => !v)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={t('buttons.changeLanguage','Change language')} aria-expanded={open} aria-haspopup="menu">
      <Globe2 className="h-3.5 w-3.5" aria-hidden="true" /><span>{language === 'en' ? 'EN' : 'PT'}</span><ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
    {open && <div className="absolute right-0 top-[calc(100%+6px)] z-[100] w-40 rounded-xl border border-border bg-card p-1 shadow-lg" role="menu">
      {languages.map(item => <button key={item.code} type="button" role="menuitem" onClick={() => { void i18n.changeLanguage(item.code); setOpen(false) }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${item.code === language ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><span>{item.label}</span>{item.code === language && <Check className="h-3.5 w-3.5" aria-hidden="true" />}</button>)}
    </div>}
  </div>
}