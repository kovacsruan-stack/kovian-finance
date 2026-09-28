import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAccounts, getOwnerId, getRecurring, getTransactions, getManagementRecords, type FinanceAccount, type FinanceRecurring, type FinanceTransaction } from '../lib/api'
import { useTranslation } from 'react-i18next'
import { getRecurringOccurrencesInRange } from '../lib/calendarEvents'

const localeSafeLocale = () => document.documentElement.lang || 'pt-BR'
const money = (value: number, currency = 'BRL') => value.toLocaleString(document.documentElement.lang || 'pt-BR', { style: 'currency', currency })
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

type CalendarEvent = { id: string; date: string; title: string; amount: number; currency: string; kind: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'RECURRING' | 'LESSON' | 'PAYMENT' }

function eventKindLabel(kind: CalendarEvent['kind'], isPortuguese: boolean) {
  if (kind === 'RECURRING') return isPortuguese ? 'Recorrente' : 'Recurring'
  if (kind === 'INCOME') return isPortuguese ? 'Entrada' : 'Income'
  if (kind === 'TRANSFER') return isPortuguese ? 'Transferência' : 'Transfer'
  if (kind === 'LESSON') return isPortuguese ? 'Aula' : 'Lesson'
  if (kind === 'PAYMENT') return isPortuguese ? 'Pagamento' : 'Payment'
  return isPortuguese ? 'Saída' : 'Expense'
}

export default function CalendarPage() {
  const { t } = useTranslation()
  const ownerId = getOwnerId()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => iso(new Date()))
  const [kindFilter, setKindFilter] = useState<'ALL' | CalendarEvent['kind']>('ALL')
  const [eventSearch, setEventSearch] = useState('')
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
    queryKey: ['finance', 'calendar', 'management', 'lessons'],
    queryFn: () => getManagementRecords('lessons'),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  })
  const payments = useQuery({
    queryKey: ['finance', 'calendar', 'management', 'payments'],
    queryFn: () => getManagementRecords('payments'),
    enabled: Boolean(ownerId),
    staleTime: 30_000,
  })

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
      const data = item.data
      const date = String(data.date ?? data.startDate ?? '').slice(0, 10)
      if (!date || date < from || date >= to || /cancelad|canceled/i.test(String(data.status ?? ''))) return []
      return [{
        id: 'lesson:' + item.id,
        date,
        title: ((document.documentElement.lang || 'pt-BR').startsWith('pt') ? 'Aula · ' : 'Lesson · ') + String(data.studentName ?? data.student ?? 'Aluno'),
        amount: 0,
        currency: 'BRL',
        kind: 'LESSON' as const,
      }]
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
        title: ((document.documentElement.lang || 'pt-BR').startsWith('pt') ? 'Pagamento · ' : 'Payment · ') + String(data.studentName ?? data.student ?? 'Aluno'),
        amount: Number.isFinite(amount) ? amount : 0,
        currency: 'BRL',
        kind: 'PAYMENT' as const,
      }]
    })
    return [...transactionEvents, ...recurringEvents, ...lessonEvents, ...paymentEvents].sort((a, b) => a.date.localeCompare(b.date))
  }, [transactions.data, recurring.data, accounts.data, lessons.data, payments.data, from, to])

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
  const loading = transactions.isLoading || recurring.isLoading || accounts.isLoading || lessons.isLoading || payments.isLoading
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
    <section className="page-header">
      <div>
        <span className="eyebrow">KOVIAN FINANCE</span>
        <h1>{isPortuguese ? 'Calendário financeiro' : 'Financial calendar'}</h1>
        <p>{isPortuguese ? 'Visualize movimentações e recorrências por data.' : 'Visualize transactions and recurring items by date.'}</p>
      </div>
      <div className="header-actions">
        <button type="button" className="secondary" aria-label={isPortuguese ? 'Mês anterior' : 'Previous month'} onClick={() => moveMonth(-1)}><ChevronLeft size={16} /></button>
        <button type="button" className="secondary" onClick={goToToday}>{isPortuguese ? 'Hoje' : 'Today'}</button>
        <button type="button" className="secondary" aria-label={isPortuguese ? 'Próximo mês' : 'Next month'} onClick={() => moveMonth(1)}><ChevronRight size={16} /></button>
      </div>
    </section>
    {!ownerId && <div className="notice" role="status" aria-live="polite"><CircleDollarSign size={17} /><span>{t('loginToLoadData')}</span></div>}
    {(transactions.isError || recurring.isError || accounts.isError || lessons.isError || payments.isError) && <div className="notice" role="alert" aria-live="assertive"><CircleDollarSign size={17} /><span>{t('financeLoadError')}</span></div>}
    <section className="panel finance-calendar">
      <div className="calendar-toolbar">
        <strong>{label.charAt(0).toUpperCase() + label.slice(1)}</strong>
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? t('loading') : (isPortuguese ? visibleEvents.length + ' eventos' : visibleEvents.length + ' events')}</span><select aria-label={isPortuguese ? 'Filtrar tipo de evento' : 'Filter event type'} value={kindFilter} onChange={event => setKindFilter(event.target.value as typeof kindFilter)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm"><option value="ALL">{isPortuguese ? 'Todos os tipos' : 'All types'}</option><option value="INCOME">{isPortuguese ? 'Entradas' : 'Income'}</option><option value="EXPENSE">{isPortuguese ? 'Saídas' : 'Expenses'}</option><option value="TRANSFER">{isPortuguese ? 'Transferências' : 'Transfers'}</option><option value="RECURRING">{isPortuguese ? 'Recorrentes' : 'Recurring'}</option><option value="LESSON">{isPortuguese ? 'Aulas' : 'Lessons'}</option><option value="PAYMENT">{isPortuguese ? 'Pagamentos' : 'Payments'}</option></select><input aria-label={isPortuguese ? 'Buscar evento' : 'Search events'} value={eventSearch} onChange={event => setEventSearch(event.target.value)} placeholder={isPortuguese ? 'Buscar...' : 'Search...'} className="h-9 w-32 rounded-lg border border-border bg-background px-2 text-sm" /></div>
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
      {selectedEvents.length ? selectedEvents.map((event, index) => <div className="account-row" key={event.id}>
        <i />
        <span><strong>{event.title}</strong><small>{eventKindLabel(event.kind, isPortuguese)}</small></span>
        <b className={event.kind === 'INCOME' ? 'positive' : event.kind === 'EXPENSE' ? 'negative' : ''}>{money(event.amount, event.currency)}</b>
      </div>) : <div className="empty-inline">{isPortuguese ? 'Nenhum evento nesta data.' : 'No events on this date.'}</div>}
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
