import { useMemo, useState } from 'react'
import { Archive, CalendarClock, CheckCircle2, Pencil, Plus, Target, Wallet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { archiveGoal, contributeToGoal, createGoal, getGoals, updateGoal, type FinanceGoal } from '../../lib/api'
import { useFinanceOwnerId } from '../../lib/useFinanceOwnerId'
import { useFinanceMutation } from '../../lib/queries'
import { formatCurrency as money } from '../../lib/format'
import PageHeader from '../../components/ui/PageHeader'

const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}'

export default function GoalsPage() {
  const { t } = useTranslation()
  const ownerId = useFinanceOwnerId()
  const query = useQuery({ queryKey: ['finance', 'goals', ownerId], queryFn: () => getGoals(ownerId!), enabled: Boolean(ownerId), staleTime: 30_000 })
  const mutate = useFinanceMutation(async (run: () => Promise<unknown>) => run())
  const [editor, setEditor] = useState<'create' | 'edit' | 'contribute' | null>(null)
  const [selected, setSelected] = useState<FinanceGoal | null>(null)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [contribution, setContribution] = useState('')
  const [error, setError] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [busy, setBusy] = useState(false)
  const goals = query.data ?? []
  const active = goals.filter(goal => goal.active)
  const visible = showArchived ? goals : active
  const totals = useMemo(() => active.reduce((sum, goal) => ({
    target: sum.target + Number(goal.targetAmount),
    saved: sum.saved + Number(goal.currentAmount),
  }), { target: 0, saved: 0 }), [active])
  const progress = totals.target > 0 ? Math.min(100, Math.round(totals.saved / totals.target * 100)) : 0

  const openCreate = () => {
    setSelected(null); setName(''); setTargetAmount(''); setTargetDate(''); setError(''); setEditor('create')
  }
  const openEdit = (goal: FinanceGoal) => {
    setSelected(goal); setName(goal.name); setTargetAmount(String(goal.targetAmount)); setTargetDate(goal.targetDate ? goal.targetDate.slice(0, 10) : ''); setError(''); setEditor('edit')
  }
  const openContribution = (goal: FinanceGoal) => {
    setSelected(goal); setContribution(''); setError(''); setEditor('contribute')
  }
  const run = async (task: () => Promise<unknown>) => {
    if (busy) return
    setBusy(true); setError('')
    try { await mutate.mutateAsync(task); setEditor(null) }
    catch (cause) { setError(cause instanceof Error ? cause.message : t('goalsSaveError')) }
    finally { setBusy(false) }
  }
  const submitGoal = (event: React.FormEvent) => {
    event.preventDefault()
    const target = Number(targetAmount)
    if (!name.trim() || !Number.isFinite(target) || target <= 0) { setError(t('goalsValidation')); return }
    const date = targetDate ? new Date(`${targetDate}T23:59:59`).toISOString() : null
    if (editor === 'edit' && selected) void run(() => updateGoal(selected.id, { name: name.trim(), targetAmount: target, targetDate: date }))
    else if (ownerId) void run(() => createGoal({ ownerId, name: name.trim(), targetAmount: target, targetDate: date }))
  }
  const submitContribution = (event: React.FormEvent) => {
    event.preventDefault()
    const amount = Number(contribution)
    if (!selected || !Number.isFinite(amount) || amount <= 0) { setError(t('goalsContributionValidation')); return }
    if (amount > Math.max(0, Number(selected.targetAmount) - Number(selected.currentAmount))) { setError(t('goalsContributionTooLarge')); return }
    void run(() => contributeToGoal(selected.id, amount))
  }

  return <main className="page">
    <PageHeader title={t('pages.goals.title')} description={t('pages.goals.desc')} actions={<button className="primary" type="button" onClick={openCreate}><Plus size={17}/>{t('goalsNew')}</button>} />
    {!ownerId && <div className="notice" role="status">{t('loginToLoadData')}</div>}
    {query.isError && <div className="notice" role="alert">{t('financeLoadError')} <button className="text-button" type="button" onClick={() => void query.refetch()}>{t('retry')}</button></div>}
    <div className="stat-grid">
      <article className="stat-card"><Target size={17}/><span>{t('goalsTargetTotal')}</span><strong>{query.isLoading ? '—' : money(totals.target)}</strong></article>
      <article className="stat-card"><Wallet size={17}/><span>{t('goalsSavedTotal')}</span><strong>{query.isLoading ? '—' : money(totals.saved)}</strong></article>
      <article className="stat-card"><CheckCircle2 size={17}/><span>{t('goalsOverallProgress')}</span><strong>{query.isLoading ? '—' : `${progress}%`}</strong></article>
    </div>
    <section className="panel data-panel">
      <div className="section-title"><div><span className="eyebrow">{t('objectives')}</span><h2>{t('goalsListTitle')}</h2></div><button className="secondary" type="button" onClick={() => setShowArchived(value => !value)}>{showArchived ? t('goalsActiveOnly') : t('goalsShowArchived')}</button></div>
      {query.isLoading && <div className="empty-inline">{t('loading')}</div>}
      {!query.isLoading && !visible.length && <div className="empty-inline">{showArchived ? t('goalsNoArchived') : t('noActiveGoals')}</div>}
      {visible.map(goal => {
        const target = Number(goal.targetAmount); const saved = Number(goal.currentAmount)
        const percent = target > 0 ? Math.min(100, Math.round(saved / target * 100)) : 0
        const remaining = Math.max(0, target - saved)
        const days = goal.targetDate ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86_400_000) : null
        const complete = saved >= target
        return <article className="budget-row" key={goal.id}>
          <div className="budget-row-head"><span><strong>{goal.name}</strong><small>{money(saved)} / {money(target)} · {goal.targetDate ? (days !== null && days >= 0 ? t('daysRemaining', { count: days }) : t('deadlineClosed')) : t('noDeadline')}</small></span><span className={complete ? 'positive' : 'badge'}>{complete ? t('goalsCompleted') : goal.active ? `${percent}%` : t('goalsArchived')}</span></div>
          <div className="budget-progress"><span style={{ width: `${percent}%` }} /></div>
          <div className="budget-row-meta"><span>{complete ? t('goalsTargetReached') : t('missingAmount', { amount: money(remaining) })}</span><span className="header-actions">
            {goal.active && <button className="text-button" type="button" onClick={() => openContribution(goal)}>{t('goalsAddContribution')}</button>}
            {goal.active && <button className="text-button" type="button" onClick={() => openEdit(goal)} aria-label={t('goalsEdit')}><Pencil size={15}/>{t('goalsEdit')}</button>}
            {goal.active && <button className="text-button" type="button" disabled={busy} onClick={() => { if (window.confirm(t('goalsArchiveConfirm', { name: goal.name }))) void run(() => archiveGoal(goal.id)) }}><Archive size={15}/>{t('goalsArchive')}</button>}
          </span></div>
        </article>
      })}
    </section>
    {editor && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditor(null) }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="goal-dialog-title">
      <div className="modal-header"><h2 id="goal-dialog-title">{editor === 'create' ? t('goalsNew') : editor === 'edit' ? t('goalsEdit') : t('goalsAddContribution')}</h2><button type="button" className="text-button" onClick={() => setEditor(null)}>{t('close')}</button></div>
      {editor === 'contribute' ? <form className="form-grid" onSubmit={submitContribution}>
        <p>{selected?.name} · {t('goalsRemaining')}: {money(Math.max(0, Number(selected?.targetAmount ?? 0) - Number(selected?.currentAmount ?? 0)))}</p>
        <label>{t('goalsContributionAmount')}<input autoFocus type="number" min="0.01" step="0.01" value={contribution} onChange={event => setContribution(event.target.value)} required /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary form-submit" type="submit" disabled={busy}>{busy ? t('saving') : t('goalsConfirmContribution')}</button>
      </form> : <form className="form-grid" onSubmit={submitGoal}>
        <label>{t('name')}<input autoFocus maxLength={140} value={name} onChange={event => setName(event.target.value)} required /></label>
        <label>{t('targetAmount')}<input type="number" min="0.01" step="0.01" value={targetAmount} onChange={event => setTargetAmount(event.target.value)} required /></label>
        <label>{t('targetDate')}<input type="date" min={localDateKey(new Date(0))} value={targetDate} onChange={event => setTargetDate(event.target.value)} /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary form-submit" type="submit" disabled={busy}>{busy ? t('saving') : editor === 'create' ? t('goalsCreate') : t('goalsSaveChanges')}</button>
      </form>}
    </section></div>}
  </main>
}
