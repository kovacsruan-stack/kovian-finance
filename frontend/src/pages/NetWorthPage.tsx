import { useQuery } from '@tanstack/react-query'
import { Landmark, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { getAssets, getDebts, getLiabilities, getOwnerId } from '../lib/api'
import { useTranslation } from 'react-i18next'

const money=(value:number)=>value.toLocaleString(document.documentElement.lang||'pt-BR',{style:'currency',currency:'BRL'})

export default function NetWorthPage(){
  const {t}=useTranslation()
  const ownerId=getOwnerId()
  const assets=useQuery({queryKey:['finance','assets',ownerId],queryFn:()=>getAssets(ownerId!),enabled:Boolean(ownerId),staleTime:60_000})
  const liabilities=useQuery({queryKey:['finance','liabilities',ownerId],queryFn:()=>getLiabilities(ownerId!),enabled:Boolean(ownerId),staleTime:60_000})
  const debts=useQuery({queryKey:['finance','debts',ownerId],queryFn:()=>getDebts(ownerId!),enabled:Boolean(ownerId),staleTime:60_000})
  const assetTotal=(assets.data??[]).reduce((s,x)=>s+Number(x.currentValue||0),0)
  const liabilityTotal=(liabilities.data??[]).reduce((s,x)=>s+Number(x.amount||0),0)
  const debtTotal=(debts.data??[]).filter(x=>x.status!=='PAID').reduce((s,x)=>s+Number(x.outstandingAmount||0),0)
  const totalObligations=liabilityTotal+debtTotal
  const netWorth=assetTotal-totalObligations
  const loading=assets.isLoading||liabilities.isLoading||debts.isLoading
  return <main className="page">
    <section className="page-header"><div><span className="eyebrow">KOVIAN FINANCE</span><h1>{t('netWorthTitle')}</h1><p>{t('netWorthDesc')}</p></div></section>
    {!ownerId&&<div className="notice">{t('loginToLoadData')}</div>}
    {(assets.isError||liabilities.isError)&&<div className="notice">{t('netWorthError')}</div>}
    <div className="stat-grid">
      <article className="stat-card"><TrendingUp size={17}/><span>{t('assets')}</span><strong>{loading?'—':money(assetTotal)}</strong></article>
      <article className="stat-card"><TrendingDown size={17}/><span>{t('liabilities')}</span><strong>{loading?'—':money(liabilityTotal)}</strong></article>
      <article className="stat-card"><Wallet size={17}/><span>{t('netWorth')}</span><strong>{loading?'—':money(netWorth)}</strong></article>
      <article className="stat-card"><TrendingDown size={17}/><span>{t('debts')}</span><strong>{loading?'—':money(debtTotal)}</strong></article>
    </div>
    <div className="dashboard-grid">
      <section className="panel data-panel"><div className="section-title"><div><span className="eyebrow">{t('assets')}</span><h2>{t('assetList')}</h2></div></div>
        {(assets.data??[]).map(x=><div className="account-row" key={x.id}><i/><span><strong>{x.name}</strong><small>{x.assetType} · {x.liquidity}</small></span><b>{money(x.currentValue)}</b></div>)}
        {!loading&&!assets.data?.length&&<div className="empty-inline">{t('noAssets')}</div>}
      </section>
      <section className="panel data-panel"><div className="section-title"><div><span className="eyebrow">{t('liabilities')}</span><h2>{t('liabilityList')}</h2></div></div>
        {(liabilities.data??[]).map(x=><div className="account-row" key={x.id}><i/><span><strong>{x.name}</strong><small>{x.liabilityType}</small></span><b>{money(x.amount)}</b></div>)}
        {!loading&&!liabilities.data?.length&&<div className="empty-inline">{t('noLiabilities')}</div>}
      </section>
    </div>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('analysis')}</span><h2>{t('netWorthMethod')}</h2></div><Landmark size={18}/></div><p>{t('netWorthFormula',{assets:money(assetTotal),liabilities:money(liabilityTotal),netWorth:money(netWorth)})}</p><p>{t('debtObligationNote',{debts:money(debtTotal),total:money(totalObligations)})}</p></section>
  </main>
}
