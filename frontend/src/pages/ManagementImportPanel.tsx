import { useState } from 'react'
import { FileUp, ShieldCheck } from 'lucide-react'
import { importManagementRecords, type ManagementResource } from '../lib/api'

type ImportRow = { sourceId: string; data: Record<string, unknown> }

function extractRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  const object = value as Record<string, unknown>
  for (const key of ['records', 'items', 'data', 'results']) {
    if (Array.isArray(object[key])) return object[key] as unknown[]
  }
  return []
}

function normalizeRows(value: unknown): ImportRow[] {
  return extractRows(value).flatMap((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
    const row = raw as Record<string, unknown>
    const rawData = row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? row.data as Record<string, unknown>
      : Object.fromEntries(Object.entries(row).filter(([key]) => !['id', 'sourceId', 'createdAt', 'updatedAt', 'archived', 'isArchived'].includes(key)))
    const sourceId = String(row.sourceId ?? row.id ?? rawData.id ?? '')
    if (!sourceId || !Object.keys(rawData).length) return []
    return [{ sourceId: sourceId.slice(0, 120), data: rawData }]
  }).filter(row => row.sourceId.length > 0)
}

export default function ManagementImportPanel({ resource, onImported }: { resource: ManagementResource; onImported: () => void }) {
  const [rows, setRows] = useState<ImportRow[]>([])
  const [filename, setFilename] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [skipped, setSkipped] = useState(0)

  const chooseFile = async (file?: File) => {
    setRows([])
    setResult('')
    setError('')
    setFilename(file?.name ?? '')
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('O arquivo excede 10 MB. Exporte e importe em arquivos menores.')
      return
    }
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const normalized = normalizeRows(parsed)
      const rawCount = extractRows(parsed).length
      const unique = new Map<string, ImportRow>()
      normalized.forEach(row => unique.set(row.sourceId, row))
      setRows([...unique.values()])
      setSkipped(rawCount - unique.size)
      if (!unique.size) setError('Não encontrei registros com ID e dados. Use o JSON exportado do Gestão.')
      else if (rawCount !== unique.size) setError(`${rawCount - unique.size} registro(s) sem ID/dados ou com ID repetido serão ignorados.`)
    } catch {
      setError('Arquivo inválido. Selecione um JSON de exportação do Gestão.')
    }
  }

  const runImport = async () => {
    if (!rows.length || busy) return
    setBusy(true)
    setError('')
    setResult('')
    try {
      let inserted = 0
      let updated = 0
      let unchanged = 0
      let unresolvedStudentLinks = 0
      for (let offset = 0; offset < rows.length; offset += 500) {
        const batch = rows.slice(offset, offset + 500)
        const response = await importManagementRecords(resource, batch)
        inserted += response.inserted
        updated += response.updated
        unchanged += response.unchanged
        unresolvedStudentLinks += response.unresolvedStudentLinks
      }
      setResult(`Importação concluída: ${inserted} novos, ${updated} atualizados, ${unchanged} sem alteração.${unresolvedStudentLinks ? ` ${unresolvedStudentLinks} vínculo(s) de aluno precisam de conferência.` : ''}`)
      setRows([])
      onImported()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha na importação. Confira a conexão e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="panel data-panel">
    <div className="section-title"><div><span className="eyebrow"><FileUp size={14} /></span><h2>Importar dados do Gestão antigo</h2></div></div>
    <p className="text-sm text-muted-foreground">Importe o JSON exportado do recurso selecionado no Gestão. A prévia não grava nada; a gravação só começa após sua confirmação.</p>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <label className="secondary cursor-pointer"><FileUp size={15} /> Selecionar JSON<input className="sr-only" type="file" accept=".json,application/json" onChange={event => void chooseFile(event.target.files?.[0])} /></label>
      {filename && <span className="text-sm">{filename}</span>}
      {rows.length > 0 && <span className="text-sm">{rows.length} registro(s) prontos para importar</span>}
    </div>
    {error && <div className="notice mt-3" role="alert">{error}</div>}
    {result && <div className="notice mt-3" role="status">{result}</div>}
    {rows.length > 0 && <div className="mt-4 rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={17} /> Prévia de segurança</div>
      <p className="mt-2 text-sm">Destino: <strong>{resource}</strong>. IDs de origem serão usados para evitar duplicações em reimportações. {skipped > 0 ? `${skipped} registro(s) foram ignorados.` : ''}</p>
      <p className="mt-1 text-xs text-muted-foreground">Importe primeiro alunos e modalidades. Depois importe aulas e pagamentos para que os vínculos possam ser reconciliados.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="primary" disabled={busy} onClick={() => void runImport()}>{busy ? 'Importando…' : `Confirmar importação de ${rows.length} registro(s)`}</button>
        <button type="button" className="secondary" disabled={busy} onClick={() => { setRows([]); setFilename(''); setError(''); setSkipped(0) }}>Cancelar</button>
      </div>
    </div>}
  </section>
}
