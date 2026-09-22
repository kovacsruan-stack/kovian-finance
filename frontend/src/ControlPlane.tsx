import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileCheck2, LockKeyhole, RefreshCw } from 'lucide-react'
import { getReconciliationHistory, type ReconciliationRun } from './lib/api'

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
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a reconciliação.')
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
        <h1>Fechamento e reconciliação</h1>
        <p className="muted">Controle operacional, exceções, evidências e exportações governadas.</p>
      </div>
      <button className="primary" onClick={() => setTab('recon')} type="button"><LockKeyhole size={17}/>Nova revisão</button>
    </div>

    <div className="feature-grid">
      <Card icon={LockKeyhole} title="Período atual" value="Setembro 2026"
        detail={runs[0] ? 'Última execução ' + runs[0].status.toLowerCase() : 'Nenhuma execução registrada'} />
      <Card icon={RefreshCw} title="Reconciliação" value={loading ? '...' : String(exceptionCount)}
        detail={loading ? 'Carregando' : runs.length + ' execução(ões) registradas'} />
      <Card icon={Download} title="Exports" value="Controlados" detail="Escopo, expiração e checksum" />
    </div>

    <div className="tabs">
      <button className={tab === 'close' ? 'active' : ''} onClick={() => setTab('close')} type="button">Fechamento</button>
      <button className={tab === 'recon' ? 'active' : ''} onClick={() => setTab('recon')} type="button">Reconciliação</button>
      <button className={tab === 'exports' ? 'active' : ''} onClick={() => setTab('exports')} type="button">Exportações</button>
    </div>

    {tab === 'close' && <div className="control-card">
      <div><b>Setembro 2026</b><span>01/09/2026 → 30/09/2026</span></div>
      <div className="status-line"><CheckCircle2/>Revisão operacional</div>
      <div className="check-list">
        <span>✓ Saldos e movimentos permanecem sob controle do backend</span>
        <span>✓ Reconciliações possuem histórico persistido</span>
        <span>• Exceções exigem investigação antes do fechamento</span>
      </div>
    </div>}

    {tab === 'recon' && <div className="control-card">
      <div className="row">
        <RefreshCw />
        <div><b>Histórico de reconciliação</b><span>{runs.length} execução(ões)</span></div>
        <button className="secondary" onClick={() => void loadReconciliation()} type="button" disabled={loading}><RefreshCw size={15}/>Atualizar</button>
      </div>

      {error && <div className="exception"><AlertTriangle/><div><b>Falha ao carregar dados</b><span>{error}</span></div></div>}
      {!loading && !error && runs.length === 0 && <div className="exception"><CheckCircle2/><div><b>Nenhuma reconciliação registrada</b><span>Execute a primeira reconciliação pelo fluxo operacional.</span></div></div>}

      {runs.map(run => <div className="exception" key={run.id}>
        <AlertTriangle/>
        <div><b>Conta {run.accountId}</b><span>
          Esperado {formatAmount(run.expectedBalance)} · Atual {formatAmount(run.actualBalance)} · Diferença {formatAmount(run.difference)}
        </span></div>
        <strong>{run.status}</strong>
      </div>)}
    </div>}

    {tab === 'exports' && <div className="control-card">
      <div className="row"><FileCheck2/><div><b>Exportações financeiras</b><span>Escopo, expiração e checksum controlados pelo backend.</span></div>
        <button className="secondary" type="button" disabled><Download size={15}/>Disponível no backend</button>
      </div>
      <p className="muted">O painel não fabrica dados de exportação localmente: a fonte de verdade continua sendo o domínio Finance.</p>
    </div>}
  </div>
}
