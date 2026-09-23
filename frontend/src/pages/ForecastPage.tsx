import { useMemo, useState } from 'react'
import { CalendarRange, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getForecastCashFlow, getOwnerId } from '../lib/api'
import type { CashFlowForecast } from '../lib/forecastTypes'

const money = (value:number) => value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
export default function ForecastPage() {
  const ownerId=getOwnerId()
  const [days,setDays]=useState(90)
  const from=useMemo(()=>new Date().toISOString().slice(0,10),[])
  const query=useQuery({queryKey:['finance','forecast','cash-flow',ownerId,from,days],queryFn:()=>getForecastCashFlow(ownerId!,from,days),enabled:Boolean(ownerId),staleTime:60_000})
  const data:CashFlowForecast[]=query.data ?? []
  const ending=data.at(-1)?.projectedBalance ?? 0
  const income=data.reduce((s,x)=>s+x.income,0)
  const expense=data.reduce((s,x)=>s+x.expense,0)
  return <main className="page">
    <section className="page-header"><div><span className="eyebrow">KOVIAN FINANCE</span><h1>Previsão de fluxo de caixa</h1><p>Projete entradas, saídas e saldo futuro a partir do histórico financeiro controlado pelo backend.</p></div><label className="secondary"><CalendarRange size={16}/><select value={days} onChange={e=>setDays(Number(e.target.value))} aria-label="Horizonte"><option value={30}>30 dias</option><option value={90}>90 dias</option><option value={180}>180 dias</option><option value={365}>365 dias</option></select></label></section>
    {!ownerId && <div className="notice">Faça login para carregar a previsão.</div>}
    {query.isError && <div className="notice">Não foi possível carregar a previsão.</div>}
    <div className="stat-grid"><article className="stat-card"><TrendingUp size={17}/><span>Receita projetada</span><strong>{money(income)}</strong></article><article className="stat-card"><TrendingDown size={17}/><span>Despesa projetada</span><strong>{money(expense)}</strong></article><article className="stat-card"><Wallet size={17}/><span>Saldo no fim do horizonte</span><strong>{money(ending)}</strong></article></div>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">PROJEÇÃO</span><h2>Fluxo diário</h2></div></div>{query.isLoading?<div className="empty-inline">Carregando...</div>:!data.length?<div className="empty-inline">Nenhuma projeção disponível.</div>:<div className="table-wrap"><table><thead><tr><th>Data</th><th>Receita</th><th>Despesa</th><th>Fluxo líquido</th><th>Saldo projetado</th></tr></thead><tbody>{data.map(row=><tr key={row.date}><td>{new Date(row.date+'T00:00:00').toLocaleDateString('pt-BR')}</td><td>{money(row.income)}</td><td>{money(row.expense)}</td><td>{money(row.netCashFlow)}</td><td>{money(row.projectedBalance)}</td></tr>)}</tbody></table></div>}</section>
  </main>
}
