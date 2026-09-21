import {useState,type ReactNode} from 'react'
import {NavLink,Route,Routes} from 'react-router-dom'
import {ArrowDownLeft,ArrowUpRight,BarChart3,Bell,BrainCircuit,ChevronRight,Home,Plus,Settings2,Target,Wallet,Menu,X,MoreHorizontal,Receipt,ShieldCheck,Sparkles} from 'lucide-react'
const money=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const items=[['/','Início',Home],['/controle','Controle',ShieldCheck],['/contas','Contas',Wallet],['/transacoes','Transações',ArrowUpRight],['/metas','Metas',Target],['/ia','KOVI AI',BrainCircuit]] as const
function Shell({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false)
 return <div className="app-shell">
  {open&&<button className="scrim" aria-label="Fechar menu" onClick={()=>setOpen(false)}/>}
  <aside className={open?'drawer drawer-open':'drawer'}>
   <div className="brand"><div className="brand-mark">K</div><div><strong>KOVIAN</strong><span>Finance</span></div><button className="icon-btn mobile-only" onClick={()=>setOpen(false)}><X size={19}/></button></div>
   <nav className="side-nav">{items.map(([to,label,Icon])=><NavLink end={to==='/' } key={to} to={to} onClick={()=>setOpen(false)} className={({isActive})=>isActive?'active':''}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
   <div className="side-bottom"><NavLink to="/notificacoes"><Bell size={18}/>Notificações</NavLink><NavLink to="/configuracoes"><Settings2 size={18}/>Configurações</NavLink></div>
  </aside>
  <div className="content"><header className="topbar"><button className="icon-btn mobile-only" onClick={()=>setOpen(true)} aria-label="Abrir menu"><Menu size={21}/></button><div className="top-title"><span>Visão geral</span><strong>Olá, Ruan 👋</strong></div><button className="avatar">RK</button></header><main>{children}</main></div>
  <nav className="bottom-nav">{items.map(([to,label,Icon])=><NavLink end={to==='/' } key={to} to={to}><Icon size={20}/><span>{label}</span></NavLink>)}<button onClick={()=>setOpen(true)}><MoreHorizontal size={20}/><span>Mais</span></button></nav>
 </div>
}
function Dashboard(){
 const [accounts,setAccounts]=useState<FinanceAccount[]>([])
 const [transactions,setTransactions]=useState<FinanceTransaction[]>([])
 const [goals,setGoals]=useState<FinanceGoal[]>([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState<string|null>(null)
 useEffect(()=>{
  const ownerId=getOwnerId()
  if(!ownerId){setLoading(false);setError('Faça login para carregar seus dados financeiros.');return}
  const now=new Date();const from=new Date(now);from.setDate(from.getDate()-90)
  void Promise.all([
   getAccounts(ownerId),
   getGoals(ownerId),
   getTransactions(from.toISOString(),now.toISOString()),
  ]).then(([accountData,goalData,transactionData])=>{
   setAccounts(accountData);setGoals(goalData);setTransactions(transactionData);setError(null)
  }).catch(()=>setError('Não foi possível carregar os dados financeiros.')).finally(()=>setLoading(false))
 },[])
 const balance=accounts.reduce((sum,a)=>sum+Number(a.currentBalance||0),0)
 const income=transactions.filter(t=>t.type==='INCOME'&&t.status!=='CANCELLED').reduce((sum,t)=>sum+Number(t.amount||0),0)
 const expense=transactions.filter(t=>t.type==='EXPENSE'&&t.status!=='CANCELLED').reduce((sum,t)=>sum+Number(t.amount||0),0)
 const nextGoal=goals.find(g=>g.active)
 return <div className="page"><div className="page-head"><div><p className="eyebrow">KOVIAN FINANCE</p><h1>Seu dinheiro, em um só lugar.</h1><p className="muted">Dados sincronizados com o backend financeiro autorizado.</p></div><button className="primary"><Plus size={17}/>Lançamento</button></div>
 {error&&<div className="empty-card"><ShieldCheck size={28}/><strong>{error}</strong><span>Entre no ambiente autenticado do KOVIAN para consultar os dados da sua conta.</span></div>}
 <section className="hero-card"><div><span>Saldo total</span><strong>{loading?'Carregando…':money(balance)}</strong><small>{accounts.length} conta(s) ativa(s)</small></div><div className="hero-orb"><Wallet size={26}/></div></section>
 <div className="stat-grid"><article><span>Receitas · 90 dias</span><strong>{loading?'—':money(income)}</strong><i className="positive"><ArrowDownLeft size={15}/>{transactions.filter(t=>t.type==='INCOME').length} lançamentos</i></article><article><span>Despesas · 90 dias</span><strong>{loading?'—':money(expense)}</strong><i className="negative"><ArrowUpRight size={15}/>{transactions.filter(t=>t.type==='EXPENSE').length} lançamentos</i></article><article><span>Metas ativas</span><strong>{loading?'—':goals.filter(g=>g.active).length}</strong><i className="positive"><Target size={15}/>{nextGoal?money(nextGoal.currentAmount):'Sem meta'}</i></article></div>
 <div className="section-title"><div><h2>Contas</h2><span>{accounts.length ? 'Saldos sincronizados' : 'Nenhuma conta encontrada'}</span></div><ChevronRight size={18}/></div>
 <div className="list-card">{accounts.slice(0,4).map(account=><div key={account.id}><div className="dot primary-dot"/><span><b>{account.name}</b><small>{account.accountType} · {account.currency}</small></span><strong>{money(Number(account.currentBalance||0))}</strong></div>)}{!loading&&!accounts.length&&<div><span><b>Nenhuma conta cadastrada</b><small>Cadastre uma conta para começar.</small></span></div>}</div>
 <div className="ai-card"><BrainCircuit size={22}/><div><span>KOVI AI</span><strong>Insights financeiros baseados nos dados autorizados.</strong><small>O KOVI permanece somente como camada de inteligência; o Finance continua sendo a fonte de verdade.</small></div><ChevronRight size={19}/></div></div>
}
function Placeholder({title}:{title:string}){
 const config:Record<string,{icon:typeof Wallet,desc:string,action:string,items:string[]}>={
  Contas:{icon:Wallet,desc:'Organize contas bancárias, carteiras e saldos em um único lugar.',action:'Nova conta',items:['Saldo consolidado','Contas bancárias','Carteiras e dinheiro']},
  Transações:{icon:Receipt,desc:'Acompanhe entradas, saídas e transferências com rastreabilidade.',action:'Nova transação',items:['Entradas e despesas','Filtros por período','Categorias e status']},
  Metas:{icon:Target,desc:'Defina objetivos financeiros e acompanhe o progresso ao longo do tempo.',action:'Nova meta',items:['Reserva de emergência','Objetivos personalizados','Progresso por período']},
  'KOVI AI':{icon:Sparkles,desc:'Insights financeiros explicáveis, baseados nos dados autorizados da sua conta.',action:'Ver insights',items:['Fluxo de caixa','Orçamento','Sinais de atenção']},
 }
 const item=config[title]??{icon:Wallet,desc:'Área do ecossistema KOVIAN Finance.',action:'Adicionar',items:[]}; const Icon=item.icon
 return <div className="page"><div className="page-head"><div><p className="eyebrow">KOVIAN FINANCE</p><h1>{title}</h1><p className="muted">{item.desc}</p></div><button className="primary"><Plus size={17}/>{item.action}</button></div>
  <div className="feature-grid">{item.items.map((label)=><article className="feature-card" key={label}><Icon size={19}/><div><strong>{label}</strong><span>Disponível quando os dados da API forem conectados.</span></div><ChevronRight size={17}/></article>)}</div>
  <div className="empty-card"><ShieldCheck size={28}/><strong>Dados protegidos por design</strong><span>As operações financeiras serão autorizadas no backend e auditadas.</span></div>
 </div>
}
export default function App(){return <Shell><Routes><Route path="/" element={<Dashboard/>}/><Route path="/contas" element={<Placeholder title="Contas"/>}/><Route path="/transacoes" element={<Placeholder title="Transações"/>}/><Route path="/metas" element={<Placeholder title="Metas"/>}/><Route path="/ia" element={<Placeholder title="KOVI AI"/>}/><Route path="/controle" element={<ControlPlane/>}/><Route path="*" element={<Placeholder title="KOVIAN Finance"/>}/></Routes></Shell>}