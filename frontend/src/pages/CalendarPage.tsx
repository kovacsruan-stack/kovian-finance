import { useMemo, useState } from 'react'
import { useFinanceOwnerId } from '../lib/useFinanceOwnerId'
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAccounts, getRecurring, getTransactions, getManagementRecords, importManagementRecords, type FinanceAccount, type FinanceRecurring, type FinanceTransaction } from '../lib/api'
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

type CalendarEvent = { id: string; date: string; title: string; amount: number; currency: string; kind: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'RECURRING' | 'LESSON' | 'PAYMENT' | 'FITNESS' }

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
      const data = item.data
      const date = String(data.date ?? data.startDate ?? '').slice(0, 10)
      if (!date || date < from || date >= to || /cancelad|canceled/i.test(String(data.status ?? ''))) return []
      return [{
        id: 'lesson:' + item.id,
        date,
        title: (eventLanguageIsPortuguese ? 'Aula · ' : 'Lesson · ') + String(data.studentName ?? data.student ?? 'Aluno'),
        amount: 0,
        currency: 'BRL',
        kind: 'LESSON' as const,
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
  const monthSummary = useMemo(() => {
    const byCurrency = new Map<string, { income: number; expense: number }>()
    for (const event of monthEvents) {
      if (event.kind !== 'INCOME' && event.kind !== 'EXPENSE') continue
      const row = byCurrency.get(event.currency) ?? { income: 0, expense: 0 }
      if (event.kind === 'INCOME') row.income += Number(event.amount)
      else row.expense += Number(event.amount)
      byCurrency.set(event.currency, row)
    }
    return [...byCurrency.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [monthEvents])
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
    <PageHeader title={t('calendarTitle')} description={t('calendarDescription')} actions={<>
        <button type="button" className="secondary" aria-label={t('previousMonth')} onClick={() => moveMonth(-1)}><ChevronLeft size={16} /></button>
        <button type="button" className="secondary" onClick={goToToday}>{t('today')}</button>
        <button type="button" className="secondary" aria-label={t('nextMonth')} onClick={() => moveMonth(1)}><ChevronRight size={16} /></button>
        <button type="button" className="secondary" onClick={() => exportEventsToIcs(monthEvents)} disabled={!monthEvents.length}><Download size={15} /> {t('exportIcs')}</button>
      </>} />
    {!ownerId && <div className="notice" role="status" aria-live="polite"><CircleDollarSign size={17} /><span>{t('loginToLoadData')}</span></div>}
    <section className="panel data-panel">
      <div className="section-title"><div><span className="eyebrow"><CalendarDays size={12} /></span><h2>{t('importFitnessCalendar')}</h2></div></div>
      <p className="text-sm text-muted-foreground">{t('importFitnessCalendarDesc')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="secondary cursor-pointer"><Download size={15} /> {t('chooseIcsFile')}<input className="sr-only" type="file" accept=".ics,text/calendar" onChange={async event => {
          const file = event.target.files?.[0]
          setCalendarImportRows([]); setCalendarImportResult(''); setCalendarImportError(''); setCalendarImportName(file?.name ?? '')
          if (!file) return
          if (file.size > 10 * 1024 * 1024) { setCalendarImportError(t('fileTooLarge')); return }
          try {
            const rows = parseCalendarFile(await file.text())
            const unique = new Map(rows.map(row => [row.sourceId, row]))
            setCalendarImportRows([...unique.values()])
            if (!unique.size) setCalendarImportError(t('noRecognizableEvents'))
          } catch { setCalendarImportError(t('cannotReadIcs')) }
        }} /></label>
        {calendarImportName && <span className="text-sm">{calendarImportName}</span>}
        {calendarImportRows.length > 0 && <span className="text-sm">{calendarImportRows.length} evento(s) na prévia</span>}
      </div>
      {calendarImportError && <div className="notice mt-3" role="alert">{calendarImportError}</div>}
      {calendarImportResult && <div className="notice mt-3" role="status">{calendarImportResult}</div>}
      {calendarImportRows.length > 0 && <div className="mt-3 rounded-xl border border-border p-4">
        <p className="text-sm">{t('importIdempotentNote')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="primary" disabled={calendarImportBusy || !ownerId} onClick={async () => {
            setCalendarImportBusy(true); setCalendarImportError(''); setCalendarImportResult('')
            try {
              let inserted = 0, updated = 0, unchanged = 0, unresolvedStudentLinks = 0
              for (let offset = 0; offset < calendarImportRows.length; offset += 500) {
                const result = await importManagementRecords('calendar_events', calendarImportRows.slice(offset, offset + 500))
                inserted += result.inserted; updated += result.updated; unchanged += result.unchanged; unresolvedStudentLinks += result.unresolvedStudentLinks
              }
              setCalendarImportResult(`${t('importCompletedSummary', { inserted, updated, unchanged })}${unresolvedStudentLinks ? ` ${t('unresolvedLinksSummary', { count: unresolvedStudentLinks })}` : ''}`)
              setCalendarImportRows([])
              await Promise.all([fitnessEvents.refetch(), lessons.refetch(), transactions.refetch(), recurring.refetch()])
            } catch (error) { setCalendarImportError(error instanceof Error ? error.message : t('importFailed')) }
            finally { setCalendarImportBusy(false) }
          }}>{calendarImportBusy ? t('importing') : t('confirmImportEvents', { count: calendarImportRows.length })}</button>
          <button type="button" className="secondary" disabled={calendarImportBusy} onClick={() => { setCalendarImportRows([]); setCalendarImportName(''); setCalendarImportError('') }}>Cancelar</button>
        </div>
      </div>}
    </section>

    {(transactions.isError || recurring.isError || accounts.isError || lessons.isError || payments.isError || expenses.isError || fitnessEvents.isError) && <div className="notice" role="alert" aria-live="assertive"><CircleDollarSign size={17} /><span>{t('financeLoadError')}</span></div>}
    <section className="panel finance-calendar">
      <div className="calendar-toolbar">
        <strong>{label.charAt(0).toUpperCase() + label.slice(1)}</strong>
        <div className="flex flex-wrap items-center gap-2"><span>{loading ? t('loading') : (t('eventCount', { count: visibleEvents.length }))}</span><select aria-label={t('filterEventType')} value={kindFilter} onChange={event => setKindFilter(event.target.value as typeof kindFilter)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm"><option value="ALL">{t('allEventTypes')}</option><option value="INCOME">{t('monthIncome')}</option><option value="EXPENSE">{t('monthExpenses')}</option><option value="TRANSFER">{isPortuguese ? 'Transferências' : 'Transfers'}</option><option value="RECURRING">{isPortuguese ? 'Recorrentes' : 'Recurring'}</option><option value="LESSON">{isPortuguese ? 'Aulas' : 'Lessons'}</option><option value="PAYMENT">{isPortuguese ? 'Pagamentos' : 'Payments'}</option><option value="FITNESS">{isPortuguese ? 'Eventos Fitness' : 'Fitness events'}</option></select><input aria-label={t('searchEvent')} value={eventSearch} onChange={event => setEventSearch(event.target.value)} placeholder={t('searchPlaceholder')} className="h-9 w-32 rounded-lg border border-border bg-background px-2 text-sm" /></div>
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
    {monthSummary.length > 0 && <section className="stat-grid">
      {monthSummary.map(([currency, totals]) => <article className="stat-card" key={currency}>
        <CircleDollarSign size={17} />
        <span>{t('monthCashFlow')} · {currency}</span>
        <strong>{money(totals.income - totals.expense, currency)}</strong>
        <small>{t('monthIncome')} {money(totals.income, currency)} · {t('monthExpenses')} {money(totals.expense, currency)}</small>
      </article>)}
    </section>}
    <section className="panel data-panel">
      <div className="section-title">
        <div><span className="eyebrow"><CalendarDays size={12} /></span><h2>{t('selectedDayEvents')}</h2></div>
        <span>{new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, { dateStyle: 'medium' })}</span>
      </div>
      {selectedEvents.length ? selectedEvents.map((event, index) => <div className="account-row" key={event.id}>
        <i />
        <span><strong>{event.title}</strong><small>{eventKindLabel(event.kind, isPortuguese)}</small></span>
        <b className={event.kind === 'INCOME' ? 'positive' : event.kind === 'EXPENSE' ? 'negative' : ''}>{money(event.amount, event.currency)}</b>
      </div>) : <div className="empty-inline">{t('noEventsOnDate')}</div>}
    </section>
    <section className="panel data-panel">
      <div className="section-title"><div><span className="eyebrow"><CalendarDays size={12} /></span><h2>{t('allMonthEvents')}</h2></div></div>
      {monthEvents.length ? monthEvents.map((event, index) => <div className="account-row" key={event.date + event.kind + event.title + index}>
        <i />
        <span><strong>{event.title}</strong><small>{new Date(event.date + 'T00:00:00').toLocaleDateString(locale)} · {eventKindLabel(event.kind, isPortuguese)}</small></span>
        <b className={event.kind === 'INCOME' ? 'positive' : event.kind === 'EXPENSE' ? 'negative' : ''}>{money(event.amount, event.currency)}</b>
      </div>) : <div className="empty-inline">{t('noEventsThisMonth')}</div>}
    </section>
  </main>
}
