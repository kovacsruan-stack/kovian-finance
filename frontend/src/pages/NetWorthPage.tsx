import { useQuery } from '@tanstack/react-query'
import { useFinanceOwnerId } from '../lib/useFinanceOwnerId'
import { Landmark, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { getAssets, getDebts, getFinancialSnapshots, getLiabilities } from '../lib/api'
import { useTranslation } from 'react-i18next'
import { formatCurrency as money } from '../lib/format'
import PageHeader from '../components/ui/PageHeader'


export default function NetWorthPage(){
  const {t}=useTranslation()
  const ownerId=useFinanceOwnerId()
  const assets=useQuery({queryKey:['finance','assets',ownerId],queryFn:()=>getAssets(ownerId!),enabled:Boolean(ownerId),staleTime:60_000,retry:2})
  const liabilities=useQuery({queryKey:['finance','liabilities',ownerId],queryFn:()=>getLiabilities(ownerId!),enabled:Boolean(ownerId),staleTime:60_000})
  const debts=useQuery({queryKey:['finance','debts',ownerId],queryFn:()=>getDebts(ownerId!),enabled:Boolean(ownerId),staleTime:60_000})
  const snapshots=useQuery({queryKey:['finance','snapshots',ownerId],queryFn:getFinancialSnapshots,enabled:Boolean(ownerId),staleTime:60_000})
  const assetTotal=(assets.data??[]).reduce((s,x)=>s+Number(x.currentValue||0),0)
  const liabilityTotal=(liabilities.data??[]).reduce((s,x)=>s+Number(x.amount||0),0)
  const debtTotal=(debts.data??[]).filter(x=>x.status!=='PAID').reduce((s,x)=>s+Number(x.outstandingAmount||0),0)
  const totalObligations=liabilityTotal+debtTotal
  const netWorth=assetTotal-totalObligations
  const loading=assets.isLoading||liabilities.isLoading||debts.isLoading
  const snapshotHistory=(snapshots.data??[]).slice().sort((a,b)=>b.snapshotDate.localeCompare(a.snapshotDate))
  return <main className="page">
    <PageHeader title={t('netWorthTitle')} description={t('netWorthDesc')} />
    {!ownerId&&<div className="notice">{t('loginToLoadData')}</div>}
    {(assets.isError||liabilities.isError||debts.isError||snapshots.isError)&&<div className="notice">{t('netWorthError')}</div>}
    <div className="stat-grid">
      <article className="stat-card"><TrendingUp size={17}/><span>{t('assets')}</span><strong>{loading?'—':money(assetTotal)}</strong></article>
      <article className="stat-card"><TrendingDown size={17}/><span>{t('liabilities')}</span><strong>{loading?'—':money(liabilityTotal)}</strong></article>
      <article className="stat-card"><Wallet size={17}/><span>{t('netWorth')}</span><strong>{loading?'—':money(netWorth)}</strong></article>
      <article className="stat-card"><TrendingDown size={17}/><span>{t('debts')}</span><strong>{loading?'—':money(debtTotal)}</strong></article>
    </div>
    <div className="dashboard-grid">
      <section className="panel data-panel"><div className="section-title"><div><span className="eyebrow">{t('assets')}</span><h2>{t('assetList')}</h2></div></div>
        {(assets.data??[]).map(x=><div className="account-row" key={x.id}><i/><span><strong>{x.name}</strong><small>{x.assetType} · {x.liquidity}</small></span><b>{money(x.currentValue)}</b></div>)}
        {!loading&&!assets.isError&&!assets.data?.length&&<div className="empty-inline">{t('noAssets')}</div>}
      </section>
      <section className="panel data-panel"><div className="section-title"><div><span className="eyebrow">{t('liabilities')}</span><h2>{t('liabilityList')}</h2></div></div>
        {(liabilities.data??[]).map(x=><div className="account-row" key={x.id}><i/><span><strong>{x.name}</strong><small>{x.liabilityType}</small></span><b>{money(x.amount)}</b></div>)}
        {!loading&&!liabilities.isError&&!liabilities.data?.length&&<div className="empty-inline">{t('noLiabilities')}</div>}
      </section>
    </div>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('analysis')}</span><h2>{t('netWorthMethod')}</h2></div><Landmark size={18}/></div><p>{t('netWorthFormula',{assets:money(assetTotal),liabilities:money(liabilityTotal),netWorth:money(netWorth)})}</p><p>{t('debtObligationNote',{debts:money(debtTotal),total:money(totalObligations)})}</p></section>
    <section className="panel data-panel"><div className="section-title"><div><span className="eyebrow">{t('history')}</span><h2>{t('netWorthHistory')}</h2></div></div>{snapshots.isLoading&&<div className="empty-inline">{t('loading')}</div>}{snapshotHistory.slice(0,12).map(snapshot=><div className="account-row" key={snapshot.id}><i/><span><strong>{new Date(`${snapshot.snapshotDate}T00:00:00`).toLocaleDateString(document.documentElement.lang||'pt-BR')}</strong><small>{t('income')}: {money(snapshot.totalIncome)} · {t('expense')}: {money(snapshot.totalExpense)}</small></span><b>{money(snapshot.netWorth)}</b></div>)}{!snapshots.isLoading&&!snapshots.isError&&!snapshotHistory.length&&<div className="empty-inline">{t('noSnapshotHistory')}</div>}</section>
  </main>
}
