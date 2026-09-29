import { useMemo, useState, type FormEvent } from 'react'
import { CalendarClock, Pause, Play, Plus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createRecurring, getAccounts, getCategories, getRecurring, pauseRecurring, processRecurringDue, resumeRecurring, type FinanceRecurring } from '../../lib/api'
import { useFinanceOwnerId } from '../../lib/useFinanceOwnerId'
import { useFinanceMutation } from '../../lib/queries'
import { formatCurrency as money } from '../../lib/format'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Field from '../../components/ui/Field'

const today = () => new Date().toISOString().slice(0,10)
export default function RecurringPage() {
  const { t } = useTranslation()
  const ownerId = useFinanceOwnerId()
  const recurringQuery = useQuery({ queryKey:['finance','recurring',ownerId], queryFn:getRecurring, enabled:Boolean(ownerId) })
  const accountsQuery = useQuery({ queryKey:['finance','accounts',ownerId], queryFn:()=>getAccounts(ownerId!), enabled:Boolean(ownerId) })
  const [kind,setKind] = useState<'EXPENSE'|'INCOME'>('EXPENSE')
  const categoriesQuery = useQuery({ queryKey:['finance','categories',ownerId,kind], queryFn:()=>getCategories(ownerId!,kind), enabled:Boolean(ownerId) })
  const mutate = useFinanceMutation((task:()=>Promise<unknown>)=>task())
  const [open,setOpen] = useState(false)
  const [accountId,setAccountId] = useState('')
  const [categoryId,setCategoryId] = useState('')
  const [description,setDescription] = useState('')
  const [amount,setAmount] = useState('')
  const [frequency,setFrequency] = useState('MONTHLY')
  const [nextOccurrence,setNextOccurrence] = useState(today())
  const [endDate,setEndDate] = useState('')
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  const records = recurringQuery.data ?? []
  const accounts = accountsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const accountNames = useMemo(()=>new Map(accounts.map(a=>[a.id,a.name])),[accounts])
  const categoryNames = useMemo(()=>new Map([...categories].map(c=>[c.id,c.name])),[categories])
  const active = records.filter(r=>r.active)
  const monthlyEquivalent = active.reduce((sum,r)=>sum+Number(r.amount)*(r.frequency==='WEEKLY'?52/12:r.frequency==='YEARLY'?1/12:1),0)
  const submit=(event:FormEvent)=>{
    event.preventDefault()
    const value=Number(amount)
    if(!accountId||!description.trim()||!Number.isFinite(value)||value<=0||!nextOccurrence||(endDate&&endDate<nextOccurrence)){setError(t('recurringValidation'));return}
    setBusy(true);setError('')
    void mutate.mutateAsync(()=>createRecurring({accountId,categoryId:categoryId||null,description:description.trim(),amount:value,transactionType:kind,frequency,nextOccurrence,endDate:endDate||null}))
      .then(()=>setOpen(false)).catch(cause=>setError(cause instanceof Error?cause.message:t('recurringSaveError'))).finally(()=>setBusy(false))
  }
  const runAction=(task:()=>Promise<unknown>,success?: (value:unknown)=>void)=>{
    if(busy)return
    setBusy(true);setError('')
    void mutate.mutateAsync(task).then(value=>success?.(value)).catch(cause=>setError(cause instanceof Error?cause.message:t('recurringSaveError'))).finally(()=>setBusy(false))
  }
  const processDue=()=>{
    if(!window.confirm(t('recurringProcessConfirm',{date:today()})))return
    runAction(()=>processRecurringDue(today()),value=>window.alert(t('recurringProcessed',{count:Number(value)})))
  }
  const openCreate=()=>{setAccountId(accounts[0]?.id??'');setCategoryId('');setKind('EXPENSE');setDescription('');setAmount('');setFrequency('MONTHLY');setNextOccurrence(today());setEndDate('');setError('');setOpen(true)}
  return <main className="page">
    <PageHeader title={t('recurringTitle')} description={t('recurringDescription')} actions={<><button className="secondary" type="button" disabled={!active.length||busy} onClick={processDue}><RefreshCw size={16}/>{t('recurringProcessDue')}</button><button className="primary" type="button" onClick={openCreate} disabled={!accounts.length}><Plus size={17}/>{t('recurringNew')}</button></>} />
    {!ownerId&&<div className="notice" role="status">{t('loginToLoadData')}</div>}
    {(recurringQuery.isError||accountsQuery.isError||categoriesQuery.isError)&&<div className="notice" role="alert">{t('financeLoadError')} <button className="text-button" type="button" onClick={()=>{void recurringQuery.refetch();void accountsQuery.refetch();void categoriesQuery.refetch()}}>{t('retry')}</button></div>}
    <div className="stat-grid"><article className="stat-card"><CalendarClock size={17}/><span>{t('recurringActiveCount')}</span><strong>{recurringQuery.isLoading?'—':active.length}</strong></article><article className="stat-card"><TrendingDown size={17}/><span>{t('recurringMonthlyExpense')}</span><strong>{recurringQuery.isLoading?'—':money(active.filter(r=>r.transactionType==='EXPENSE').reduce((sum,r)=>sum+Number(r.amount)*(r.frequency==='WEEKLY'?52/12:r.frequency==='YEARLY'?1/12:1),0))}</strong></article><article className="stat-card"><TrendingUp size={17}/><span>{t('recurringMonthlyIncome')}</span><strong>{recurringQuery.isLoading?'—':money(active.filter(r=>r.transactionType==='INCOME').reduce((sum,r)=>sum+Number(r.amount)*(r.frequency==='WEEKLY'?52/12:r.frequency==='YEARLY'?1/12:1),0))}</strong></article></div>
    <section className="panel data-panel"><div className="section-title"><div><span className="eyebrow">{t('planning')}</span><h2>{t('recurringListTitle')}</h2></div><span className="badge">{t('recurringMonthlyEquivalent')}: {money(monthlyEquivalent)}</span></div>
      {recurringQuery.isLoading&&<div className="empty-inline">{t('loading')}</div>}
      {!recurringQuery.isLoading&&!records.length&&<div className="empty-inline">{t('recurringEmpty')}</div>}
      {records.map(record=><article className="budget-row" key={record.id}><div className="budget-row-head"><span><strong>{record.description}</strong><small>{accountNames.get(record.accountId)??t('account')} · {record.categoryId?(categoryNames.get(record.categoryId)??t('category')):t('uncategorized')} · {t(`frequency${record.frequency}`)}</small></span><span className={record.active?'positive':'badge'}>{record.active?t('active'):t('paused')}</span></div><div className="budget-row-meta"><span className={record.transactionType==='INCOME'?'positive':'negative'}>{record.transactionType==='INCOME'?'+':'−'} {money(Number(record.amount))}</span><span>{t('recurringNext')}: {new Date(record.nextOccurrence+'T12:00:00').toLocaleDateString()}</span></div>{record.endDate&&<small className="muted">{t('recurringEnds')}: {new Date(record.endDate+'T12:00:00').toLocaleDateString()}</small>}<div className="budget-row-meta"><span/>{record.active?<button className="text-button" type="button" disabled={busy} onClick={()=>runAction(()=>pauseRecurring(record.id))}><Pause size={15}/>{t('pause')}</button>:<button className="text-button" type="button" disabled={busy} onClick={()=>runAction(()=>resumeRecurring(record.id))}><Play size={15}/>{t('resume')}</button>}</div></article>)}
    </section>
    {open&&<Modal title={t('recurringNew')} onClose={()=>setOpen(false)}><form className="form-grid" onSubmit={submit}>
      <Field label={t('transactionType')}><select value={kind} onChange={e=>{setKind(e.target.value as 'EXPENSE'|'INCOME');setCategoryId('')}}><option value="EXPENSE">{t('expense')}</option><option value="INCOME">{t('income')}</option></select></Field>
      <Field label={t('description')}><input maxLength={255} value={description} onChange={e=>setDescription(e.target.value)} required /></Field>
      <Field label={t('amount')}><input type="number" min="0.0001" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required /></Field>
      <Field label={t('account')}><select value={accountId} onChange={e=>setAccountId(e.target.value)} required>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.currency}</option>)}</select></Field>
      <Field label={t('category')}><select value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">{t('uncategorized')}</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label={t('recurringFrequency')}><select value={frequency} onChange={e=>setFrequency(e.target.value)}><option value="WEEKLY">{t('frequencyWEEKLY')}</option><option value="MONTHLY">{t('frequencyMONTHLY')}</option><option value="YEARLY">{t('frequencyYEARLY')}</option></select></Field>
      <Field label={t('recurringNext')}><input type="date" value={nextOccurrence} onChange={e=>setNextOccurrence(e.target.value)} required /></Field>
      <Field label={t('recurringEndDate')}><input type="date" min={nextOccurrence} value={endDate} onChange={e=>setEndDate(e.target.value)} /></Field>
      {error&&<div className="form-error" role="alert">{error}</div>}
      <p className="muted">{t('recurringCreateNote')}</p>
      <button className="primary form-submit" type="submit" disabled={busy||!accounts.length}>{busy?t('saving'):t('recurringCreate')}</button>
    </form></Modal>}
  </main>
}
