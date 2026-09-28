import { useState } from 'react'
import { CalendarRange, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getForecastCashFlow, getOwnerId } from '../lib/api'
import type { CashFlowForecast } from '../lib/forecastTypes'
import { useTranslation } from 'react-i18next'

export const localDateKey = (date = new Date()) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')

const money = (value:number) => value.toLocaleString(document.documentElement.lang || 'pt-BR',{style:'currency',currency:'BRL'})
export default function ForecastPage() {
  const { t } = useTranslation()
  const ownerId=getOwnerId()
  const [days,setDays]=useState<30|90|180|365>(90)
  const [from,setFrom]=useState(()=>localDateKey())
  const today=localDateKey()
  const query=useQuery({queryKey:['finance','forecast','cash-flow',ownerId,from,days],queryFn:()=>getForecastCashFlow(ownerId!,from,days),enabled:Boolean(ownerId),staleTime:60_000, retry:2})
  const data:CashFlowForecast[]=query.data ?? []
  const hasFiniteData=data.every(row=>Number.isFinite(row.income)&&Number.isFinite(row.expense)&&Number.isFinite(row.netCashFlow)&&Number.isFinite(row.projectedBalance))
  const ending=data.at(-1)?.projectedBalance ?? 0
  const income=data.reduce((s,x)=>s+x.income,0)
  const expense=data.reduce((s,x)=>s+x.expense,0)
  return <main className="page">
    <section className="page-header"><div><span className="eyebrow">KOVIAN FINANCE</span><h1>{t('forecastTitle')}</h1><p>{t('forecastDesc')}</p></div><div className="flex flex-wrap items-center gap-3"><label className="secondary"><CalendarRange size={16}/><span>Data inicial</span><input type="date" value={from} min={today} onChange={e=>setFrom(e.target.value || today)} aria-label="Data inicial da projeção" /></label><label className="secondary"><CalendarRange size={16}/><select value={days} onChange={e=>setDays(Number(e.target.value) as 30|90|180|365)} aria-label={t('forecastHorizon')}><option value={30}>{t('daysCount',{count:30})}</option><option value={90}>{t('daysCount',{count:90})}</option><option value={180}>{t('daysCount',{count:180})}</option><option value={365}>{t('daysCount',{count:365})}</option></select></label></div></section>
    {!ownerId && <div className="notice">{t('loginToLoadData')}</div>}
    {query.isError && <div className="notice">{t('forecastError')}</div>}
    <div className="stat-grid"><article className="stat-card"><TrendingUp size={17}/><span>{t('projectedIncome')}</span><strong>{query.isLoading||query.isError||!hasFiniteData?'—':money(income)}</strong></article><article className="stat-card"><TrendingDown size={17}/><span>{t('projectedExpense')}</span><strong>{query.isLoading||query.isError||!hasFiniteData?'—':money(expense)}</strong></article><article className="stat-card"><Wallet size={17}/><span>{t('projectedEndingBalance')}</span><strong>{query.isLoading||query.isError||!hasFiniteData?'—':money(ending)}</strong></article></div>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('projection')}</span><h2>{t('dailyCashFlow')}</h2></div></div>{query.isLoading?<div className="empty-inline">{t('loading')}</div>:!hasFiniteData?<div className="empty-inline">{t('forecastError')}</div>:!data.length?<div className="empty-inline">{t('noForecast')}</div>:<div className="table-wrap"><table><thead><tr><th>{t('date')}</th><th>{t('income')}</th><th>{t('expense')}</th><th>{t('netFlow')}</th><th>{t('projectedBalance')}</th></tr></thead><tbody>{data.map(row=><tr key={row.date}><td>{new Date(row.date+'T00:00:00').toLocaleDateString(document.documentElement.lang || 'pt-BR')}</td><td>{money(row.income)}</td><td>{money(row.expense)}</td><td>{money(row.netCashFlow)}</td><td>{money(row.projectedBalance)}</td></tr>)}</tbody></table></div>}</section>
  </main>
}
