import { useMemo, useState } from 'react'
import { useFinanceOwnerId } from '../lib/useFinanceOwnerId'
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Download } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccounts, getRecurring, getTransactions, getManagementRecords, importManagementRecords, createManagementRecord, updateManagementRecord, type FinanceAccount, type FinanceRecurring, type FinanceTransaction, type ManagementRecord } from '../lib/api'
import { useTranslation } from 'react-i18next'
import { getRecurringOccurrencesInRange } from '../lib/calendarEvents'
import { formatCurrency as money } from '../lib/format'
import { expandCalendarEventDates, parseCalendarFile, type ImportedCalendarLesson } from '../lib/fitnessCalendarImport'
import PageHeader from '../components/ui/PageHeader'

const localeSafeLocale = () => document.documentElement.lang || 'pt-BR'
const iso = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)
const daysInMonth = (date: Date) => endOfMonth(date).getDate()
const mondayOffset = (date: Date) => (date.getDay() + 6) % 7

type CalendarEvent = { id: string; date: string; title: string; amount: number; currency: string; kind: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'RECURRING' | 'LESSON' | 'PAYMENT' | 'FITNESS'; status?: string }

function exportEventsToIcs(events: CalendarEvent[]) {
  const escapeIcs = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KOVIAN//Finance Calendar//PT',
    'CALSCALE:GREGORIAN',
    ...events.map(event => [
      'BEGIN:VEVENT',
      'UID:' + escapeIcs(event.id) + '@kovian-finance',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + event.date.replace(/-/g, ''),
      'SUMMARY:' + escapeIcs(event.title),
      'DESCRIPTION:' + escapeIcs(eventKindLabel(event.kind, true) + ' · ' + money(event.amount, event.currency)),
      'END:VEVENT',
    ].join('\r\n')),
    'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'kovian-finance-calendario-' + iso(new Date()) + '.ics'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function eventKindLabel(kind: CalendarEvent['kind'], isPortuguese: boolean) {
  if (kind === 'RECURRING') return isPortuguese ? 'Recorrente' : 'Recurring'
  if (kind === 'INCOME') return isPortuguese ? 'Entrada' : 'Income'
  if (kind === 'TRANSFER') return isPortuguese ? 'Transferência' : 'Transfer'
  if (kind === 'LESSON') return isPortuguese ? 'Aula' : 'Lesson'
  if (kind === 'PAYMENT') return isPortuguese ? 'Pagamento' : 'Payment'
  if (kind === 'FITNESS') return isPortuguese ? 'Evento Fitness' : 'Fitness event'
  return isPortuguese ? 'Saída' : 'Expense'
}

export default function CalendarPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const ownerId = useFinanceOwnerId()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => iso(new Date()))
  const [kindFilter, setKindFilter] = useState<'ALL' | CalendarEvent['kind']>('ALL')
  const [eventSearch, setEventSearch] = useState('')
  const [calendarImportRows, setCalendarImportRows] = useState<ImportedCalendarLesson[]>([])
  const [calendarImportName, setCalendarImportName] = useState('')
  const [calendarImportError, setCalendarImportError] = useState('')
  const [calendarImportBusy, setCalendarImportBusy] = useState(false)
  const [calendarImportResult, setCalendarImportResult] = useState('')
  const [lessonFormOpen, setLessonFormOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<ManagementRecord | null>(null)
  const [lessonForm, setLessonForm] = useState<Record<string, string>>({})
  const [lessonFormError, setLessonFormError] = useState('')
  const [lessonFormNotice, setLessonFormNotice] = useState('')
  const from = iso(startOfMonth(month))
  const to = iso(new Date(month.getFullYear(), month.getMonth() + 1, 1))
  const transactions = useQuery({
    queryKey: ['finance', 'calendar', 'transactions', ownerId, from, to],
    queryFn: () => getTransactions(new Date(from + 'T00:00:00').toISOString(), new Date(to + 'T00:00:00').toISOString()),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  })
  const recurring = useQuery({
    queryKey: ['finance', 'calendar', 'recurring', ownerId],
    queryFn: getRecurring,
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  })
  const accounts = useQuery({
    queryKey: ['finance', 'calendar', 'accounts', ownerId],
    queryFn: () => getAccounts(ownerId!),
    enabled: Boolean(ownerId),
    staleTime: 60_000,
  })
  const lessons = useQuery({
    queryKey: ['finance', 'calendar', 'management', 'lessons', ownerId],
    queryFn: () => getManagementRecords('lessons'),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  })
  const students = useQuery({
    queryKey: ['finance', 'calendar', 'management', 'students', ownerId],
    queryFn: () => getManagementRecords('students'),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  })
  const modalities = useQuery({
    queryKey: ['finance', 'calendar', 'management', 'modalities', ownerId],
    queryFn: () => getManagementRecords('modalities'),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  })
  const expenses = useQuery({
    queryKey: ['finance', 'calendar', 'management', 'expenses', ownerId],
    queryFn: () => getManagementRecords('expenses'),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  })
  const fitnessEvents = useQuery({
    queryKey: ['finance', 'calendar', 'management', 'calendar_events', ownerId],
    queryFn: () => getManagementRecords('calendar_events'),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  })
  const payments = useQuery({
    queryKey: ['finance', 'calendar', 'management', 'payments', ownerId],
    queryFn: () => getManagementRecords('payments'),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  })

  const saveLesson = useMutation({
    mutationFn: async () => {
      const student = (students.data ?? []).find(item => item.id === lessonForm.studentId && !item.archived)
      if (!student) throw new Error('Selecione um aluno ativo.')
      if (!lessonForm.date) throw new Error('Informe a data da aula.')
      if (!lessonForm.time) throw new Error('Informe o horário da aula.')
      const data: Record<string, unknown> = {
        ...lessonForm,
        studentId: student.id,
        studentName: String(student.data.name ?? 'Aluno'),
        modality: lessonForm.modality || String(student.data.modality ?? ''),
        status: lessonForm.status || 'Agendada',
      }
      return editingLesson
        ? updateManagementRecord('lessons', editingLesson.id, data)
        : createManagementRecord('lessons', data)
    },
    onSuccess: async () => {
      setLessonFormOpen(false)
      setEditingLesson(null)
      setLessonForm({})
      setLessonFormError('')
      setLessonFormNotice('Aula salva no calendário.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['finance', 'calendar', 'management', 'lessons'] }),
        queryClient.invalidateQueries({ queryKey: ['finance', 'management', 'lessons'] }),
      ])
    },
    onError: error => setLessonFormError(error instanceof Error ? error.message : 'Não foi possível salvar a aula.'),
  })
  const openNewLesson = (date = selectedDate) => {
    setEditingLesson(null)
    setLessonForm({ date, status: 'Agendada' })
    setLessonFormError('')
    setLessonFormNotice('')
    setLessonFormOpen(true)
  }
  const openEditLesson = (id: string) => {
    const lesson = (lessons.data ?? []).find(item => item.id === id)
    if (!lesson) return
    setEditingLesson(lesson)
    setLessonForm(Object.fromEntries(Object.entries(lesson.data).map(([key, value]) => [key, value == null ? '' : String(value)])))
    setLessonFormError('')
    setLessonFormNotice('')
    setLessonFormOpen(true)
  }

  const eventLanguageIsPortuguese = (document.documentElement.lang || 'pt-BR').startsWith('pt')

  const events = useMemo<CalendarEvent[]>(() => {
    const currencyByAccount = new Map((accounts.data ?? []).map((account: FinanceAccount) => [account.id, account.currency]))
    const transactionEvents = (transactions.data ?? [])
      .filter((item: FinanceTransaction) => item.status !== 'CANCELLED')
      .map(item => ({
        id: `transaction:${item.id}`,
        date: iso(new Date(item.occurredAt)),
        title: item.description,
        amount: Number(item.amount),
        currency: currencyByAccount.get(item.accountId) || 'BRL',
        kind: item.type,
      }))
    const recurringEvents = (recurring.data ?? []).flatMap((item: FinanceRecurring) =>
      getRecurringOccurrencesInRange(item, from, to).map(occurrence => ({
        id: occurrence.occurrenceId,
        date: occurrence.occurrenceDate,
        title: item.description,
        amount: Number(item.amount),
        currency: currencyByAccount.get(item.accountId) || 'BRL',
        kind: 'RECURRING' as const,
      })),
    )
    const lessonEvents = (lessons.data ?? []).flatMap(item => {
      if (item.archived) return []
      const data = item.data
      const date = String(data.date ?? data.startDate ?? '').slice(0, 10)
      if (!date || date < from || date >= to) return []
      const status = String(data.status ?? 'Agendada')
      const cancelled = /cancelad|canceled/i.test(status)
      return [{
        id: 'lesson:' + item.id,
        date,
        title: (cancelled ? (eventLanguageIsPortuguese ? 'Aula cancelada · ' : 'Cancelled lesson · ') : (eventLanguageIsPortuguese ? 'Aula · ' : 'Lesson · ')) + String(data.studentName ?? data.student ?? 'Aluno') + (data.time ? ' · ' + String(data.time) : ''),
        amount: 0,
        currency: 'BRL',
        kind: 'LESSON' as const,
        status,
      }]
    })
    const managementExpenseEvents = (expenses.data ?? []).flatMap(item => {
      if (item.archived) return []
      const data = item.data
      const date = String(data.date ?? data.expenseDate ?? data.occurredAt ?? '').slice(0, 10)
      if (!date || date < from || date >= to) return []
      const amount = Number(String(data.amount ?? '0').replace(',', '.'))
      return [{
        id: 'management-expense:' + item.id,
        date,
        title: (eventLanguageIsPortuguese ? 'Despesa · ' : 'Expense · ') + String(data.description ?? data.name ?? 'Despesa'),
        amount: Number.isFinite(amount) ? amount : 0,
        currency: 'BRL',
        kind: 'EXPENSE' as const,
      }]
    })
    const fitnessCalendarEvents = (fitnessEvents.data ?? []).flatMap(item => {
      if (item.archived) return []
      const data = item.data
      const eventData = { ...data, date: String(data.date ?? data.startDate ?? '').slice(0, 10) }
      if (!eventData.date || /cancelad|canceled/i.test(String(data.status ?? ''))) return []
      return expandCalendarEventDates(eventData, from, to).map(date => ({
        id: 'fitness:' + item.id + ':' + date,
        date,
        title: String(data.title ?? data.summary ?? 'Evento Fitness'),
        amount: 0,
        currency: 'BRL',
        kind: 'FITNESS' as const,
      }))
    })
    const paymentEvents = (payments.data ?? []).flatMap(item => {
      const data = item.data
      const paid = /^(pago|paid)$/i.test(String(data.status ?? ''))
      const date = String((paid ? data.paidDate || data.dueDate : data.dueDate) ?? '').slice(0, 10)
      if (!date || date < from || date >= to) return []
      const amount = Number(String(data.amount ?? '0').replace(',', '.'))
      return [{
        id: 'payment:' + item.id,
        date,
        title: (eventLanguageIsPortuguese ? 'Pagamento · ' : 'Payment · ') + String(data.studentName ?? data.student ?? 'Aluno'),
        amount: Number.isFinite(amount) ? amount : 0,
        currency: 'BRL',
        kind: 'PAYMENT' as const,
      }]
    })
    return [...transactionEvents, ...recurringEvents, ...lessonEvents, ...paymentEvents, ...managementExpenseEvents, ...fitnessCalendarEvents].sort((a, b) => a.date.localeCompare(b.date))
  }, [transactions.data, recurring.data, accounts.data, lessons.data, payments.data, expenses.data, fitnessEvents.data, from, to, eventLanguageIsPortuguese])

  const visibleEvents = useMemo(() => events.filter(event => {
    const matchesKind = kindFilter === 'ALL' || event.kind === kindFilter
    const query = eventSearch.trim().toLocaleLowerCase(localeSafeLocale())
    return matchesKind && (!query || event.title.toLocaleLowerCase(localeSafeLocale()).includes(query))
  }), [events, kindFilter, eventSearch])
  const byDay = useMemo(
    () => visibleEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      (acc[event.date] ??= []).push(event)
      return acc
    }, {}),
    [visibleEvents],
  )
  const offset = mondayOffset(month)
  const cells = useMemo(
    () => Array.from({ length: offset + daysInMonth(month) }, (_, index) => index < offset ? null : index - offset + 1),
    [month, offset],
  )
  const locale = document.documentElement.lang || 'pt-BR'
  const isPortuguese = locale.startsWith('pt')
  const label = month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const monthEvents = visibleEvents.filter(event => event.date.startsWith(from.slice(0, 7)))
  const selectedEvents = byDay[selectedDate] ?? []
  const loading = transactions.isLoading || recurring.isLoading || accounts.isLoading || lessons.isLoading || payments.isLoading || expenses.isLoading || fitnessEvents.isLoading
  const today = iso(new Date())

  const moveMonth = (delta: number) => {
    const next = startOfMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1))
    setMonth(next)
    setSelectedDate(iso(next))
  }
  const goToToday = () => {
    const now = new Date()
    setMonth(startOfMonth(now))
    setSelectedDate(iso(now))
  }

  return <main className="page">
    <PageHeader title={isPortuguese ? 'Calendário financeiro' : 'Financial calendar'} description={isPortuguese ? 'Visualize movimentações e recorrências por data.' : 'Visualize transactions and recurring items by date.'} actions={<>
        <button type="button" className="secondary" aria-label={isPortuguese ? 'Mês anterior' : 'Previous month'} onClick={() => moveMonth(-1)}><ChevronLeft size={16} /></button>
        <button type="button" className="secondary" onClick={goToToday}>{isPortuguese ? 'Hoje' : 'Today'}</button>
        <button type="button" className="secondary" aria-label={isPortuguese ? 'Próximo mês' : 'Next month'} onClick={() => moveMonth(1)}><ChevronRight size={16} /></button>
        <button type="button" className="secondary" onClick={() => exportEventsToIcs(monthEvents.filter(event => event.status !== 'Cancelada' && event.status !== 'Canceled'))} disabled={!monthEvents.some(event => event.status !== 'Cancelada' && event.status !== 'Canceled')}><Download size={15} /> {isPortuguese ? 'Exportar .ics' : 'Export .ics'}</button>
      </>} />
    {!ownerId && <div className="notice" role="status" aria-live="polite"><CircleDollarSign size={17} /><span>{t('loginToLoadData')}</span></div>}
    <section className="panel data-panel">
      <div className="section-title"><div><span className="eyebrow"><CalendarDays size={12} /></span><h2>{isPortuguese ? 'Trazer agenda do Kovian Fitness' : 'Import Kovian Fitness calendar'}</h2></div></div>
      <p className="text-sm text-muted-foreground">{isPortuguese ? 'Exporte o calendário do Fitness em .ics e importe aqui. Os eventos serão salvos separadamente no calendário; revise a prévia antes de confirmar.' : 'Export the Fitness calendar as .ics and import it here. Events are stored separately in the calendar; review before confirming.'}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="secondary cursor-pointer"><Download size={15} /> {isPortuguese ? 'Selecionar arquivo .ics' : 'Choose .ics file'}<input className="sr-only" type="file" accept=".ics,text/calendar" onChange={async event => {
          const file = event.target.files?.[0]
          setCalendarImportRows([]); setCalendarImportResult(''); setCalendarImportError(''); setCalendarImportName(file?.name ?? '')
          if (!file) return
          if (file.size > 10 * 1024 * 1024) { setCalendarImportError('Arquivo maior que 10 MB.'); return }
          try {
            const rows = parseCalendarFile(await file.text())
            const unique = new Map(rows.map(row => [row.sourceId, row]))
            setCalendarImportRows([...unique.values()])
            if (!unique.size) setCalendarImportError('Nenhum evento com data reconhecível foi encontrado no .ics.')
          } catch { setCalendarImportError('Não foi possível ler esse arquivo .ics.') }
        }} /></label>
        {calendarImportName && <span className="text-sm">{calendarImportName}</span>}
        {calendarImportRows.length > 0 && <span className="text-sm">{calendarImportRows.length} evento(s) na prévia</span>}
      </div>
      {calendarImportError && <div className="notice mt-3" role="alert">{calendarImportError}</div>}
      {calendarImportResult && <div className="notice mt-3" role="status">{calendarImportResult}</div>}
      {calendarImportRows.length > 0 && <div className="mt-3 rounded-xl border border-border p-4">
        <p className="text-sm">A importação é idempotente pelo UID do evento. Os eventos importados aparecerão no calendário. Isso não recria automaticamente turmas recorrentes, presenças ou integrações Google/Outlook.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="primary" disabled={calendarImportBusy || !ownerId} onClick={async () => {
            setCalendarImportBusy(true); setCalendarImportError(''); setCalendarImportResult('')
            try {
              let inserted = 0, updated = 0, unchanged = 0, unresolvedStudentLinks = 0
              for (let offset = 0; offset < calendarImportRows.length; offset += 500) {
                const result = await importManagementRecords('calendar_events', calendarImportRows.slice(offset, offset + 500))
                inserted += result.inserted; updated += result.updated; unchanged += result.unchanged; unresolvedStudentLinks += result.unresolvedStudentLinks
              }
              setCalendarImportResult(`Importação concluída: ${inserted} novos, ${updated} atualizados, ${unchanged} sem alteração.${unresolvedStudentLinks ? ` ${unresolvedStudentLinks} vínculo(s) precisam de conferência.` : ''}`)
              setCalendarImportRows([])
              await Promise.all([fitnessEvents.refetch(), lessons.refetch(), transactions.refetch(), recurring.refetch()])
            } catch (error) { setCalendarImportError(error instanceof Error ? error.message : 'Falha ao importar calendário.') }
            finally { setCalendarImportBusy(false) }
          }}>{calendarImportBusy ? 'Importando…' : `Confirmar importação de ${calendarImportRows.length} evento(s)`}</button>
          <button type="button" className="secondary" disabled={calendarImportBusy} onClick={() => { setCalendarImportRows([]); setCalendarImportName(''); setCalendarImportError('') }}>Cancelar</button>
        </div>
      </div>}
    </section>

    <section className="panel data-panel">
      <div className="section-title">
        <div><span className="eyebrow"><CalendarDays size={12} /></span><h2>{isPortuguese ? 'Aulas' : 'Lessons'}</h2></div>
        <button type="button" className="primary" onClick={() => openNewLesson()} disabled={!ownerId}>
          {isPortuguese ? 'Agendar aula' : 'Schedule lesson'}
        </button>
      </div>
      {lessonFormNotice && <div className="notice" role="status">{lessonFormNotice}</div>}
      {lessonFormOpen && <div className="form-panel">
        <h3>{editingLesson ? (isPortuguese ? 'Editar aula' : 'Edit lesson') : (isPortuguese ? 'Nova aula' : 'New lesson')}</h3>
        <div className="form-grid">
          <label>Aluno
            <select required value={lessonForm.studentId ?? ''} onChange={event => {
              const student = (students.data ?? []).find(item => item.id === event.target.value)
              setLessonForm(previous => ({ ...previous, studentId: event.target.value, modality: String(student?.data.modality ?? previous.modality ?? '') }))
            }}>
              <option value="">Selecione um aluno</option>
              {(students.data ?? []).filter(item => !item.archived).map(student => <option key={student.id} value={student.id}>{String(student.data.name ?? 'Aluno')}</option>)}
            </select>
          </label>
          <label>Data
            <input type="date" required value={lessonForm.date ?? selectedDate} onChange={event => setLessonForm(previous => ({ ...previous, date: event.target.value }))} />
          </label>
          <label>Horário
            <input type="time" required value={lessonForm.time ?? ''} onChange={event => setLessonForm(previous => ({ ...previous, time: event.target.value }))} />
          </label>
          <label>Modalidade
            <select value={lessonForm.modality ?? ''} onChange={event => setLessonForm(previous => ({ ...previous, modality: event.target.value }))}>
              <option value="">Usar modalidade do aluno</option>
              {(modalities.data ?? []).filter(item => !item.archived).map(item => <option key={item.id} value={String(item.data.name ?? '')}>{String(item.data.name ?? 'Modalidade')}</option>)}
            </select>
          </label>
          <label>Status
            <select value={lessonForm.status ?? 'Agendada'} onChange={event => setLessonForm(previous => ({ ...previous, status: event.target.value }))}>
              {['Agendada', 'Realizada', 'Cancelada', 'Falta'].map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label>Observações
            <input value={lessonForm.notes ?? ''} onChange={event => setLessonForm(previous => ({ ...previous, notes: event.target.value }))} />
          </label>
        </div>
        {lessonFormError && <div className="notice mt-3" role="alert">{lessonFormError}</div>}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={() => { setLessonFormOpen(false); setEditingLesson(null); setLessonFormError('') }}>Cancelar</button>
          <button type="button" className="primary" disabled={saveLesson.isPending || students.isLoading} onClick={() => saveLesson.mutate()}>{saveLesson.isPending ? 'Salvando…' : 'Salvar aula'}</button>
        </div>
      </div>}
      {students.isError && <div className="notice" role="alert">Não foi possível carregar os alunos para agendar a aula.</div>}
    </section>

    {(transactions.isError || recurring.isError || accounts.isError || lessons.isError || payments.isError || expenses.isError || fitnessEvents.isError) && <div className="notice" role="alert" aria-live="assertive"><CircleDollarSign size={17} /><span>{t('financeLoadError')}</span></div>}
    <section className="panel finance-calendar">
      <div className="calendar-toolbar">
        <strong>{label.charAt(0).toUpperCase() + label.slice(1)}</strong>
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? t('loading') : (isPortuguese ? visibleEvents.length + ' eventos' : visibleEvents.length + ' events')}</span><select aria-label={isPortuguese ? 'Filtrar tipo de evento' : 'Filter event type'} value={kindFilter} onChange={event => setKindFilter(event.target.value as typeof kindFilter)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm"><option value="ALL">{isPortuguese ? 'Todos os tipos' : 'All types'}</option><option value="INCOME">{isPortuguese ? 'Entradas' : 'Income'}</option><option value="EXPENSE">{isPortuguese ? 'Saídas' : 'Expenses'}</option><option value="TRANSFER">{isPortuguese ? 'Transferências' : 'Transfers'}</option><option value="RECURRING">{isPortuguese ? 'Recorrentes' : 'Recurring'}</option><option value="LESSON">{isPortuguese ? 'Aulas' : 'Lessons'}</option><option value="PAYMENT">{isPortuguese ? 'Pagamentos' : 'Payments'}</option><option value="FITNESS">{isPortuguese ? 'Eventos Fitness' : 'Fitness events'}</option></select><input aria-label={isPortuguese ? 'Buscar evento' : 'Search events'} value={eventSearch} onChange={event => setEventSearch(event.target.value)} placeholder={isPortuguese ? 'Buscar...' : 'Search...'} className="h-9 w-32 rounded-lg border border-border bg-background px-2 text-sm" /></div>
      </div>
      <div className="calendar-weekdays">{(isPortuguese ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map(day => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">
        {cells.map((day, index) => {
          const date = day ? iso(new Date(month.getFullYear(), month.getMonth(), day)) : ''
          const items = day ? (byDay[date] ?? []) : []
          const selected = date === selectedDate
          return <div className={day ? 'calendar-cell' : 'calendar-cell calendar-cell-empty'} key={index}>
            {day && <button
              type="button"
              className={`calendar-day-button${selected ? ' selected' : ''}${date === today ? ' today' : ''}`}
              aria-pressed={selected}
              aria-label={`${new Date(date + 'T00:00:00').toLocaleDateString(locale, { dateStyle: 'full' })}, ${items.length} ${isPortuguese ? 'eventos' : 'events'}`}
              onClick={() => setSelectedDate(date)}
            >
              <span className="calendar-day">{day}</span>
              <div className="calendar-events">
                {items.slice(0, 3).map((event, i) => <div className={'calendar-event ' + event.kind.toLowerCase()} key={event.id} title={event.title}>
                  <span>{event.title}</span><b>{money(event.amount, event.currency)}</b>
                </div>)}
                {items.length > 3 && <small>+{items.length - 3}</small>}
              </div>
            </button>}
          </div>
        })}
      </div>
    </section>
    <section className="panel data-panel">
      <div className="section-title">
        <div><span className="eyebrow"><CalendarDays size={12} /></span><h2>{isPortuguese ? 'Eventos do dia' : 'Selected day events'}</h2></div>
        <span>{new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, { dateStyle: 'medium' })}</span>
      </div>
      {selectedEvents.length ? selectedEvents.map(event => {
        const lessonId = event.kind === 'LESSON' ? event.id.slice('lesson:'.length) : null
        return <div className="account-row" key={event.id}>
          <i />
          <span><strong>{event.title}</strong><small>{eventKindLabel(event.kind, isPortuguese)}</small></span>
          {lessonId && <button type="button" className="secondary" onClick={() => openEditLesson(lessonId)}>{isPortuguese ? 'Editar aula' : 'Edit lesson'}</button>}
          <b className={event.kind === 'INCOME' ? 'positive' : event.kind === 'EXPENSE' ? 'negative' : ''}>{money(event.amount, event.currency)}</b>
        </div>
      }) : <div className="empty-inline">{isPortuguese ? 'Nenhum evento nesta data.' : 'No events on this date.'}</div>}
    </section>
    <section className="panel data-panel">
      <div className="section-title"><div><span className="eyebrow"><CalendarDays size={12} /></span><h2>{isPortuguese ? 'Todos os eventos do mês' : 'All month events'}</h2></div></div>
      {monthEvents.length ? monthEvents.map((event, index) => <div className="account-row" key={event.date + event.kind + event.title + index}>
        <i />
        <span><strong>{event.title}</strong><small>{new Date(event.date + 'T00:00:00').toLocaleDateString(locale)} · {eventKindLabel(event.kind, isPortuguese)}</small></span>
        <b className={event.kind === 'INCOME' ? 'positive' : event.kind === 'EXPENSE' ? 'negative' : ''}>{money(event.amount, event.currency)}</b>
      </div>) : <div className="empty-inline">{isPortuguese ? 'Nenhum evento neste mês.' : 'No events this month.'}</div>}
    </section>
  </main>
}
