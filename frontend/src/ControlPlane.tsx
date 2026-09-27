import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileCheck2, LockKeyhole, RefreshCw } from 'lucide-react'
import { getAccounts, getOwnerId, getReconciliationHistory, reconcileAccount, type FinanceAccount, type ReconciliationRun } from './lib/api'
import { useTranslation } from 'react-i18next'

type Tab = 'close' | 'recon' | 'exports'

function Card({ icon: Icon, title, value, detail }: {
  icon: typeof CheckCircle2
  title: string
  value: string
  detail: string
}) {
  return <article className="feature-card"><Icon size={20} /><span>{title}</span><strong>{value}</strong><small>{detail}</small></article>
}

function formatAmount(value: number, currency = 'BRL') {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
  } catch {
    return new Intl.NumberFormat('pt-BR', { style: 'decimal', maximumFractionDigits: 2 }).format(value)
  }
}

function currentPeriod() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const format = (date: Date) => new Intl.DateTimeFormat('pt-BR').format(date)
  return {
    month: new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now),
    dates: `${format(start)} → ${format(end)}`,
  }
}

export default function ControlPlane() {
  const { t } = useTranslation()
  const period = currentPeriod()
  const [tab, setTab] = useState<Tab>('close')
  const [runs, setRuns] = useState<ReconciliationRun[]>([])
  const [accounts, setAccounts] = useState<FinanceAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [reconcilingAccountId, setReconcilingAccountId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function loadReconciliation() {
    setLoading(true)
    setError(null)
    try {
      setRuns(await getReconciliationHistory())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('reconciliationLoadError'))
    } finally {
      setLoading(false)
    }
  }

  async function loadAccounts() {
    const ownerId = getOwnerId()
    if (!ownerId) {
      setActionError(t('loginToLoadData'))
      setAccounts([])
      return
    }
    setAccountsLoading(true)
    setActionError(null)
    try {
      setAccounts(await getAccounts(ownerId))
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : t('reconciliationLoadError'))
    } finally {
      setAccountsLoading(false)
    }
  }

  async function runReconciliation(accountId: string) {
    setReconcilingAccountId(accountId)
    setActionError(null)
    try {
      await reconcileAccount(accountId)
      await loadReconciliation()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : t('reconciliationLoadError'))
    } finally {
      setReconcilingAccountId(null)
    }
  }

  useEffect(() => {
    void loadReconciliation()
    void loadAccounts()
  }, [])

  const exceptionCount = useMemo(
    () => runs.filter(run => Math.abs(run.difference) > 0.005).length,
    [runs],
  )

  return <div className="page">
    <div className="page-head">
      <div>
        <p className="eyebrow">KOVIAN FINANCE · CONTROL PLANE</p>
        <h1>{t('controlTitle')}</h1>
        <p className="muted">{t('controlDesc')}</p>
      </div>
      <button className="primary" onClick={() => setTab('recon')} type="button"><LockKeyhole size={17}/>{t('newReview')}</button>
    </div>

    <div className="feature-grid">
      <Card icon={LockKeyhole} title={t('currentPeriod')} value={period.month}
        detail={runs[0] ? `${t('lastRun')} ${runs[0].status.toLowerCase()}` : t('noRunRecorded')} />
      <Card icon={RefreshCw} title={t('reconciliation')} value={loading ? '...' : String(exceptionCount)}
        detail={loading ? t('loading') : `${runs.length} ${t('runsRecorded')}`} />
      <Card icon={Download} title={t('exports')} value={t('controlled')} detail={t('exportDetail')} />
    </div>

    <div className="tabs">
      <button className={tab === 'close' ? 'active' : ''} onClick={() => setTab('close')} type="button">{t('close')}</button>
      <button className={tab === 'recon' ? 'active' : ''} onClick={() => setTab('recon')} type="button">{t('reconciliation')}</button>
      <button className={tab === 'exports' ? 'active' : ''} onClick={() => setTab('exports')} type="button">{t('exports')}</button>
    </div>

    {tab === 'close' && <div className="control-card">
      <div><b>{period.month}</b><span>{period.dates}</span></div>
      <div className="status-line"><CheckCircle2/>{t('operationalReview')}</div>
      <div className="check-list">
        <span>✓ {t('backendBalances')}</span>
        <span>✓ {t('persistedReconciliations')}</span>
        <span>• {t('exceptionsBeforeClose')}</span>
      </div>
    </div>}

    {tab === 'recon' && <div className="control-card">
      <div className="row">
        <RefreshCw />
        <div><b>{t('reconciliationHistory')}</b><span>{runs.length} {t('runs')}</span></div>
        <button className="secondary" onClick={() => { void loadReconciliation(); void loadAccounts() }} type="button" disabled={loading || accountsLoading}><RefreshCw size={15}/>{t('refresh')}</button>
      </div>

      {actionError && <div className="exception" role="alert"><AlertTriangle/><div><b>{t('loadFailure')}</b><span>{actionError}</span></div></div>}
      {accountsLoading && <p className="muted">{t('loading')}</p>}
      {!accountsLoading && accounts.length === 0 && !actionError && <div className="exception"><AlertTriangle/><div><b>{t('noAccountsRegistered')}</b><span>{t('addFirstAccount')}</span></div></div>}
      {accounts.map(account => <div className="exception" key={account.id}>
        <LockKeyhole/>
        <div><b>{account.name}</b><span>{account.currency} · {formatAmount(account.currentBalance, account.currency)}</span></div>
        <button className="secondary" type="button" onClick={() => void runReconciliation(account.id)} disabled={reconcilingAccountId !== null || accountsLoading}>
          <RefreshCw size={15}/>{reconcilingAccountId === account.id ? t('loading') : t('newReview')}
        </button>
      </div>)}

      {error && <div className="exception" role="alert"><AlertTriangle/><div><b>{t('loadFailure')}</b><span>{error}</span></div></div>}
      {!loading && !error && runs.length === 0 && <div className="exception"><CheckCircle2/><div><b>{t('noReconciliation')}</b><span>{t('runFirstReconciliation')}</span></div></div>}

      {runs.map(run => <div className="exception" key={run.id}>
        <AlertTriangle/>
        <div><b>{t('account')} {run.accountId}</b><span>
          {t('expected')} {formatAmount(run.expectedBalance)} · {t('actual')} {formatAmount(run.actualBalance)} · {t('difference')} {formatAmount(run.difference)}
        </span></div>
        <strong>{run.status}</strong>
      </div>)}
    </div>}

    {tab === 'exports' && <div className="control-card">
      <div className="row"><FileCheck2/><div><b>{t('financialExports')}</b><span>{t('exportBackend')}</span></div>
        <button className="secondary" type="button" disabled><Download size={15}/>{t('availableBackend')}</button>
      </div>
      <p className="muted">{t('exportSourceOfTruth')}</p>
    </div>}
  </div>
}
