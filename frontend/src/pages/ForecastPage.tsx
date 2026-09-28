import { useMemo, useState } from 'react'
import { CalendarRange, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getForecastCashFlow, getOwnerId } from '../lib/api'
import type { CashFlowForecast } from '../lib/forecastTypes'
import { useTranslation } from 'react-i18next'

const money = (value: number) => value.toLocaleString(document.documentElement.lang || 'pt-BR', { style: 'currency', currency: 'BRL' })
const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function BalanceChart({ data }: { data: CashFlowForecast[] }) {
  const points = useMemo(() => {
    if (!data.length) return []
    const values = data.map(row => row.projectedBalance)
    const min = Math.min(0, ...values)
    const max = Math.max(0, ...values)
    const range = max - min || 1
    return values.map((value, index) => ({
      x: data.length === 1 ? 360 : 24 + (index / (data.length - 1)) * 672,
      y: 16 + ((max - value) / range) * 160,
      value,
      date: data[index].date,
    }))
  }, [data])
  if (!points.length) return null
  const line = points.map(point => `${point.x},${point.y}`).join(' ')
  const zeroY = 16 + ((Math.max(0, ...data.map(row => row.projectedBalance)) - 0) / (Math.max(0, ...data.map(row => row.projectedBalance)) - Math.min(0, ...data.map(row => row.projectedBalance)) || 1)) * 160
  const first = points[0]
  const last = points[points.length - 1]
  return <div className="forecast-chart" role="img" aria-label={`Saldo projetado de ${money(first.value)} em ${first.date} para ${money(last.value)} em ${last.date}`}>
    <div className="forecast-chart-labels"><span>{money(Math.max(...data.map(row => row.projectedBalance)))}</span><span>{money(Math.min(...data.map(row => row.projectedBalance)))}</span></div>
    <svg viewBox="0 0 720 200" preserveAspectRatio="none" aria-hidden="true">
      <line x1="24" x2="696" y1={zeroY} y2={zeroY} stroke="currentColor" strokeOpacity=".18" strokeDasharray="4 5" />
      <polyline points={line} fill="none" stroke="var(--accent, #16a34a)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={first.x} cy={first.y} r="4" fill="var(--accent, #16a34a)" />
      <circle cx={last.x} cy={last.y} r="4" fill="var(--accent, #16a34a)" />
    </svg>
    <div className="forecast-chart-labels"><span>{first.date}</span><span>{last.date}</span></div>
  </div>
}

export default function ForecastPage() {
  const { t } = useTranslation()
  const ownerId = getOwnerId()
  const [days, setDays] = useState<30 | 90 | 180 | 365>(90)
  const from = useMemo(() => localDateKey(), [])
  const query = useQuery({ queryKey: ['finance', 'forecast', 'cash-flow', ownerId, from, days], queryFn: () => getForecastCashFlow(ownerId!, from, days), enabled: Boolean(ownerId), staleTime: 60_000, retry: 2 })
  const data: CashFlowForecast[] = query.data ?? []
  const hasFiniteData = data.every(row => Number.isFinite(row.income) && Number.isFinite(row.expense) && Number.isFinite(row.netCashFlow) && Number.isFinite(row.projectedBalance))
  const ending = data.at(-1)?.projectedBalance ?? 0
  const income = data.reduce((sum, row) => sum + row.income, 0)
  const expense = data.reduce((sum, row) => sum + row.expense, 0)
  const showData = !query.isLoading && !query.isError && hasFiniteData && data.length > 0
  return <main className="page">
    <section className="page-header"><div><span className="eyebrow">KOVIAN FINANCE</span><h1>{t('forecastTitle')}</h1><p>{t('forecastDesc')}</p></div><label className="secondary"><CalendarRange size={16} /><select value={days} onChange={event => setDays(Number(event.target.value) as 30 | 90 | 180 | 365)} aria-label={t('forecastHorizon')}><option value={30}>{t('daysCount', { count: 30 })}</option><option value={90}>{t('daysCount', { count: 90 })}</option><option value={180}>{t('daysCount', { count: 180 })}</option><option value={365}>{t('daysCount', { count: 365 })}</option></select></label></section>
    {!ownerId && <div className="notice">{t('loginToLoadData')}</div>}
    {query.isError && <div className="notice" role="alert">{t('forecastError')}</div>}
    <div className="stat-grid"><article className="stat-card"><TrendingUp size={17} /><span>{t('projectedIncome')}</span><strong>{showData ? money(income) : '—'}</strong></article><article className="stat-card"><TrendingDown size={17} /><span>{t('projectedExpense')}</span><strong>{showData ? money(expense) : '—'}</strong></article><article className="stat-card"><Wallet size={17} /><span>{t('projectedEndingBalance')}</span><strong>{showData ? money(ending) : '—'}</strong></article></div>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('projection')}</span><h2>Saldo projetado</h2></div></div>
      {query.isLoading ? <div className="empty-inline">{t('loading')}</div> : !hasFiniteData ? <div className="empty-inline">{t('forecastError')}</div> : !data.length ? <div className="empty-inline">{t('noForecast')}</div> : <BalanceChart data={data} />}
    </section>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('projection')}</span><h2>{t('dailyCashFlow')}</h2></div></div>{query.isLoading ? <div className="empty-inline">{t('loading')}</div> : !hasFiniteData ? <div className="empty-inline">{t('forecastError')}</div> : !data.length ? <div className="empty-inline">{t('noForecast')}</div> : <div className="table-wrap"><table><thead><tr><th>{t('date')}</th><th>{t('income')}</th><th>{t('expense')}</th><th>{t('netFlow')}</th><th>{t('projectedBalance')}</th></tr></thead><tbody>{data.map(row => <tr key={row.date}><td>{new Date(row.date + 'T00:00:00').toLocaleDateString(document.documentElement.lang || 'pt-BR')}</td><td>{money(row.income)}</td><td>{money(row.expense)}</td><td>{money(row.netCashFlow)}</td><td>{money(row.projectedBalance)}</td></tr>)}</tbody></table></div>}</section>
  </main>
}
