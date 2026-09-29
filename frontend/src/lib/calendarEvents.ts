export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurringCalendarOccurrence {
  id: string
  active: boolean
  nextOccurrence: string
  endDate: string | null
  frequency: string
}

const parseDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null
}

const formatDate = (date: Date) => [
  date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, '0'), String(date.getUTCDate()).padStart(2, '0'),
].join('-')

/** Calculate each occurrence from the original anchor, preserving month-end cadence. */
function occurrenceAt(start: Date, frequency: RecurringFrequency, index: number): Date {
  if (frequency === 'WEEKLY') return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + index * 7))
  const anchorDay = start.getUTCDate()
  const monthIndex = start.getUTCMonth() + index * (frequency === 'YEARLY' ? 12 : 1)
  const year = start.getUTCFullYear() + Math.floor(monthIndex / 12)
  const month = monthIndex % 12
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month, Math.min(anchorDay, lastDay)))
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
  let index = 0
  // Find the first occurrence at or after the visible range without unbounded iteration.
  while (occurrenceAt(start, frequency, index) < rangeStart && index < 5000) index++
  let occurrence = occurrenceAt(start, frequency, index)
  if (occurrence < rangeStart) return []

  const results: Array<T & { occurrenceDate: string; occurrenceId: string }> = []
  for (let count = 0; occurrence < rangeEnd && count < 500; count++, index++) {
    if (end && occurrence > end) break
    const occurrenceDate = formatDate(occurrence)
    results.push({ ...item, occurrenceDate, occurrenceId: `recurring:${item.id}:${occurrenceDate}` })
    occurrence = occurrenceAt(start, frequency, index + 1)
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
