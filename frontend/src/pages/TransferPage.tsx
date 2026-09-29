import { useQuery } from '@tanstack/react-query'
import { ArrowRightLeft, CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { createTransfer, getAccounts, getOwnerId } from '../lib/api'
import { useFinanceMutation } from '../lib/queries'
import PageHeader from '../components/ui/PageHeader'

const money = (value:number, currency='BRL') => value.toLocaleString(document.documentElement.lang || 'pt-BR', { style:'currency', currency })

export default function TransferPage() {
  const { t } = useTranslation()
  const ownerId = getOwnerId()
  const accounts = useQuery({ queryKey:['finance','accounts',ownerId], queryFn:()=>getAccounts(ownerId!), enabled:Boolean(ownerId), staleTime:60_000 })
  const [fromAccountId,setFromAccountId]=useState('')
  const [toAccountId,setToAccountId]=useState('')
  const [amount,setAmount]=useState('')
  const [description,setDescription]=useState('')
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const [success,setSuccess]=useState(false)
  const [idempotencyKey,setIdempotencyKey]=useState<string|null>(null)
  const transferMutation = useFinanceMutation(async ({ fromAccountId, toAccountId, amount, description, idempotencyKey }: { fromAccountId: string; toAccountId: string; amount: number; description: string; idempotencyKey: string }) => createTransfer({ fromAccountId, toAccountId, amount, description }, idempotencyKey))

  const activeAccounts=(accounts.data??[]).filter(account=>account.status==='ACTIVE')
  const from=activeAccounts.find(account=>account.id===fromAccountId)
  const to=activeAccounts.find(account=>account.id===toAccountId)
  const sameCurrency=Boolean(from&&to&&from.currency===to.currency)

  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setError(null); setSuccess(false)
    const value=Number(amount)
    if(!fromAccountId||!toAccountId||fromAccountId===toAccountId||!description.trim()||!Number.isFinite(value)||value<=0) return setError(t('errorTransferRequired'))
    if(!sameCurrency) return setError(t('errorTransferCurrency'))
    if(from && value>Number(from.currentBalance)) return setError(t('errorTransferBalance'))
    setSaving(true)
    const key=idempotencyKey || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
    setIdempotencyKey(key)
    try { await transferMutation.mutateAsync({fromAccountId,toAccountId,amount:value,description:description.trim(),idempotencyKey:key}); setAmount(''); setDescription(''); setSuccess(true); setIdempotencyKey(null) }
    catch(e){ setError(e instanceof Error ? e.message.replace('FINANCE_API_',t('apiErrorPrefix')) : t('saveError')) }
    finally { setSaving(false) }
  }

  return <main className="page">
    <PageHeader title={t('transferTitle')} description={t('transferDesc')} />
    {!ownerId&&<div className="notice">{t('loginToLoadData')}</div>}
    {accounts.isError&&<div className="notice">{t('financeLoadError')}</div>}
    <section className="panel">
      <div className="section-title"><div><span className="eyebrow">{t('movements')}</span><h2>{t('newTransfer')}</h2></div><ArrowRightLeft size={18}/></div>
      <form className="form-grid" onSubmit={submit}>
        <label className="field"><span>{t('fromAccount')}</span><select value={fromAccountId} onChange={e=>setFromAccountId(e.target.value)}><option value="">{t('select')}</option>{activeAccounts.map(account=><option key={account.id} value={account.id}>{account.name} · {money(Number(account.currentBalance),account.currency)}</option>)}</select></label>
        <label className="field"><span>{t('toAccount')}</span><select value={toAccountId} onChange={e=>setToAccountId(e.target.value)}><option value="">{t('select')}</option>{activeAccounts.filter(account=>account.id!==fromAccountId).map(account=><option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label>
        <label className="field"><span>{t('amount')}</span><input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} /></label>
        <label className="field"><span>{t('description')}</span><input value={description} maxLength={240} onChange={e=>setDescription(e.target.value)} placeholder={t('placeholderTransfer')} /></label>
        {from&&to&&!sameCurrency&&<div className="form-error" role="alert">{t('errorTransferCurrency')}</div>}
        {error&&<div className="form-error" role="alert">{error}</div>}
        {success&&<div className="notice" role="status"><CheckCircle2 size={18}/><span>{t('transferSuccess')}</span></div>}
        <button type="submit" className="primary form-submit" disabled={saving||accounts.isLoading}>{saving?t('processing'):t('createTransfer')}</button>
      </form>
    </section>
  </main>
}
