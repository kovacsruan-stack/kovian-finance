import { useMemo, useState } from 'react'
import { CalendarRange, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getForecastCashFlow, getOwnerId } from '../lib/api'
import type { CashFlowForecast } from '../lib/forecastTypes'
import { useTranslation } from 'react-i18next'
import { summarizeForecast } from '../lib/forecastAnalysis'
import { formatCurrency as money } from '../lib/format'
import PageHeader from '../components/ui/PageHeader'

const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
export default function ForecastPage() {
  const { t } = useTranslation()
  const ownerId=getOwnerId()
  const [days,setDays]=useState<30|90|180|365>(90)
  const from=useMemo(()=>localDateKey(new Date()),[])
  const query=useQuery({queryKey:['finance','forecast','cash-flow',ownerId,from,days],queryFn:()=>getForecastCashFlow(ownerId!,from,days),enabled:Boolean(ownerId),staleTime:60_000, retry:2})
  const data:CashFlowForecast[]=query.data ?? []
  const summary = useMemo(() => summarizeForecast(data), [data])
  const hasFiniteData=data.every(row=>Number.isFinite(row.income)&&Number.isFinite(row.expense)&&Number.isFinite(row.netCashFlow)&&Number.isFinite(row.projectedBalance))
  return <main className="page">
    <PageHeader title={t('forecastTitle')} description={t('forecastDesc')} actions={<><label className="secondary"><CalendarRange size={16}/><select value={days} onChange={e=>setDays(Number(e.target.value) as 30|90|180|365)} aria-label={t('forecastHorizon')}><option value={30}>{t('daysCount',{count:30})}</option><option value={90}>{t('daysCount',{count:90})}</option><option value={180}>{t('daysCount',{count:180})}</option><option value={365}>{t('daysCount',{count:365})}</option></select></label></>} />
    {!ownerId && <div className="notice">{t('loginToLoadData')}</div>}
    {query.isError && <div className="notice">{t('forecastError')}</div>}
    <div className="stat-grid"><article className="stat-card"><TrendingUp size={17}/><span>{t('projectedIncome')}</span><strong>{query.isLoading||query.isError||!hasFiniteData?'—':money(summary.projectedIncome)}</strong></article><article className="stat-card"><TrendingDown size={17}/><span>{t('projectedExpense')}</span><strong>{query.isLoading||query.isError||!hasFiniteData?'—':money(summary.projectedExpense)}</strong></article><article className="stat-card"><Wallet size={17}/><span>{t('projectedEndingBalance')}</span><strong>{query.isLoading||query.isError||!hasFiniteData||summary.endingBalance===null?'—':money(summary.endingBalance)}</strong></article></div>
    {!query.isLoading&&!query.isError&&hasFiniteData&&data.length>0&&<div className="stat-grid">
      <article className="stat-card"><TrendingDown size={17}/><span>{document.documentElement.lang?.startsWith('pt')?'Menor saldo projetado':'Lowest projected balance'}</span><strong>{summary.minimumBalance===null?'—':money(summary.minimumBalance)}</strong><small>{summary.minimumBalanceDate?new Date(summary.minimumBalanceDate+'T00:00:00').toLocaleDateString(document.documentElement.lang||'pt-BR'):''}</small></article>
      <article className="stat-card"><CalendarRange size={17}/><span>{document.documentElement.lang?.startsWith('pt')?'Dias com saldo negativo':'Days with negative balance'}</span><strong>{summary.negativeBalanceDays}</strong></article>
    </div>}
    {!query.isLoading&&!query.isError&&hasFiniteData&&summary.firstNegativeBalanceDate&&<div className="notice" role="status">{document.documentElement.lang?.startsWith('pt')?'A projeção indica saldo negativo a partir de ':'The projection indicates a negative balance starting '}{new Date(summary.firstNegativeBalanceDate+'T00:00:00').toLocaleDateString(document.documentElement.lang||'pt-BR')}. {document.documentElement.lang?.startsWith('pt')?'Revise os valores previstos; esta é uma estimativa baseada no modelo atual.':'Review expected values; this is an estimate based on the current model.'}</div>}
    <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('projection')}</span><h2>{t('dailyCashFlow')}</h2></div></div>{query.isLoading?<div className="empty-inline">{t('loading')}</div>:!hasFiniteData?<div className="empty-inline">{t('forecastError')}</div>:!data.length?<div className="empty-inline">{t('noForecast')}</div>:<div className="table-wrap"><table><thead><tr><th>{t('date')}</th><th>{t('income')}</th><th>{t('expense')}</th><th>{t('netFlow')}</th><th>{t('projectedBalance')}</th></tr></thead><tbody>{data.map(row=><tr key={row.date}><td>{new Date(row.date+'T00:00:00').toLocaleDateString(document.documentElement.lang || 'pt-BR')}</td><td>{money(row.income)}</td><td>{money(row.expense)}</td><td>{money(row.netCashFlow)}</td><td className={row.projectedBalance<0?'negative':''}>{money(row.projectedBalance)}</td></tr>)}</tbody></table></div>}</section>
  </main>
}
