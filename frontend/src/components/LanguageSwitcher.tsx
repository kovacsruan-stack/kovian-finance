import { Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'pt-BR'
  const change = (next: 'pt-BR' | 'en') => { void i18n.changeLanguage(next) }
  return <label className="language-switcher">
    <Globe2 size={15} aria-hidden="true" />
    <select aria-label="Language" value={language} onChange={(e) => change(e.target.value as 'pt-BR' | 'en')}>
      <option value="pt-BR">PT-BR</option>
      <option value="en">EN</option>
    </select>
  </label>
}