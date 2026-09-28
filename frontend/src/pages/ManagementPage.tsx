import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Check, ClipboardList, CreditCard, GraduationCap, Plus, Users } from 'lucide-react'
import {
  archiveManagementRecord,
  createManagementRecord,
  getManagementRecords,
  type ManagementRecord,
  type ManagementResource,
} from '../lib/api'

const tabs: Array<{ id: ManagementResource; label: string; icon: typeof Users }> = [
  { id: 'students', label: 'Alunos', icon: Users },
  { id: 'modalities', label: 'Modalidades', icon: GraduationCap },
  { id: 'lessons', label: 'Aulas', icon: ClipboardList },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
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
  if (resource === 'lessons') return [
    ['date', 'Data', 'date'], ['time', 'Horário', 'time'], ['modality', 'Modalidade', 'text'],
    ['status', 'Status', 'text'], ['notes', 'Observações', 'text'],
  ] as const
  return [
    ['amount', 'Valor (R$)', 'number'], ['dueDate', 'Vencimento', 'date'],
    ['paidDate', 'Data do pagamento', 'date'], ['status', 'Status', 'text'], ['notes', 'Observações', 'text'],
  ] as const
}

function recordTitle(record: ManagementRecord, resource: ManagementResource) {
  const data = record.data
  if (resource === 'lessons' || resource === 'payments') return String(data.studentName ?? data.student ?? data.name ?? 'Registro')
  return String(data.name ?? data.description ?? 'Registro')
}

export default function ManagementPage() {
  const queryClient = useQueryClient()
  const [resource, setResource] = useState<ManagementResource>('students')
  const [formOpen, setFormOpen] = useState(false)
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
    enabled: resource === 'lessons' || resource === 'payments',
  })
  const modalitiesQuery = useQuery({
    queryKey: ['finance', 'management', 'modalities', false],
    queryFn: () => getManagementRecords('modalities'),
    enabled: resource === 'students' || resource === 'lessons',
  })
  const save = useMutation({
    mutationFn: () => {
      const data: Record<string, unknown> = { ...form }
      if (resource === 'lessons' || resource === 'payments') {
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
      if ((resource === 'lessons' || resource === 'payments') && !form.studentId) throw new Error('Selecione um aluno.')
      return createManagementRecord(resource, data)
    },
    onSuccess: async () => {
      setForm({})
      setFormOpen(false)
      setNotice('Registro salvo.')
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
  const records = query.data ?? []
  const activeStudents = useMemo(() => (studentsQuery.data ?? []).filter(item => !item.archived), [studentsQuery.data])
  const fields = fieldsFor(resource)
  const Icon = tabs.find(tab => tab.id === resource)?.icon ?? Users

  return <main className="page">
    <section className="page-header">
      <div>
        <span className="eyebrow">KOVIAN FINANCE · GESTÃO</span>
        <h1>Gestão de alunos</h1>
        <p>Cadastros, modalidades, aulas e pagamentos no mesmo ambiente do Finance.</p>
      </div>
      <button type="button" className="primary" onClick={() => { setForm({ ...(resource === 'lessons' ? { date: today(), status: 'Agendada' } : resource === 'payments' ? { dueDate: today(), status: 'Pendente' } : {}) }); setFormOpen(v => !v); setNotice('') }}>
        <Plus size={16} /> Novo registro
      </button>
    </section>

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
      <h2>{resource === 'students' ? 'Novo aluno' : resource === 'modalities' ? 'Nova modalidade' : resource === 'lessons' ? 'Registrar aula' : 'Registrar pagamento'}</h2>
      <div className="form-grid">
        {(resource === 'lessons' || resource === 'payments') && <label>
          Aluno
          <select required value={form.studentId ?? ''} onChange={event => setForm(previous => ({ ...previous, studentId: event.target.value }))}>
            <option value="">Selecione um aluno</option>
            {activeStudents.map(student => <option key={student.id} value={student.id}>{String(student.data.name ?? 'Aluno')}</option>)}
          </select>
        </label>}
        {fields.map(([key, label, type]) => <label key={key}>
          {label}
          {key === 'modality' && (resource === 'students' || resource === 'lessons') ? (
            <select value={form[key] ?? ''} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))}>
              <option value="">Selecione uma modalidade</option>
              {(modalitiesQuery.data ?? []).filter(item => !item.archived).map(item => (
                <option key={item.id} value={String(item.data.name ?? '')}>{String(item.data.name ?? 'Modalidade')}</option>
              ))}
            </select>
          ) : (
            <input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined}
              value={form[key] ?? ''} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} />
          )}
        </label>)}
      </div>
      <div className="form-actions">
        <button type="button" className="secondary" onClick={() => { setFormOpen(false); setForm({}) }}>Cancelar</button>
        <button type="button" className="primary" disabled={save.isPending} onClick={() => save.mutate()}><Check size={16} /> {save.isPending ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </section>}

    <section className="panel data-panel">
      <div className="section-title"><div><span className="eyebrow"><Icon size={14} /></span><h2>{tabs.find(tab => tab.id === resource)?.label}</h2></div><span>{query.isLoading ? 'Carregando…' : `${records.length} registros`}</span></div>
      {query.isLoading ? <div className="empty-inline">Carregando registros…</div> : records.length === 0 ? <div className="empty-inline">Nenhum registro nesta seção.</div> : records.map(record => {
        const data = record.data
        const entries = Object.entries(data).filter(([key, value]) => !['studentId', 'studentName'].includes(key) && value !== '' && value != null)
        return <article className="account-row" key={record.id}>
          <i />
          <span className="min-w-0"><strong>{recordTitle(record, resource)}{record.archived ? ' · Arquivado' : ''}</strong>
            <small>{entries.slice(0, 4).map(([key, value]) => `${key}: ${String(value)}`).join(' · ') || 'Sem detalhes adicionais'}</small>
            {resource === 'payments' && data.status === 'Pendente' && <small>Pagamento pendente</small>}
          </span>
          {!record.archived && <button type="button" className="secondary" aria-label={`Arquivar ${recordTitle(record, resource)}`} onClick={() => {
            if (window.confirm('Arquivar este registro? Ele continuará salvo no histórico.')) archive.mutate(record.id)
          }}><Archive size={15} /> Arquivar</button>}
        </article>
      })}
    </section>
  </main>
}
