import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, BarChart3, Bell, ChevronRight, CreditCard, FileText, Menu, MoreHorizontal, Plus, Receipt, Settings2, ShieldCheck, Target, Wallet, X } from 'lucide-react'
import { getAccounts, getGoals, getOwnerId, getTransactions, type FinanceAccount, type FinanceGoal, type FinanceTransaction } from './lib/api'
import LanguageSwitcher from './components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

const money = (value: number, currency = 'BRL') => value.toLocaleString('pt-BR', { style: 'currency', currency })
type Item = { to: string; key: string; icon: typeof Wallet }
const items: Item[] = [
  { to: '/', key: 'financeOverview', icon: BarChart3 },
  { to: '/contas', key: 'accounts', icon: Wallet },
  { to: '/transacoes', key: 'transactions', icon: Receipt },
  { to: '/metas', key: 'goals', icon: Target },
  { to: '/relatorios', key: 'reports', icon: BarChart3 },
  { to: '/assinaturas', key: 'subscriptions', icon: CreditCard },
  { to: '/integracoes', key: 'financeIntegrations', icon: ShieldCheck },
  { to: '/configuracoes', key: 'financeSettings', icon: Settings2 },
]
function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  return <div className="app-shell">{open && <button className="scrim" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
    <aside className={open ? 'drawer drawer-open' : 'drawer'}><div className="brand"><div className="brand-mark">K</div><div><strong>KOVIAN</strong><span>Finance</span></div><button className="icon-button mobile-only" onClick={() => setOpen(false)}><X size={18} /></button></div>
      <nav className="nav-groups">{items.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><item.icon size={17} /><span>{t(item.key)}</span></NavLink>)}</nav>
      <div className="runtime-card"><ShieldCheck size={16} /><div><strong>Dados protegidos</strong><span>Backend como fonte de verdade</span></div></div>
    </aside>
    <div className="content"><header className="topbar"><div className="top-left"><button className="icon-button mobile-only" onClick={() => setOpen(true)}><Menu size={19} /></button><div><small>KOVIAN ECOSYSTEM</small><strong>Finance</strong></div></div><div className="top-actions"><LanguageSwitcher /><span className="status-dot"><i /> Online</span><div className="avatar">RK</div></div></header>{children}
      <nav className="bottom-nav">{items.slice(0, 4).map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'}><item.icon size={18} /><span>{t(item.key)}</span></NavLink>)}<button onClick={() => setOpen(true)}><MoreHorizontal size={18} /><span>Mais</span></button></nav>
    </div>
  </div>
}function Header({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) { return <section className="page-header"><div><span className="eyebrow">KOVIAN FINANCE</span><h1>{title}</h1><p>{desc}</p></div>{action}</section> }
function Dashboard() {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]); const [transactions, setTransactions] = useState<FinanceTransaction[]>([]); const [goals, setGoals] = useState<FinanceGoal[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null)
  useEffect(() => { const ownerId = getOwnerId(); if (!ownerId) { setLoading(false); setError('Faça login para carregar seus dados financeiros.'); return }; const now = new Date(); const from = new Date(now); from.setDate(from.getDate() - 90); void Promise.all([getAccounts(ownerId), getGoals(ownerId), getTransactions(from.toISOString(), now.toISOString())]).then(([a, g, tr]) => { setAccounts(a); setGoals(g); setTransactions(tr); setError(null) }).catch(() => setError('Não foi possível carregar os dados financeiros.')).finally(() => setLoading(false)) }, [])
  const brlIds = new Set(accounts.filter(a => a.currency === 'BRL').map(a => a.id)); const brlTx = transactions.filter(t => brlIds.has(t.accountId)); const balance = accounts.filter(a => a.currency === 'BRL').reduce((s, a) => s + Number(a.currentBalance || 0), 0); const income = brlTx.filter(t => t.type === 'INCOME' && t.status !== 'CANCELLED').reduce((s, t) => s + Number(t.amount || 0), 0); const expense = brlTx.filter(t => t.type === 'EXPENSE' && t.status !== 'CANCELLED').reduce((s, t) => s + Number(t.amount || 0), 0)
  return <main className="page"><Header title="Seu dinheiro, em um só lugar." desc="Acompanhe saldo, movimentações e metas com dados autorizados pelo backend." action={<button className="primary"><Plus size={17} /> Nova transação</button>} />
    {error && <div className="notice"><ShieldCheck size={18} /><span>{error}</span></div>}
    <section className="hero-card"><div><span>Saldo consolidado BRL</span><strong>{loading ? 'Carregando…' : money(balance)}</strong><small>{accounts.length} conta(s) sincronizada(s)</small></div><div className="hero-orb"><Wallet size={25} /></div></section>
    <div className="stat-grid"><Stat label="Receitas · 90 dias" value={loading ? '—' : money(income)} icon={ArrowDownLeft} /><Stat label="Despesas · 90 dias" value={loading ? '—' : money(expense)} icon={ArrowUpRight} /><Stat label="Metas ativas" value={loading ? '—' : String(goals.filter(g => g.active).length)} icon={Target} /></div>
    <div className="dashboard-grid"><section className="panel"><div className="section-title"><div><span className="eyebrow">CONTAS</span><h2>Contas conectadas</h2></div><NavLink to="/contas">Ver todas <ChevronRight size={15} /></NavLink></div><div className="account-list">{accounts.slice(0, 5).map(account => <div className="account-row" key={account.id}><i /><span><strong>{account.name}</strong><small>{account.accountType} · {account.currency}</small></span><b>{money(Number(account.currentBalance || 0), account.currency)}</b></div>)}{!loading && !accounts.length && <div className="empty-inline">Nenhuma conta cadastrada.</div>}</div></section>
      <section className="panel"><div className="section-title"><div><span className="eyebrow">ACESSO RÁPIDO</span><h2>Organizar</h2></div></div><div className="quick-grid"><Quick to="/contas" icon={Wallet} title="Contas" text="Gerencie saldos." /><Quick to="/transacoes" icon={Receipt} title="Transações" text="Acompanhe entradas e saídas." /><Quick to="/metas" icon={Target} title="Metas" text="Acompanhe objetivos." /><Quick to="/relatorios" icon={BarChart3} title="Relatórios" text="Analise períodos." /></div></section></div>
  </main>
}function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Target }) { return <article className="stat-card"><Icon size={17} /><span>{label}</span><strong>{value}</strong></article> }
function Quick({ to, icon: Icon, title, text }: { to: string; icon: typeof Wallet; title: string; text: string }) { return <NavLink className="quick-card" to={to}><Icon size={18} /><div><strong>{title}</strong><span>{text}</span></div><ChevronRight size={15} /></NavLink> }
const pageConfig: Record<string, { title: string; desc: string; icon: typeof Wallet; items: string[] }> = {
  '/contas': { title: 'Contas', desc: 'Organize contas bancárias, carteiras e saldos em um único lugar.', icon: Wallet, items: ['Contas bancárias', 'Carteiras', 'Saldos consolidados'] },
  '/transacoes': { title: 'Transações', desc: 'Acompanhe entradas, saídas e transferências com rastreabilidade.', icon: Receipt, items: ['Entradas e despesas', 'Filtros por período', 'Categorias e status'] },
  '/metas': { title: 'Metas e orçamento', desc: 'Defina objetivos e acompanhe o progresso ao longo do tempo.', icon: Target, items: ['Reserva de emergência', 'Objetivos personalizados', 'Orçamento mensal'] },
  '/relatorios': { title: 'Relatórios', desc: 'Transforme seus dados financeiros em visão clara para decisão.', icon: BarChart3, items: ['Fluxo de caixa', 'Resumo por período', 'Categorias'] },
  '/assinaturas': { title: 'Assinaturas', desc: 'Controle despesas recorrentes e compromissos financeiros.', icon: CreditCard, items: ['Recorrências', 'Próximos vencimentos', 'Histórico'] },
  '/integracoes': { title: 'Integrações', desc: 'Conecte fontes autorizadas mantendo credenciais fora da interface.', icon: ShieldCheck, items: ['Bancos', 'Importações', 'Serviços externos'] },
  '/configuracoes': { title: 'Configurações', desc: 'Preferências da conta e controles avançados do produto.', icon: Settings2, items: ['Perfil', 'Segurança', 'Preferências'] },
}
function FinancePage({ config }: { config: typeof pageConfig[string] }) {
  const { title, desc, icon: Icon, items } = config
  return <main className="page"><Header title={title} desc={desc} action={<button className="primary"><Plus size={17} /> Adicionar</button>} /><div className="feature-grid">{items.map(item => <article className="feature-card" key={item}><div className="feature-icon"><Icon size={18} /></div><div><strong>{item}</strong><span>Componente preparado para dados reais e auditoria.</span></div><ChevronRight size={16} /></article>)}</div><section className="panel empty-state"><Icon size={30} /><div><strong>Área pronta para integração</strong><p>As operações continuam autorizadas no backend financeiro.</p></div></section></main>
}
function App() { return <Shell><Routes><Route path="/" element={<Dashboard />} />{Object.entries(pageConfig).map(([path, config]) => <Route key={path} path={path} element={<FinancePage config={config} />} />)}<Route path="*" element={<FinancePage config={pageConfig['/configuracoes']} />} /></Routes></Shell> }
export default App