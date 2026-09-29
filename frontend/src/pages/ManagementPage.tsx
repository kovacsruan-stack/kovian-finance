import { useMemo, useState } from 'react'
import ManagementImportPanel from './ManagementImportPanel'
import PageHeader from '../components/ui/PageHeader'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Check, CreditCard, GraduationCap, Pencil, Plus, Search, Users, UserPlus, Receipt } from 'lucide-react'
import {
  archiveManagementRecord,
  createManagementRecord,
  getManagementRecords,
  restoreManagementRecord,
  updateManagementRecord,
  type ManagementRecord,
  type ManagementResource,
} from '../lib/api'

const tabs: Array<{ id: ManagementResource; label: string; icon: typeof Users }> = [
  { id: 'students', label: 'Alunos', icon: Users },
  { id: 'modalities', label: 'Modalidades', icon: GraduationCap },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'expenses', label: 'Despesas', icon: Receipt },
  { id: 'waitlist', label: 'Lista de espera', icon: UserPlus },
]

const today = () => {
  const date = new Date()
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function fieldsFor(resource: ManagementResource) {
  if (resource === 'students') return [
    ['name', 'Nome', 'text'], ['phone', 'Telefone', 'tel'], ['email', 'E-mail', 'email'],
    ['modality', 'Modalidade', 'text'], ['monthlyFee', 'Mensalidade (R$)', 'number'],
    ['frequency', 'Frequência semanal', 'number'], ['dueDay', 'Dia de vencimento', 'number'],
  ] as const
  if (resource === 'modalities') return [
    ['name', 'Nome da modalidade', 'text'], ['price', 'Valor (R$)', 'number'],
    ['frequency', 'Frequência semanal', 'number'], ['description', 'Descrição', 'text'],
  ] as const
  if (resource === 'payments') return [
    ['amount', 'Valor (R$)', 'number'], ['dueDate', 'Vencimento', 'date'],
    ['paidDate', 'Data do pagamento', 'date'], ['status', 'Status', 'text'], ['notes', 'Observações', 'text'],
  ] as const
  if (resource === 'expenses') return [
    ['description', 'Descrição', 'text'], ['amount', 'Valor (R$)', 'number'],
    ['date', 'Data', 'date'], ['category', 'Categoria', 'text'], ['paymentMethod', 'Forma de pagamento', 'text'], ['notes', 'Observações', 'text'],
  ] as const
  return [
    ['name', 'Nome', 'text'], ['phone', 'Telefone', 'tel'], ['email', 'E-mail', 'email'],
    ['modality', 'Modalidade desejada', 'text'], ['createdAt', 'Data de entrada', 'date'], ['status', 'Status', 'text'], ['notes', 'Observações', 'text'],
  ] as const
}

function recordTitle(record: ManagementRecord, resource: ManagementResource) {
  const data = record.data
  if (resource === 'payments') return String(data.studentName ?? data.student ?? data.name ?? 'Registro')
  if (resource === 'expenses') return String(data.description ?? data.name ?? 'Despesa')
  return String(data.name ?? data.description ?? 'Registro')
}

export default function ManagementPage() {
  const queryClient = useQueryClient()
  const [resource, setResource] = useState<ManagementResource>('students')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ManagementRecord | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})
  const [showArchived, setShowArchived] = useState(false)
  const [notice, setNotice] = useState('')
  const query = useQuery({
    queryKey: ['finance', 'management', resource, showArchived],
    queryFn: () => getManagementRecords(resource, showArchived),
    staleTime: 20_000,
  })
  const studentsQuery = useQuery({
    queryKey: ['finance', 'management', 'students', false],
    queryFn: () => getManagementRecords('students'),
    enabled: resource === 'payments',
  })
  const modalitiesQuery = useQuery({
    queryKey: ['finance', 'management', 'modalities', false],
    queryFn: () => getManagementRecords('modalities'),
    enabled: resource === 'students',
  })
  const save = useMutation({
    mutationFn: () => {
      const data: Record<string, unknown> = { ...form }
      if (resource === 'payments') {
        const student = (studentsQuery.data ?? []).find(item => item.id === form.studentId)
        if (!student) throw new Error('Selecione um aluno cadastrado.')
        data.studentId = student.id
        data.studentName = String(student.data.name ?? '')
      }
      for (const key of ['monthlyFee', 'frequency', 'dueDay', 'price', 'amount']) {
        if (typeof data[key] === 'string' && String(data[key]).trim() !== '') {
          const numeric = Number(data[key])
          if (!Number.isFinite(numeric) || numeric < 0) throw new Error('Confira os campos numéricos.')
          data[key] = numeric
        }
      }
      if (resource === 'students' && !String(data.name ?? '').trim()) throw new Error('Informe o nome do aluno.')
      if (resource === 'modalities' && !String(data.name ?? '').trim()) throw new Error('Informe o nome da modalidade.')
      if (resource === 'expenses' && !String(data.description ?? '').trim()) throw new Error('Informe a descrição da despesa.')
      if (resource === 'expenses' && (data.amount == null || data.amount === '' || Number(data.amount) <= 0)) throw new Error('Informe um valor válido para a despesa.')
      if (resource === 'waitlist' && !String(data.name ?? '').trim()) throw new Error('Informe o nome da pessoa.')
      if (resource === 'payments' && !form.studentId) throw new Error('Selecione um aluno.')
      return editing
        ? updateManagementRecord(resource, editing.id, data)
        : createManagementRecord(resource, data)
    },
    onSuccess: async () => {
      setForm({})
      setEditing(null)
      setFormOpen(false)
      setNotice(editing ? 'Alterações salvas.' : 'Registro salvo.')
      await queryClient.invalidateQueries({ queryKey: ['finance', 'management'] })
    },
    onError: error => setNotice(error instanceof Error ? error.message : 'Não foi possível salvar.'),
  })
  const archive = useMutation({
    mutationFn: (id: string) => archiveManagementRecord(resource, id),
    onSuccess: async () => {
      setNotice('Registro arquivado. O histórico foi preservado.')
      await queryClient.invalidateQueries({ queryKey: ['finance', 'management'] })
    },
    onError: () => setNotice('Não foi possível arquivar o registro.'),
  })
  const restore = useMutation({
    mutationFn: (id: string) => restoreManagementRecord(resource, id),
    onSuccess: async () => {
      setNotice('Registro restaurado.')
      await queryClient.invalidateQueries({ queryKey: ['finance', 'management'] })
    },
    onError: () => setNotice('Não foi possível restaurar o registro.'),
  })
  const records = query.data ?? []
  const visibleRecords = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) return records
    return records.filter(record => [recordTitle(record, resource), ...Object.values(record.data).map(String)]
      .some(value => value.toLocaleLowerCase('pt-BR').includes(term)))
  }, [records, resource, search])
  const activeStudents = useMemo(() => (studentsQuery.data ?? []).filter(item => !item.archived), [studentsQuery.data])
  const fields = fieldsFor(resource)
  const Icon = tabs.find(tab => tab.id === resource)?.icon ?? Users

  return <main className="page">
    <PageHeader title="Gestão" description="Organize alunos, modalidades, pagamentos, despesas e lista de espera." actions={<button type="button" className="primary" onClick={() => { setEditing(null); setForm({ ...(resource === 'payments' ? { dueDate: today(), status: 'Pendente' } : resource === 'expenses' ? { date: today() } : resource === 'waitlist' ? { createdAt: today(), status: 'Aguardando' } : {}) }); setFormOpen(v => !v); setNotice('') }}>
        <Plus size={16} /> Novo registro
      </button>} />

    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Seções de Gestão">
          {tabs.map(tab => {
            const TabIcon = tab.icon
            return <button key={tab.id} type="button" role="tab" aria-selected={resource === tab.id}
              className={resource === tab.id ? 'primary' : 'secondary'}
              onClick={() => { setResource(tab.id); setFormOpen(false); setForm({}); setNotice('') }}>
              <TabIcon size={16} /> {tab.label}
            </button>
          })}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} />
          Mostrar arquivados
        </label>
      </div>
    </section>

    {notice && <div className="notice" role="status" aria-live="polite">{notice}</div>}
    {(query.isError || studentsQuery.isError) && <div className="notice" role="alert">Não foi possível carregar os dados. Verifique sua sessão e tente novamente.</div>}

    {formOpen && <section className="panel form-panel">
      <h2>{editing ? 'Editar registro' : resource === 'students' ? 'Novo aluno' : resource === 'modalities' ? 'Nova modalidade' : resource === 'payments' ? 'Registrar pagamento' : resource === 'expenses' ? 'Registrar despesa' : 'Adicionar à lista de espera'}</h2>
      <div className="form-grid">
        {resource === 'payments' && <label>
          Aluno
          <select required value={form.studentId ?? ''} onChange={event => {
            setForm(previous => ({
              ...previous,
              studentId: event.target.value,
            }))
          }}>
            <option value="">Selecione um aluno</option>
            {activeStudents.map(student => <option key={student.id} value={student.id}>{String(student.data.name ?? 'Aluno')}</option>)}
          </select>
        </label>}
        {fields.map(([key, label, type]) => <label key={key}>
          {label}
          {key === 'status' && resource === 'payments' ? (
            <select value={form[key] ?? 'Pendente'} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))}>
              {['Pendente', 'Pago', 'Atrasado', 'Cancelado'].map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          ) : key === 'status' && resource === 'waitlist' ? (
            <select value={form[key] ?? 'Aguardando'} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))}>
              {['Aguardando', 'Contactado', 'Matriculado', 'Desistiu'].map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          ) : key === 'modality' && resource === 'students' ? (
            <>
              <input list="management-modalities" value={form[key] ?? ''} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} />
              <datalist id="management-modalities">
                {(modalitiesQuery.data ?? []).filter(item => !item.archived).map(item => (
                  <option key={item.id} value={String(item.data.name ?? '')} />
                ))}
              </datalist>
            </>
          ) : (
            <input type={type} required={key === 'name' || key === 'description' && resource === 'expenses' || key === 'date' && resource === 'expenses' || key === 'amount' && resource === 'expenses' || key === 'dueDate'}
              min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined}
              value={form[key] ?? ''} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} />
          )}
        </label>)}
      </div>
      <div className="form-actions">
        <button type="button" className="secondary" onClick={() => { setFormOpen(false); setForm({}); setEditing(null) }}>Cancelar</button>
        <button type="button" className="primary" disabled={save.isPending} onClick={() => save.mutate()}><Check size={16} /> {save.isPending ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </section>}

    <ManagementImportPanel resource={resource} onImported={() => { void queryClient.invalidateQueries({ queryKey: ['finance', 'management'] }) }} />

    <section className="panel data-panel">
      <div className="section-title"><div><span className="eyebrow"><Icon size={14} /></span><h2>{tabs.find(tab => tab.id === resource)?.label}</h2></div><span>{query.isLoading ? 'Carregando…' : `${visibleRecords.length} de ${records.length} registros`}</span></div>
      <label className="search-field flex items-center gap-2"><Search size={16} /><span className="sr-only">Buscar registros</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nome ou informação…" /></label>
      {query.isLoading ? <div className="empty-inline">Carregando registros…</div> : visibleRecords.length === 0 ? <div className="empty-inline">{search ? 'Nenhum resultado para esta busca.' : 'Nenhum registro nesta seção.'}</div> : visibleRecords.map(record => {
        const data = record.data
        const entries = Object.entries(data).filter(([key, value]) => !['studentId', 'studentName'].includes(key) && value !== '' && value != null)
        return <article className="account-row" key={record.id}>
          <i />
          <span className="min-w-0"><strong>{recordTitle(record, resource)}{record.archived ? ' · Arquivado' : ''}</strong>
            <small>{entries.slice(0, 4).map(([key, value]) => `${key}: ${String(value)}`).join(' · ') || 'Sem detalhes adicionais'}</small>
            {resource === 'payments' && data.status === 'Pendente' && <small>Pagamento pendente</small>}
          </span>
          {record.archived ? <button type="button" className="secondary" disabled={restore.isPending} onClick={() => restore.mutate(record.id)}>Restaurar</button> : <div className="flex gap-2"><button type="button" className="secondary" aria-label={`Editar ${recordTitle(record, resource)}`} onClick={() => {
            const nextForm: Record<string, string> = Object.fromEntries(Object.entries(record.data).map(([key, value]) => [key, value == null ? '' : String(value)]))
            setEditing(record)
            setForm(nextForm)
            setFormOpen(true)
            setNotice('')
          }}><Pencil size={15} /> Editar</button><button type="button" className="secondary" aria-label={`Arquivar ${recordTitle(record, resource)}`} onClick={() => {
            if (window.confirm('Arquivar este registro? Ele continuará salvo no histórico.')) archive.mutate(record.id)
          }}><Archive size={15} /> Arquivar</button></div>}
        </article>
      })}
    </section>
  </main>
}
