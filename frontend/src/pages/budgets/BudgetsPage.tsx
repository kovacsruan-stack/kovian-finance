import { useMemo, useState, type FormEvent } from 'react'
import { Plus, Target, TrendingDown, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createBudget, getBudgets, getCategories, type FinanceBudget } from '../../lib/api'
import { useFinanceOwnerId } from '../../lib/useFinanceOwnerId'
import { useFinanceMutation } from '../../lib/queries'
import { formatCurrency as money } from '../../lib/format'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import Field from '../../components/ui/Field'

const dateAtStart = (value: string) => new Date(`${value}T00:00:00.000Z`).toISOString()
const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }

export default function BudgetsPage() {
  const { t } = useTranslation()
  const ownerId = useFinanceOwnerId()
  const [period, setPeriod] = useState<FinanceBudget['period']>('MONTHLY')
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(() => { const d = new Date(); d.setMonth(d.getMonth()+1, 1); d.setDate(0); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })
  const [open, setOpen] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [limit, setLimit] = useState('')
  const [start, setStart] = useState(monthStart())
  const [formPeriod, setFormPeriod] = useState<FinanceBudget['period']>('MONTHLY')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const budgetsQuery = useQuery({ queryKey: ['finance','budgets',ownerId,from,to], queryFn: () => getBudgets(ownerId!, dateAtStart(from), new Date(`${to}T23:59:59.999Z`).toISOString()), enabled: Boolean(ownerId) })
  const categoriesQuery = useQuery({ queryKey: ['finance','categories',ownerId,'EXPENSE'], queryFn: () => getCategories(ownerId!, 'EXPENSE'), enabled: Boolean(ownerId) })
  const mutate = useFinanceMutation((task: () => Promise<unknown>) => task())
  const budgets = (budgetsQuery.data ?? []).filter(b => b.period === period)
  const categories = categoriesQuery.data ?? []
  const categoryNames = useMemo(() => new Map(categories.map(c => [c.id,c.name])), [categories])
  const totals = budgets.reduce((sum,b) => ({ limit: sum.limit + Number(b.limitAmount), spent: sum.spent + Number(b.spentAmount) }), {limit:0,spent:0})
  const openCreate = () => { setCategoryId(categories[0]?.id ?? ''); setLimit(''); setStart(monthStart()); setFormPeriod(period); setError(''); setOpen(true) }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(limit)
    if (!categoryId || !Number.isFinite(amount) || amount < 0 || !start) { setError(t('budgetValidation')); return }
    setBusy(true); setError('')
    void mutate.mutateAsync(() => createBudget({ ownerId: ownerId!, categoryId, period: formPeriod, periodStart: dateAtStart(start), limitAmount: amount }))
      .then(() => setOpen(false))
      .catch(cause => setError(cause instanceof Error ? cause.message : t('budgetSaveError')))
      .finally(() => setBusy(false))
  }
  const refresh = () => { void budgetsQuery.refetch(); void categoriesQuery.refetch() }
  return <main className="page">
    <PageHeader title={t('budgetsTitle')} description={t('budgetsDescription')} actions={<button className="primary" type="button" onClick={openCreate} disabled={!categories.length}><Plus size={17}/>{t('budgetNew')}</button>} />
    {!ownerId && <div className="notice" role="status">{t('loginToLoadData')}</div>}
    {(budgetsQuery.isError || categoriesQuery.isError) && <div className="notice" role="alert">{t('financeLoadError')} <button className="text-button" onClick={refresh} type="button">{t('retry')}</button></div>}
    <div className="stat-grid">
      <article className="stat-card"><Target size={17}/><span>{t('budgetTotalLimit')}</span><strong>{budgetsQuery.isLoading ? '—' : money(totals.limit)}</strong></article>
      <article className="stat-card"><TrendingDown size={17}/><span>{t('budgetTotalSpent')}</span><strong>{budgetsQuery.isLoading ? '—' : money(totals.spent)}</strong></article>
      <article className="stat-card"><AlertTriangle size={17}/><span>{t('budgetRemainingTotal')}</span><strong>{budgetsQuery.isLoading ? '—' : money(totals.limit-totals.spent)}</strong></article>
    </div>
    <section className="panel data-panel">
      <div className="section-title"><div><span className="eyebrow">{t('planning')}</span><h2>{t('budgetsListTitle')}</h2></div>
        <div className="header-actions"><select aria-label={t('budgetPeriod')} value={period} onChange={e => setPeriod(e.target.value as FinanceBudget['period'])}><option value="WEEKLY">{t('periodWeekly')}</option><option value="MONTHLY">{t('periodMonthly')}</option><option value="YEARLY">{t('periodYearly')}</option></select><input aria-label={t('from')} type="date" value={from} onChange={e=>setFrom(e.target.value)}/><input aria-label={t('to')} type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></div>
      </div>
      {budgetsQuery.isLoading && <div className="empty-inline">{t('loading')}</div>}
      {!budgetsQuery.isLoading && !budgets.length && <div className="empty-inline">{t('budgetEmpty')}</div>}
      {budgets.map(b => { const pct = Number(b.limitAmount)>0 ? Math.round(Number(b.spentAmount)/Number(b.limitAmount)*100) : (Number(b.spentAmount)>0?100:0); const over = Number(b.spentAmount)>Number(b.limitAmount); return <article className="budget-row" key={b.id}>
        <div className="budget-row-head"><span><strong>{categoryNames.get(b.categoryId) ?? t('unknownCategory')}</strong><small>{new Date(b.periodStart).toLocaleDateString(undefined,{dateStyle:'medium'})} · {t('budgetLimit')}: {money(Number(b.limitAmount))}</small></span><span className={over?'negative':'badge'}>{pct}%</span></div>
        <div className="budget-progress"><span style={{width:`${Math.min(100,pct)}%`}}/></div>
        <div className="budget-row-meta"><span>{t('budgetSpent')}: {money(Number(b.spentAmount))}</span><span className={over?'negative':'positive'}>{over?t('budgetExceeded'):t('budgetRemaining')}: {money(Number(b.limitAmount)-Number(b.spentAmount))}</span></div>
      </article> })}
    </section>
    {open && <Modal title={t('budgetNew')} onClose={()=>setOpen(false)}><form className="form-grid" onSubmit={submit}>
      <Field label={t('category')}><select value={categoryId} onChange={e=>setCategoryId(e.target.value)} required>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label={t('budgetPeriod')}><select value={formPeriod} onChange={e=>setFormPeriod(e.target.value as FinanceBudget['period'])}><option value="WEEKLY">{t('periodWeekly')}</option><option value="MONTHLY">{t('periodMonthly')}</option><option value="YEARLY">{t('periodYearly')}</option></select></Field>
      <Field label={t('budgetPeriodStart')}><input type="date" value={start} onChange={e=>setStart(e.target.value)} required /></Field>
      <Field label={t('budgetLimit')}><input type="number" min="0" step="0.01" value={limit} onChange={e=>setLimit(e.target.value)} required /></Field>
      <p className="muted">{t('budgetNoEditNote')}</p>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary form-submit" type="submit" disabled={busy||!categories.length}>{busy?t('saving'):t('budgetCreate')}</button>
    </form></Modal>}
  </main>
}
