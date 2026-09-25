import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, Bell, CalendarClock, ChevronRight, CreditCard, Dumbbell, FolderTree, Menu, MoreHorizontal, Search, Settings2, Sparkles, FileText, Target, Wallet, X, Receipt, ArrowRightLeft } from 'lucide-react'
import LanguageSwitcher from '../LanguageSwitcher'
import BrandMark from '../BrandMark'
import { useTranslation } from 'react-i18next'

type Item = { to: string; key: string; icon: typeof Wallet; group: 'principal' | 'planejamento' | 'organizacao' | 'sistema' }

const items: Item[] = [
  { to: '/', key: 'financeOverview', icon: BarChart3, group: 'principal' },
  { to: '/transacoes', key: 'transactions', icon: Receipt, group: 'principal' },
  { to: '/transferencias', key: 'transfers', icon: ArrowRightLeft, group: 'principal' },
  { to: '/contas', key: 'accounts', icon: Wallet, group: 'principal' },
  { to: '/cartoes', key: 'cards', icon: CreditCard, group: 'principal' },
  { to: '/orcamentos', key: 'budgets', icon: Target, group: 'planejamento' },
  { to: '/metas', key: 'goals', icon: Target, group: 'planejamento' },
  { to: '/relatorios', key: 'reports', icon: BarChart3, group: 'planejamento' },
  { to: '/previsao', key: 'forecast', icon: CalendarClock, group: 'planejamento' },
  { to: '/patrimonio', key: 'netWorth', icon: Wallet, group: 'planejamento' },
  { to: '/inteligencia', key: 'insights', icon: Sparkles, group: 'planejamento' },
  { to: '/dividas', key: 'debts', icon: CreditCard, group: 'planejamento' },
  { to: '/notificacoes', key: 'notifications', icon: Bell, group: 'sistema' },
]

const moreItems: Item[] = [
  { to: '/calendario', key: 'financialCalendar', icon: CalendarClock, group: 'organizacao' },
  { to: '/recorrentes', key: 'recurring', icon: CalendarClock, group: 'organizacao' },
  { to: '/categorias', key: 'categories', icon: FolderTree, group: 'organizacao' },
  { to: '/configuracoes', key: 'financeSettings', icon: Settings2, group: 'sistema' },
  { to: '/import-export', key: 'importExport', icon: FileText, group: 'sistema' },
]

const navGroups = [
  { key: 'principal', items: items.filter(item => item.group === 'principal') },
  { key: 'planejamento', items: items.filter(item => item.group === 'planejamento') },
]

const localAppUrl = (port: number, configured: string) => {
  if (configured.trim()) return configured
  const host = window.location.hostname
  if (['localhost', '127.0.0.1'].includes(host) || host.startsWith('192.168.')) {
    return window.location.protocol + '//' + host + ':' + port + '/'
  }
  return ''
}

const fitnessUrl = localAppUrl(5175, import.meta.env.VITE_KOVIAN_FITNESS_URL || '')
const koviUrl = (import.meta.env.VITE_KOVI_APP_URL || '').trim() || (['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.hostname.startsWith('192.168.') ? window.location.protocol + '//' + window.location.hostname + ':5176/app/' : '')

function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches)
  const drawerRef = useRef<HTMLElement | null>(null)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const drawerWasOpen = useRef(false)
  const [palette, setPalette] = useState(false)
  const [query, setQuery] = useState('')
  const paletteReturnFocus = useRef<HTMLElement | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const paletteRef = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation()
  const location = useLocation()
  const moreActive = moreItems.some(item => item.to === location.pathname)

  const commands = [...items, ...moreItems].map(item => ({ ...item, label: t(item.key) }))
  const filtered = commands.filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)

  const openPalette = () => {
    paletteReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setPalette(true)
    setQuery('')
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPalette(previous => {
          if (previous) return false
          paletteReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
          setQuery('')
          return true
        })
      }
      if (event.key === 'Escape') setPalette(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (moreItems.some(item => item.to === location.pathname)) setMoreOpen(true)
  }, [location.pathname])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)')
    const sync = () => setIsMobile(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!open || !isMobile) {
      if (drawerWasOpen.current) menuTriggerRef.current?.focus()
      drawerWasOpen.current = false
      return
    }
    drawerWasOpen.current = true
    const drawer = drawerRef.current
    if (!drawer) return
    const focusable = () => Array.from(drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea')).filter(element => element.offsetParent !== null)
    focusable()[0]?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) { event.preventDefault(); return }
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault()
        items[items.length - 1].focus()
      } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
        event.preventDefault()
        items[0].focus()
      }
    }
    drawer.addEventListener('keydown', onKeyDown)
    return () => drawer.removeEventListener('keydown', onKeyDown)
  }, [open, isMobile])

  useEffect(() => {
    const locked = open || palette
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open, palette])

  useEffect(() => {
    if (!palette) {
      paletteReturnFocus.current?.focus()
      paletteReturnFocus.current = null
      return
    }
    const root = paletteRef.current
    if (!root) return
    const focusable = root.querySelectorAll<HTMLElement>('input, a[href], button:not([disabled])')
    focusable[0]?.focus()
    const onTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    root.addEventListener('keydown', onTab)
    return () => root.removeEventListener('keydown', onTab)
  }, [palette, filtered.length])

  return (
    <div className="app-shell"><a href="#finance-main" className="skip-link">Pular para o conteúdo</a>
      {open && <button type="button" className="scrim" aria-label={t('closeMenu')} onClick={() => setOpen(false)} />}

      <aside id="finance-navigation" ref={drawerRef} className={open ? 'drawer drawer-open' : 'drawer'} aria-hidden={isMobile && !open} inert={isMobile && !open}>
        <div className="brand">
          <BrandMark productName="FINANCE" className="h-9 w-9 shrink-0" />
          <button type="button" className="icon-button mobile-only" aria-label={t('closeMenu')} onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="nav-groups">
          {navGroups.map(group => (
            <div className="nav-group" key={group.key}>
              <span className="nav-group-title">{t(`group_${group.key}`)}</span>
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  <item.icon size={17} />
                  <span>{t(item.key)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="nav-group">
          <button className={moreActive ? "nav-item active" : "nav-item"} type="button" onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen}>
            <MoreHorizontal size={17} />
            <span>{t('more')}</span>
            <ChevronRight size={15} className={moreOpen ? 'rotate-90' : ''} />
          </button>
          {moreOpen && <div className="nav-subitems">{moreItems.map(item => <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><item.icon size={17} /><span>{t(item.key)}</span></NavLink>)}</div>}
        </div>

        <div className="nav-group ecosystem-links">
          <span className="nav-group-title">{t('ecosystem')}</span>
          {fitnessUrl && <a className="nav-item" href={fitnessUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><Dumbbell size={17} /><span>{t('fitness')}</span></a>}
          {koviUrl && <a className="nav-item" href={koviUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><Sparkles size={17} /><span>{t('koviAi')}</span></a>}
        </div>
      </aside>

      <div className="content" id="finance-main" tabIndex={-1}>
        <header className="topbar">
          <div className="top-left">
            <div className="md:hidden flex min-w-0 items-center gap-2.5">
              <BrandMark productName="FINANCE" showWordmark={false} className="h-8 w-8 shrink-0" />
              <div className="min-w-0"><strong className="block truncate text-xs font-extrabold tracking-[0.08em] text-[var(--text)]">KOVIAN <span className="kovian-brand-accent">FINANCE</span></strong><small className="block text-[9px] text-[var(--muted)]">{t('ecosystem')}</small></div>
            </div>
            <div className="hidden md:flex min-w-0 flex-col">
              <small>{t('ecosystem')}</small>
              <strong>{t('financeName')}</strong>
            </div>
          </div>

          <div className="top-actions">
            <button type="button" className="search-icon-button" aria-label={t('search')} title={`${t('search')} · Ctrl K`} onClick={openPalette}>
              <Search size={17} aria-hidden="true" />
            </button>
            <LanguageSwitcher />
            <button ref={menuTriggerRef} type="button" className="icon-button mobile-only" aria-label={t('more')} aria-expanded={open} aria-controls="finance-navigation" onClick={() => setOpen(true)}>
              <Menu size={19} />
            </button>
          </div>
        </header>

        {palette && <div className="palette-overlay" role="dialog" aria-modal="true" aria-label={t('search')} onMouseDown={e => { if (e.target === e.currentTarget) setPalette(false) }}>
          <div className="palette" ref={paletteRef}>
            <div className="palette-input"><Search size={17} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={t('searchFinance')} /></div>
            <div className="palette-list">
              {filtered.map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} className="palette-item" onClick={() => setPalette(false)}><Icon size={17} /><span>{item.label}</span><ChevronRight size={15} /></NavLink> })}
              {!filtered.length && <div className="palette-empty">{t('noResults')}</div>}
            </div>
            <small className="palette-hint">{t('escToClose')} · Ctrl K</small>
          </div>
        </div>}

        {children}

        <nav className="bottom-nav">
          {[items[0], items[1], items[2], items[3]].map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'}><item.icon size={18} /><span>{t(item.key)}</span></NavLink>)}
          <button type="button" onClick={() => setOpen(true)}><MoreHorizontal size={18} /><span>{t('more')}</span></button>
        </nav>
      </div>
    </div>
  )
}

export default Shell
