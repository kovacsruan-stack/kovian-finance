import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileCheck2, LockKeyhole, RefreshCw } from 'lucide-react'
import { getReconciliationHistory, type ReconciliationRun } from './lib/api'
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

function formatAmount(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(value)
}

export default function ControlPlane() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('close')
  const [runs, setRuns] = useState<ReconciliationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => { void loadReconciliation() }, [])

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
      <Card icon={LockKeyhole} title={t('currentPeriod')} value={t('currentMonth')}
        detail={runs[0] ? '{t('lastRun')+' '}' + runs[0].status.toLowerCase() : '{t('noRunRecorded')}'} />
      <Card icon={RefreshCw} title={t('reconciliation')} value={loading ? '...' : String(exceptionCount)}
        detail={loading ? '{t('loading')}' : runs.length + ' {t('runsRecorded')}'} />
      <Card icon={Download} title={t('exports')} value={t('controlled')} detail={t('exportDetail')} />
    </div>

    <div className="tabs">
      <button className={tab === 'close' ? 'active' : ''} onClick={() => setTab('close')} type="button">{t('close')}</button>
      <button className={tab === 'recon' ? 'active' : ''} onClick={() => setTab('recon')} type="button">{t('reconciliation')}</button>
      <button className={tab === 'exports' ? 'active' : ''} onClick={() => setTab('exports')} type="button">{t('exports')}</button>
    </div>

    {tab === 'close' && <div className="control-card">
      <div><b>{t('currentMonth')}</b><span>{t('periodDates')}</span></div>
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
        <button className="secondary" onClick={() => void loadReconciliation()} type="button" disabled={loading}><RefreshCw size={15}/>{t('refresh')}</button>
      </div>

      {error && <div className="exception"><AlertTriangle/><div><b>{t('loadFailure')}</b><span>{error}</span></div></div>}
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
