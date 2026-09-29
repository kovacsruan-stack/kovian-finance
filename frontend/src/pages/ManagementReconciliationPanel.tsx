import { useState } from 'react'
import { CheckCircle2, ClipboardCheck, RefreshCw, AlertTriangle } from 'lucide-react'
import { reconcileManagement, type ManagementResource, type ManagementReconciliation } from '../lib/api'

const resources: Array<{ id: ManagementResource; label: string }> = [
  { id: 'students', label: 'Alunos' },
  { id: 'modalities', label: 'Modalidades' },
  { id: 'lessons', label: 'Aulas' },
  { id: 'payments', label: 'Pagamentos' },
  { id: 'expenses', label: 'Despesas' },
  { id: 'waitlist', label: 'Lista de espera' },
  { id: 'calendar_events', label: 'Eventos do calendário' },
]

export default function ManagementReconciliationPanel() {
  const [counts, setCounts] = useState<Partial<Record<ManagementResource, string>>>({})
  const [result, setResult] = useState<ManagementReconciliation | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (busy) return
    const expectedCounts: Partial<Record<ManagementResource, number>> = {}
    for (const [resource, raw] of Object.entries(counts)) {
      if (raw == null || raw.trim() === '') continue
      const value = Number(raw)
      if (!Number.isSafeInteger(value) || value < 0) {
        setError('Informe apenas números inteiros iguais ou maiores que zero.')
        return
      }
      expectedCounts[resource as ManagementResource] = value
    }
    if (!Object.keys(expectedCounts).length) {
      setError('Informe a quantidade esperada de pelo menos um recurso.')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      setResult(await reconcileManagement(expectedCounts))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível reconciliar os dados.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="panel data-panel">
    <div className="section-title">
      <div><span className="eyebrow"><ClipboardCheck size={14} /></span><h2>Conferir migração</h2></div>
    </div>
    <p className="text-sm text-muted-foreground">Informe as quantidades do backup de origem. A conferência é somente de leitura e não altera nem apaga registros.</p>
    <div className="form-grid mt-3">
      {resources.map(item => <label key={item.id}>
        {item.label}
        <input type="number" min="0" step="1" inputMode="numeric" placeholder="Não conferir" value={counts[item.id] ?? ''}
          onChange={event => setCounts(previous => ({ ...previous, [item.id]: event.target.value }))} />
      </label>)}
    </div>
    <div className="form-actions">
      <button type="button" className="primary" disabled={busy} onClick={() => void run()}>
        <RefreshCw size={15} /> {busy ? 'Conferindo…' : 'Conferir contagens e vínculos'}
      </button>
    </div>
    {error && <div className="notice mt-3" role="alert">{error}</div>}
    {result && <>
      <div className="notice mt-3" role="status">
        {result.reconciled
          ? <><CheckCircle2 size={16} /> Contagens conferidas e nenhum vínculo de aluno pendente.</>
          : <><AlertTriangle size={16} /> A conferência encontrou diferenças ou vínculos pendentes. Revise os detalhes abaixo.</>}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className="text-left p-2">Recurso</th><th className="text-right p-2">Origem</th><th className="text-right p-2">Finance</th><th className="text-right p-2">Diferença</th></tr></thead>
          <tbody>{resources.filter(item => result.resources[item.id]?.expectedCount >= 0).map(item => {
            const row = result.resources[item.id]
            return <tr key={item.id} className="border-t border-border">
              <td className="p-2">{item.label}</td>
              <td className="p-2 text-right">{row.expectedCount}</td>
              <td className="p-2 text-right">{row.actualCount}</td>
              <td className="p-2 text-right">{row.delta == null ? '—' : row.delta > 0 ? `+${row.delta}` : row.delta}</td>
            </tr>
          })}</tbody>
        </table>
      </div>
      <p className="mt-2 text-sm">Vínculos de aluno pendentes: <strong>{result.unresolvedStudentLinks}</strong></p>
      <p className="mt-1 text-xs text-muted-foreground">A API conta todos os registros do recurso no Finance, inclusive arquivados. Se já existiam dados antes da migração, considere isso ao comparar os totais.</p>
    </>}
  </section>
}
