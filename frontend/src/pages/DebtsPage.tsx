import { useQuery } from '@tanstack/react-query'
import { CreditCard, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getDebts, getOwnerId } from '../lib/api'

const money=(value:number)=>value.toLocaleString(document.documentElement.lang||'pt-BR',{style:'currency',currency:'BRL'})

export default function DebtsPage(){
  const {t}=useTranslation()
  const ownerId=getOwnerId()
  const q=useQuery({queryKey:['finance','debts',ownerId],queryFn:()=>getDebts(ownerId!),enabled:Boolean(ownerId),staleTime:60_000})
  const debts=q.data??[]
  const outstanding=debts.filter(x=>x.status!=='PAID').reduce((s,x)=>s+Number(x.outstandingAmount||0),0)
  return <main className="page">
    <section className="page-header"><div><span className="eyebrow">KOVIAN FINANCE</span><h1>{t('debtsTitle')}</h1><p>{t('debtsDesc')}</p></div></section>
    {!ownerId&&<div className="notice">{t('loginToLoadData')}</div>}{q.isError&&<div className="notice">{t('debtsError')}</div>}
    <div className="stat-grid"><article className="stat-card"><TrendingDown size={17}/><span>{t('outstandingDebt')}</span><strong>{q.isLoading?'—':money(outstanding)}</strong></article><article className="stat-card"><CreditCard size={17}/><span>{t('activeDebtCount')}</span><strong>{q.isLoading?'—':String(debts.filter(x=>x.status!=='PAID').length)}</strong></article></div>
    <section className="panel"><div className="section-title"><div><span className="eyebrow">{t('debts')}</span><h2>{t('debtList')}</h2></div></div>
      {debts.map(x=><article className="feature-card" key={x.id}><div className="feature-icon"><CreditCard size={18}/></div><div><strong>{x.name}</strong><span>{x.debtType} · {x.totalInstallments} {t('installments').toLowerCase()}</span><small>{t('outstandingDebt')}: {money(x.outstandingAmount)} · {x.status}</small></div></article>)}
      {!q.isLoading&&!debts.length&&<div className="empty-inline">{t('noDebts')}</div>}
    </section>
  </main>
}
