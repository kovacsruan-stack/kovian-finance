import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, BarChart3, Bell, CalendarClock, ChevronRight, CreditCard, FileText, FolderTree, Menu, MoreHorizontal, Plus, Receipt, Search, Settings2, ShieldCheck, Target, Wallet, X } from 'lucide-react'
import { getAccounts, getGoals, getOwnerId, getTransactions, type FinanceAccount, type FinanceGoal, type FinanceTransaction } from './lib/api'
import LanguageSwitcher from './components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

const money = (value: number, currency = 'BRL') => value.toLocaleString('pt-BR', { style: 'currency', currency })
type Item = { to: string; key: string; icon: typeof Wallet; group: 'principal' | 'planejamento' | 'organizacao' | 'sistema' }
const items: Item[] = [
  { to: '/', key: 'financeOverview', icon: BarChart3, group: 'principal' },
  { to: '/transacoes', key: 'transactions', icon: Receipt, group: 'principal' },
  { to: '/contas', key: 'accounts', icon: Wallet, group: 'principal' },
  { to: '/cartoes', key: 'cards', icon: CreditCard, group: 'principal' },
  { to: '/orcamentos', key: 'budgets', icon: Target, group: 'planejamento' },
  { to: '/metas', key: 'goals', icon: Target, group: 'planejamento' },
  { to: '/relatorios', key: 'reports', icon: BarChart3, group: 'planejamento' },
  { to: '/recorrentes', key: 'recurring', icon: CalendarClock, group: 'organizacao' },
  { to: '/categorias', key: 'categories', icon: FolderTree, group: 'organizacao' },
  { to: '/integracoes', key: 'financeIntegrations', icon: ShieldCheck, group: 'sistema' },
  { to: '/configuracoes', key: 'financeSettings', icon: Settings2, group: 'sistema' },
]
const navGroups = [
  { key: 'principal', items: items.filter(item => item.group === 'principal') },
  { key: 'planejamento', items: items.filter(item => item.group === 'planejamento') },
  { key: 'organizacao', items: items.filter(item => item.group === 'organizacao') },
  { key: 'sistema', items: items.filter(item => item.group === 'sistema') },
]
function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const [query, setQuery] = useState('')
  const { t } = useTranslation()
  const commands = items.map(item => ({ ...item, label: t(item.key) }))
  const filtered = commands.filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPalette(v => !v); setQuery('') } if (event.key === 'Escape') setPalette(false) }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [])
  return <div className="app-shell">{open && <button className="scrim" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
    <aside className={open ? 'drawer drawer-open' : 'drawer'}><div className="brand"><div className="brand-mark">K</div><div><strong>KOVIAN</strong><span>Finance</span></div><button className="icon-button mobile-only" onClick={() => setOpen(false)}><X size={18} /></button></div>
      <nav className="nav-groups">{navGroups.map(group => <div className="nav-group" key={group.key}><span className="nav-group-title">{t(`group_${group.key}`)}</span>{group.items.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><item.icon size={17} /><span>{t(item.key)}</span></NavLink>)}</div>)}</nav>
      <div className="runtime-card"><ShieldCheck size={16} /><div><strong>Dados protegidos</strong><span>Backend como fonte de verdade</span></div></div>
    </aside>
    <div className="content"><header className="topbar"><div className="top-left"><button className="icon-button mobile-only" onClick={() => setOpen(true)}><Menu size={19} /></button><div><small>KOVIAN ECOSYSTEM</small><strong>Finance</strong></div></div><div className="top-actions"><button className="search-box" aria-label="Buscar" onClick={() => setPalette(true)}><Search size={15} /><span>Buscar...</span><kbd>ÔîÿK</kbd></button><LanguageSwitcher /><span className="status-dot"><i /> Online</span><div className="avatar" aria-label="KOVIAN">K</div></div></header>{palette && <div className="palette-overlay" role="dialog" aria-modal="true" aria-label="Buscar" onMouseDown={e => { if (e.target === e.currentTarget) setPalette(false) }}><div className="palette"><div className="palette-input"><Search size={17} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar no KOVIAN Finance..." /></div><div className="palette-list">{filtered.map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} className="palette-item" onClick={() => setPalette(false)}><Icon size={17} /><span>{item.label}</span><ChevronRight size={15} /></NavLink> })}{!filtered.length && <div className="palette-empty">Nenhum resultado encontrado.</div>}</div><small className="palette-hint">Esc ┬À fechar ┬À Ctrl/Ôîÿ K</small></div></div>}{children}
      <nav className="bottom-nav">{[items[0], items[1], items[4], items[5]].map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'}><item.icon size={18} /><span>{t(item.key)}</span></NavLink>)}<button onClick={() => setOpen(true)}><MoreHorizontal size={18} /><span>{t('more')}</span></button></nav>
    </div>
  </div>
}function Header({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) { return <section className="page-header"><div><span className="eyebrow">KOVIAN FINANCE</span><h1>{title}</h1><p>{desc}</p></div>{action}</section> }
function Dashboard() {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]); const [transactions, setTransactions] = useState<FinanceTransaction[]>([]); const [goals, setGoals] = useState<FinanceGoal[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  useEffect(() => { const ownerId = getOwnerId(); if (!ownerId) { setLoading(false); setError('Fa├ºa login para carregar seus dados financeiros.'); return }; const now = new Date(); const from = new Date(now); from.setDate(from.getDate() - 90); void Promise.all([getAccounts(ownerId), getGoals(ownerId), getTransactions(from.toISOString(), now.toISOString())]).then(([a, g, tr]) => { setAccounts(a); setGoals(g); setTransactions(tr); setError(null) }).catch(() => setError('N├úo foi poss├¡vel carregar os dados financeiros.')).finally(() => setLoading(false)) }, [])
  const brlIds = new Set(accounts.filter(a => a.currency === 'BRL').map(a => a.id)); const brlTx = transactions.filter(t => brlIds.has(t.accountId)); const balance = accounts.filter(a => a.currency === 'BRL').reduce((s, a) => s + Number(a.currentBalance || 0), 0); const income = brlTx.filter(t => t.type === 'INCOME' && t.status !== 'CANCELLED').reduce((s, t) => s + Number(t.amount || 0), 0); const expense = brlTx.filter(t => t.type === 'EXPENSE' && t.status !== 'CANCELLED').reduce((s, t) => s + Number(t.amount || 0), 0)
  return <main className="page"><Header title="Seu dinheiro, em um s├│ lugar." desc="Acompanhe saldo, movimenta├º├Áes e metas com dados autorizados pelo backend." action={<NavLink className="primary" to="/transacoes"><Plus size={17} /> Nova transa├º├úo</NavLink>} />
    {error && <div className="notice"><ShieldCheck size={18} /><span>{error}</span></div>}
    <section className="hero-card"><div><span>Saldo consolidado BRL</span><strong>{loading ? 'CarregandoÔÇª' : money(balance)}</strong><small>{accounts.length} conta(s) sincronizada(s)</small></div><div className="hero-orb"><Wallet size={25} /></div></section>
    <div className="stat-grid"><Stat label="Receitas ┬À 90 dias" value={loading ? 'ÔÇö' : money(income)} icon={ArrowDownLeft} /><Stat label="Despesas ┬À 90 dias" value={loading ? 'ÔÇö' : money(expense)} icon={ArrowUpRight} /><Stat label="Metas ativas" value={loading ? 'ÔÇö' : String(goals.filter(g => g.active).length)} icon={Target} /></div>
    <div className="dashboard-grid"><section className="panel"><div className="section-title"><div><span className="eyebrow">CONTAS</span><h2>Contas conectadas</h2></div><NavLink to="/contas">Ver todas <ChevronRight size={15} /></NavLink></div><div className="account-list">{accounts.slice(0, 5).map(account => <div className="account-row" key={account.id}><i /><span><strong>{account.name}</strong><small>{account.accountType} ┬À {account.currency}</small></span><b>{money(Number(account.currentBalance || 0), account.currency)}</b></div>)}{!loading && !accounts.length && <div className="empty-inline">Nenhuma conta cadastrada.</div>}</div></section>
      <section className="panel"><div className="section-title"><div><span className="eyebrow">ACESSO R├üPIDO</span><h2>Organizar</h2></div></div><div className="quick-grid"><Quick to="/contas" icon={Wallet} title="Contas" text="Gerencie saldos." /><Quick to="/transacoes" icon={Receipt} title="Transa├º├Áes" text="Acompanhe entradas e sa├¡das." /><Quick to="/metas" icon={Target} title="Metas" text="Acompanhe objetivos." /><Quick to="/relatorios" icon={BarChart3} title="Relat├│rios" text="Analise per├¡odos." /></div></section></div>
  </main>
}function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Target }) { return <article className="stat-card"><Icon size={17} /><span>{label}</span><strong>{value}</strong></article> }
function Quick({ to, icon: Icon, title, text }: { to: string; icon: typeof Wallet; title: string; text: string }) { return <NavLink className="quick-card" to={to}><Icon size={18} /><div><strong>{title}</strong><span>{text}</span></div><ChevronRight size={15} /></NavLink> }
const pageConfig: Record<string, { title: string; desc: string; icon: typeof Wallet; items: string[]; actionTo: string; itemRoutes: string[] }> = {
  '/contas': { title: 'Contas', desc: 'Organize contas banc├írias, carteiras e saldos em um ├║nico lugar.', icon: Wallet, items: ['Contas banc├írias', 'Carteiras', 'Saldos consolidados'], actionTo: '/contas', itemRoutes: ['/contas','/contas','/contas'] },
  '/transacoes': { title: 'Transa├º├Áes', desc: 'Acompanhe entradas, sa├¡das e transfer├¬ncias com rastreabilidade.', icon: Receipt, items: ['Entradas e despesas', 'Filtros por per├¡odo', 'Categorias e status'], actionTo: '/transacoes', itemRoutes: ['/transacoes','/transacoes','/transacoes'] },
  '/metas': { title: 'Metas e or├ºamento', desc: 'Defina objetivos e acompanhe o progresso ao longo do tempo.', icon: Target, items: ['Reserva de emerg├¬ncia', 'Objetivos personalizados', 'Or├ºamento mensal'], actionTo: '/metas', itemRoutes: ['/metas','/metas','/metas'] },
  '/relatorios': { title: 'Relat├│rios', desc: 'Transforme seus dados financeiros em vis├úo clara para decis├úo.', icon: BarChart3, items: ['Fluxo de caixa', 'Resumo por per├¡odo', 'Categorias'], actionTo: '/relatorios', itemRoutes: ['/relatorios','/relatorios','/relatorios'] },
  '/assinaturas': { title: 'Assinaturas', desc: 'Controle despesas recorrentes e compromissos financeiros.', icon: CreditCard, items: ['Recorr├¬ncias', 'Pr├│ximos vencimentos', 'Hist├│rico'], actionTo: '/assinaturas', itemRoutes: ['/assinaturas','/assinaturas','/assinaturas'] },
  '/cartoes': { title: 'Cartões', desc: 'Acompanhe limites, faturas, vencimentos e compras parceladas.', icon: CreditCard, items: ['Meus cartões', 'Faturas abertas', 'Compras parceladas'], actionTo: '/cartoes', itemRoutes: ['/cartoes','/cartoes','/cartoes'] },
  '/orcamentos': { title: 'Orçamentos', desc: 'Defina limites por categoria e acompanhe o consumo do mês.', icon: Target, items: ['Orçamento mensal', 'Limites por categoria', 'Alertas de gastos'], actionTo: '/orcamentos', itemRoutes: ['/orcamentos','/orcamentos','/orcamentos'] },
  '/recorrentes': { title: 'Recorrentes', desc: 'Organize contas, receitas e compromissos que se repetem.', icon: CalendarClock, items: ['Contas recorrentes', 'Receitas recorrentes', 'Próximos vencimentos'], actionTo: '/recorrentes', itemRoutes: ['/recorrentes','/recorrentes','/recorrentes'] },
  '/categorias': { title: 'Categorias', desc: 'Organize receitas e despesas por categorias, subcategorias e tags.', icon: FolderTree, items: ['Despesas', 'Receitas', 'Tags e subcategorias'], actionTo: '/categorias', itemRoutes: ['/categorias','/categorias','/categorias'] },
  '/integracoes': { title: 'Integra├º├Áes', desc: 'Conecte fontes autorizadas mantendo credenciais fora da interface.', icon: ShieldCheck, items: ['Bancos', 'Importa├º├Áes', 'Servi├ºos externos'], actionTo: '/integracoes', itemRoutes: ['/integracoes','/integracoes','/integracoes'] },
  '/configuracoes': { title: 'Configura├º├Áes', desc: 'Prefer├¬ncias da conta e controles avan├ºados do produto.', icon: Settings2, items: ['Perfil', 'Seguran├ºa', 'Prefer├¬ncias'], actionTo: '/configuracoes', itemRoutes: ['/configuracoes','/configuracoes','/configuracoes'] },
}
function FinancePage({ config }: { config: typeof pageConfig[string] }) {
  const { title, desc, icon: Icon, items, actionTo, itemRoutes } = config
  return <main className="page"><Header title={title} desc={desc} action={<NavLink className="primary" to={actionTo}><Plus size={17} /> Adicionar</NavLink>} /><div className="feature-grid">{items.map((item, index) => <NavLink className="feature-card" to={itemRoutes[index] ?? actionTo} key={item}><div className="feature-icon"><Icon size={18} /></div><div><strong>{item}</strong><span>Componente preparado para dados reais e auditoria.</span></div><ChevronRight size={16} /></NavLink>)}</div><section className="panel empty-state"><Icon size={30} /><div><strong>├ürea pronta para integra├º├úo</strong><p>As opera├º├Áes continuam autorizadas no backend financeiro.</p></div></section></main>
}
function App() { return <Shell><Routes><Route path="/" element={<Dashboard />} />{Object.entries(pageConfig).map(([path, config]) => <Route key={path} path={path} element={<FinancePage config={config} />} />)}<Route path="*" element={<FinancePage config={pageConfig['/configuracoes']} />} /></Routes></Shell> }
export default App


