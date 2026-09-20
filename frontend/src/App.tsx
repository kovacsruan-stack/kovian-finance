import {useState,type ReactNode} from 'react'
import {NavLink,Route,Routes,useNavigate} from 'react-router-dom'
import {ArrowDownLeft,ArrowUpRight,BarChart3,Bell,BrainCircuit,ChevronRight,Home,Plus,Settings2,Target,Wallet,Menu,X,MoreHorizontal,Receipt,ShieldCheck,Sparkles} from 'lucide-react'
const money=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const items=[['/','Início',Home],['/contas','Contas',Wallet],['/transacoes','Transações',ArrowUpRight],['/metas','Metas',Target],['/ia','KOVI AI',BrainCircuit]] as const
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
 return <div className="page"><div className="page-head"><div><p className="eyebrow">SETEMBRO 2026</p><h1>Seu dinheiro, em um só lugar.</h1><p className="muted">Uma visão simples do que entrou, saiu e do que vem pela frente.</p></div><button className="primary"><Plus size={17}/>Lançamento</button></div>
 <section className="hero-card"><div><span>Saldo total</span><strong>{money(12450.72)}</strong><small>↑ 8,4% em relação ao mês anterior</small></div><div className="hero-orb"><Wallet size={26}/></div></section>
 <div className="stat-grid"><article><span>Receitas</span><strong>{money(8420)}</strong><i className="positive"><ArrowDownLeft size={15}/>12,2%</i></article><article><span>Despesas</span><strong>{money(5360)}</strong><i className="negative"><ArrowUpRight size={15}/>4,8%</i></article><article><span>Patrimônio</span><strong>{money(38640)}</strong><i className="positive"><BarChart3 size={15}/>6,1%</i></article></div>
 <div className="section-title"><div><h2>Próximos movimentos</h2><span>Visão rápida</span></div><ChevronRight size={18}/></div>
 <div className="list-card"><div><div className="dot warning"/><span><b>Fatura do cartão</b><small>vence em 3 dias</small></span><strong>{money(1240)}</strong></div><div><div className="dot primary-dot"/><span><b>Meta: Reserva</b><small>68% concluída</small></span><strong>R$ 6.800</strong></div></div>
 <div className="ai-card"><BrainCircuit size={22}/><div><span>KOVI AI</span><strong>Você está dentro do seu orçamento este mês.</strong><small>Veja os principais insights financeiros.</small></div><ChevronRight size={19}/></div></div>
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
export default function App(){return <Shell><Routes><Route path="/" element={<Dashboard/>}/><Route path="/contas" element={<Placeholder title="Contas"/>}/><Route path="/transacoes" element={<Placeholder title="Transações"/>}/><Route path="/metas" element={<Placeholder title="Metas"/>}/><Route path="/ia" element={<Placeholder title="KOVI AI"/>}/><Route path="*" element={<Placeholder title="KOVIAN Finance"/>}/></Routes></Shell>}