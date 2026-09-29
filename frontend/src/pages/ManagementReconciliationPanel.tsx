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
  const [sourceIdsJson, setSourceIdsJson] = useState('')
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
    if (!Object.keys(expectedCounts).length && !sourceIdsJson.trim()) {
      setError('Informe uma quantidade esperada ou um conjunto de IDs de origem.')
      return
    }
    let expectedSourceIds: Partial<Record<ManagementResource, string[]>> = {}
    if (sourceIdsJson.trim()) {
      try {
        const parsed = JSON.parse(sourceIdsJson) as unknown
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
        expectedSourceIds = Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([resource, ids]) => {
          if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !id.trim())) throw new Error()
          return [resource, ids.map(id => id.trim())]
        })) as Partial<Record<ManagementResource, string[]>>
      } catch {
        setError('IDs de origem inválidos. Use JSON no formato {"students":["id-1","id-2"]}.')
        return
      }
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      setResult(await reconcileManagement(expectedCounts, expectedSourceIds))
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
    <label className="field mt-3">
      IDs de origem (opcional)
      <textarea rows={4} value={sourceIdsJson} onChange={event => setSourceIdsJson(event.target.value)} placeholder={'{"students":["legacy-1","legacy-2"],"lessons":["lesson-1"]}'} />
      <span className="text-xs text-muted-foreground">Use esta conferência quando precisar validar os identificadores exatos do backup, não apenas as contagens.</span>
    </label>
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
      {Object.entries(result.sourceIds).length > 0 && <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left p-2">IDs de origem</th><th className="text-right p-2">Esperados</th><th className="text-right p-2">Encontrados</th><th className="text-right p-2">Faltantes</th><th className="text-right p-2">Extras</th></tr></thead><tbody>{resources.filter(item => result.sourceIds[item.id]).map(item => { const row = result.sourceIds[item.id]; return <tr key={item.id} className="border-t border-border"><td className="p-2">{item.label}</td><td className="p-2 text-right">{row.expectedCount}</td><td className="p-2 text-right">{row.actualCount}</td><td className="p-2 text-right">{row.missingCount}</td><td className="p-2 text-right">{row.unexpectedCount}</td></tr>})}</tbody></table></div>}
      <p className="mt-1 text-xs text-muted-foreground">A API conta todos os registros do recurso no Finance, inclusive arquivados. Se já existiam dados antes da migração, considere isso ao comparar os totais.</p>
    </>}
  </section>
}
