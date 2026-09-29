import { useState } from 'react'
import { FileUp, ShieldCheck } from 'lucide-react'
import { clearFinanceSession, FinanceApiError, importManagementRecords, loginFinance, type ManagementResource } from '../lib/api'
import { removeDuplicateLessons } from '../lib/managementImportNormalization'

type ImportRow = { sourceId: string; data: Record<string, unknown> }
type BackupRows = Partial<Record<ManagementResource, ImportRow[]>>

const importOrder: ManagementResource[] = [
  'students', 'modalities', 'lessons', 'payments', 'expenses', 'waitlist', 'calendar_events',
]

function extractRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  const object = value as Record<string, unknown>
  for (const key of ['records', 'items', 'results']) {
    if (Array.isArray(object[key])) return object[key] as unknown[]
  }
  if (Array.isArray(object.data)) return object.data
  return []
}

function normalizeRows(value: unknown): { rows: ImportRow[]; skipped: number } {
  const extracted = extractRows(value)
  const unique = new Map<string, ImportRow>()
  let skipped = 0
  for (const raw of extracted) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      skipped += 1
      continue
    }
    const row = raw as Record<string, unknown>
    const rawData = row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? row.data as Record<string, unknown>
      : Object.fromEntries(Object.entries(row).filter(([key]) => !['id', 'sourceId', 'createdAt', 'updatedAt', 'archived', 'isArchived'].includes(key)))
    const sourceId = String(row.sourceId ?? row.id ?? rawData.id ?? '').trim().slice(0, 120)
    if (!sourceId || !Object.keys(rawData).length) {
      skipped += 1
      continue
    }
    if (unique.has(sourceId)) {
      skipped += 1
      continue
    }
    unique.set(sourceId, { sourceId, data: rawData })
  }
  return { rows: [...unique.values()], skipped }
}

function lessonQuality(rows: ImportRow[]) {
  const groups = new Map<string, number>()
  for (const row of rows) {
    const data = row.data
    const values = [data.studentId, data.date, data.time, data.modality, data.status]
      .map(value => String(value ?? '').trim())
    if (values.some(value => !value)) continue
    const key = JSON.stringify(values)
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  const duplicateGroups = [...groups.values()].filter(count => count > 1)
  return {
    groups: duplicateGroups.length,
    records: duplicateGroups.reduce((sum, count) => sum + count, 0),
    excess: duplicateGroups.reduce((sum, count) => sum + count - 1, 0),
  }
}

function unmatchedStudentModalities(backup: BackupRows) {
  const modalityNames = new Set((backup.modalities ?? []).map(row => String(row.data.name ?? '').trim()).filter(Boolean))
  return [...new Set((backup.students ?? [])
    .map(row => String(row.data.modality ?? '').trim())
    .filter(name => name && !modalityNames.has(name)))]
}

function parseBackup(value: unknown): BackupRows | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const object = value as Record<string, unknown>
  const data = object.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const source = data as Record<string, unknown>
  const backup: BackupRows = {}
  let found = false
  for (const resource of importOrder) {
    if (!Array.isArray(source[resource])) continue
    const normalized = normalizeRows(source[resource])
    backup[resource] = resource === 'lessons' ? removeDuplicateLessons(normalized.rows) : normalized.rows
    found = true
  }
  return found ? backup : null
}

export default function ManagementImportPanel({ resource, onImported }: { resource: ManagementResource; onImported: () => void }) {
  const [rows, setRows] = useState<ImportRow[]>([])
  const [backupRows, setBackupRows] = useState<BackupRows | null>(null)
  const [filename, setFilename] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [skipped, setSkipped] = useState(0)
  const [duplicateLessonsSkipped, setDuplicateLessonsSkipped] = useState(0)
  const [authenticated, setAuthenticated] = useState(() => {
    try { return Boolean(localStorage.getItem('access_token')) } catch { return false }
  })
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (authBusy) return
    setAuthBusy(true)
    setAuthError('')
    try {
      await loginFinance(authEmail, authPassword)
      setAuthenticated(true)
      setAuthPassword('')
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setAuthBusy(false)
    }
  }

  const chooseFile = async (file?: File) => {
    setRows([])
    setBackupRows(null)
    setResult('')
    setError('')
    setFilename(file?.name ?? '')
    setSkipped(0)
    setDuplicateLessonsSkipped(0)
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('O arquivo excede 10 MB. Exporte e importe em arquivos menores.')
      return
    }
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const backup = parseBackup(parsed)
      if (backup) {
        const total = importOrder.reduce((sum, key) => sum + (backup[key]?.length ?? 0), 0)
        const rawData = (parsed as Record<string, unknown>).data as Record<string, unknown>
        const totalRaw = importOrder.reduce((sum, key) => sum + (Array.isArray(rawData[key]) ? (rawData[key] as unknown[]).length : 0), 0)
        const rawLessons = normalizeRows(rawData.lessons)
        const duplicateLessonCount = lessonQuality(rawLessons.rows).excess
        setDuplicateLessonsSkipped(duplicateLessonCount)
        setBackupRows(backup)
        setSkipped(totalRaw - total)
        if (!total) setError('O backup foi reconhecido, mas não contém registros importáveis.')
        return
      }
      const normalized = normalizeRows(parsed)
      setRows(normalized.rows)
      setSkipped(normalized.skipped)
      if (!normalized.rows.length) setError('Não encontrei registros com ID e dados. Use o JSON exportado do Gestão.')
      else if (normalized.skipped) setError(`${normalized.skipped} registro(s) sem ID/dados ou com ID repetido serão ignorados.`)
    } catch {
      setError('Arquivo inválido. Selecione um JSON de exportação do Gestão.')
    }
  }

  const runImport = async () => {
    if ((!rows.length && !backupRows) || busy) return
    setBusy(true)
    setError('')
    setResult('')
    try {
      const totals = { inserted: 0, updated: 0, unchanged: 0, unresolvedStudentLinks: 0 }
      const resources = backupRows ? importOrder : [resource]
      for (const currentResource of resources) {
        const currentRows = backupRows ? (backupRows[currentResource] ?? []) : rows
        for (let offset = 0; offset < currentRows.length; offset += 500) {
          const response = await importManagementRecords(currentResource, currentRows.slice(offset, offset + 500))
          totals.inserted += response.inserted
          totals.updated += response.updated
          totals.unchanged += response.unchanged
          totals.unresolvedStudentLinks += response.unresolvedStudentLinks
        }
      }
      const importedCount = backupRows
        ? importOrder.reduce((sum, key) => sum + (backupRows[key]?.length ?? 0), 0)
        : rows.length
      setResult(`Importação concluída (${importedCount} registro(s) processados): ${totals.inserted} novos, ${totals.updated} atualizados, ${totals.unchanged} sem alteração.${totals.unresolvedStudentLinks ? ` ${totals.unresolvedStudentLinks} vínculo(s) de aluno precisam de conferência.` : ''}`)
      setRows([])
      setBackupRows(null)
      onImported()
    } catch (cause) {
      const needsAuthentication = (cause instanceof FinanceApiError && cause.status === 401)
        || (cause instanceof Error && cause.message === 'AUTHENTICATION_REQUIRED')
      if (needsAuthentication) {
        clearFinanceSession()
        setAuthenticated(false)
        setAuthError('Sua sessão expirou ou não está autenticada. Entre novamente para continuar a importação.')
        setError('')
      } else {
        setError(cause instanceof Error ? cause.message : 'Falha na importação. Confira a conexão e tente novamente.')
      }
    } finally {
      setBusy(false)
    }
  }

  const backupCount = backupRows ? importOrder.reduce((sum, key) => sum + (backupRows[key]?.length ?? 0), 0) : 0
  const resourceSummary = backupRows
    ? importOrder.filter(key => (backupRows[key]?.length ?? 0) > 0).map(key => `${key}: ${backupRows[key]?.length}`).join(' · ')
    : `${resource}: ${rows.length}`
  const readyCount = backupRows ? backupCount : rows.length
  const unmatchedModalities = backupRows ? unmatchedStudentModalities(backupRows) : []

  return <section className="panel data-panel">
    <div className="section-title"><div><span className="eyebrow"><FileUp size={14} /></span><h2>Importar dados do Gestão antigo</h2></div></div>
    <p className="text-sm text-muted-foreground">Selecione o backup JSON completo do Gestão ou um arquivo JSON de um único recurso. A prévia não grava nada; a gravação só começa após sua confirmação.</p>
    {!authenticated && <form className="mt-3 rounded-xl border border-border p-4" onSubmit={handleLogin}>
      <h3 className="font-semibold">Autenticação necessária</h3>
      <p className="mt-1 text-sm text-muted-foreground">Entre com sua conta do KOVIAN Finance para autorizar a importação. A senha não será salva.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">E-mail
          <input className="input" type="email" autoComplete="username" required value={authEmail} onChange={event => setAuthEmail(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">Senha
          <input className="input" type="password" autoComplete="current-password" required value={authPassword} onChange={event => setAuthPassword(event.target.value)} />
        </label>
      </div>
      {authError && <p className="notice mt-3" role="alert">{authError}</p>}
      <button className="primary mt-3" type="submit" disabled={authBusy}>{authBusy ? 'Entrando…' : 'Entrar no Finance'}</button>
    </form>}
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <label className="secondary cursor-pointer"><FileUp size={15} /> Selecionar JSON<input className="sr-only" type="file" accept=".json,application/json" onChange={event => void chooseFile(event.target.files?.[0])} /></label>
      {filename && <span className="text-sm">{filename}</span>}
      {readyCount > 0 && <span className="text-sm">{readyCount} registro(s) prontos para importar</span>}
    </div>
    {error && <div className="notice mt-3" role="alert">{error}</div>}
    {result && <div className="notice mt-3" role="status">{result}</div>}
    {readyCount > 0 && <div className="mt-4 rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={17} /> Prévia de segurança</div>
      <p className="mt-2 text-sm">Destino: <strong>{backupRows ? 'backup completo do Gestão' : resource}</strong>. {resourceSummary}. IDs de origem serão usados para evitar duplicações em reimportações. {skipped > 0 ? `${skipped} registro(s) serão ignorados.` : ''}</p>
      <p className="mt-1 text-xs text-muted-foreground">No backup completo, alunos e modalidades são importados antes das aulas, para facilitar a reconciliação dos vínculos. Registros ausentes no backup não serão apagados do Finance.</p>
      {backupRows && duplicateLessonsSkipped > 0 && <div className="notice mt-3" role="alert">
        <strong>Atenção: aulas duplicadas serão ignoradas na prévia.</strong> Foram identificadas {duplicateLessonsSkipped} ocorrência(s) excedente(s) com o mesmo aluno, data, horário, modalidade e status. A importação manterá uma ocorrência por combinação e não apagará registros já existentes no Finance.
      </div>}
      {unmatchedModalities.length > 0 && <div className="notice mt-3" role="alert">
        <strong>Modalidade sem correspondência:</strong> {unmatchedModalities.join(', ')}. Os alunos serão preservados, mas essa modalidade não aparece na lista de modalidades exportada. Confira o cadastro após a importação.
      </div>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="primary" disabled={busy || !authenticated} onClick={() => void runImport()}>{busy ? 'Importando…' : !authenticated ? 'Entre para importar' : `Confirmar importação de ${readyCount} registro(s)`}</button>
        <button type="button" className="secondary" disabled={busy} onClick={() => { setRows([]); setBackupRows(null); setFilename(''); setError(''); setSkipped(0); setDuplicateLessonsSkipped(0) }}>Cancelar</button>
      </div>
    </div>}
  </section>
}
