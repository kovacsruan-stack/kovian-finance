export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurringCalendarOccurrence {
  id: string
  active: boolean
  nextOccurrence: string
  endDate: string | null
  frequency: string
}

const parseDate = (value: string): Date | null => {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null
}

const formatDate = (date: Date) => [
  date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, '0'), String(date.getUTCDate()).padStart(2, '0'),
].join('-')

function advanceDate(date: Date, frequency: RecurringFrequency): Date {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  if (frequency === 'WEEKLY') return new Date(Date.UTC(year, month, day + 7))
  const targetMonth = frequency === 'YEARLY' ? month : month + 1
  const targetYear = year + (frequency === 'YEARLY' ? 1 : Math.floor(targetMonth / 12))
  const normalizedMonth = targetMonth % 12
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()
  return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDay)))
}

/** Expand scheduled occurrences in a [from, toExclusive) date range. */
export function getRecurringOccurrencesInRange<T extends RecurringCalendarOccurrence>(
  item: T,
  from: string,
  toExclusive: string,
): Array<T & { occurrenceDate: string; occurrenceId: string }> {
  if (!item.active || !['WEEKLY', 'MONTHLY', 'YEARLY'].includes(item.frequency)) return []
  const start = parseDate(item.nextOccurrence)
  const rangeStart = parseDate(from)
  const rangeEnd = parseDate(toExclusive)
  const end = item.endDate ? parseDate(item.endDate) : null
  if (!start || !rangeStart || !rangeEnd || (item.endDate && !end) || rangeEnd <= rangeStart) return []
  if (start >= rangeEnd || (end && start > end)) return []

  const frequency = item.frequency as RecurringFrequency
  let occurrence = start
  // Guard malformed/extreme ranges from creating unbounded calendar entries.
  for (let skipped = 0; occurrence < rangeStart && skipped < 5000; skipped++) {
    const next = advanceDate(occurrence, frequency)
    if (next <= occurrence) return []
    occurrence = next
  }
  const results: Array<T & { occurrenceDate: string; occurrenceId: string }> = []
  for (let count = 0; occurrence < rangeEnd && count < 500; count++) {
    if (end && occurrence > end) break
    const occurrenceDate = formatDate(occurrence)
    results.push({ ...item, occurrenceDate, occurrenceId: `recurring:${item.id}:${occurrenceDate}` })
    const next = advanceDate(occurrence, frequency)
    if (next <= occurrence) break
    occurrence = next
  }
  return results
}

/** Whether the next scheduled occurrence is inside the visible date range. */
export function isRecurringOccurrenceInRange(
  item: Pick<RecurringCalendarOccurrence, 'active' | 'nextOccurrence' | 'endDate'>,
  from: string,
  toExclusive: string,
): boolean {
  return item.active
    && item.nextOccurrence >= from
    && item.nextOccurrence < toExclusive
    && (!item.endDate || item.nextOccurrence <= item.endDate)
}
