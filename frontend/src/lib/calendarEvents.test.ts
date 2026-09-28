import { describe, expect, it } from 'vitest'
import { getRecurringOccurrencesInRange, isRecurringOccurrenceInRange } from './calendarEvents'

describe('isRecurringOccurrenceInRange', () => {
  const range = ['2026-09-01', '2026-10-01'] as const
  it('includes an active occurrence inside the month', () => {
    expect(isRecurringOccurrenceInRange({ active: true, nextOccurrence: '2026-09-15', endDate: null }, ...range)).toBe(true)
  })
  it('excludes inactive items and occurrences outside the month', () => {
    expect(isRecurringOccurrenceInRange({ active: false, nextOccurrence: '2026-09-15', endDate: null }, ...range)).toBe(false)
    expect(isRecurringOccurrenceInRange({ active: true, nextOccurrence: '2026-10-01', endDate: null }, ...range)).toBe(false)
    expect(isRecurringOccurrenceInRange({ active: true, nextOccurrence: '2026-08-31', endDate: null }, ...range)).toBe(false)
  })
  it('respects the inclusive end date', () => {
    expect(isRecurringOccurrenceInRange({ active: true, nextOccurrence: '2026-09-15', endDate: '2026-09-14' }, ...range)).toBe(false)
    expect(isRecurringOccurrenceInRange({ active: true, nextOccurrence: '2026-09-14', endDate: '2026-09-14' }, ...range)).toBe(true)
  })
})

describe('getRecurringOccurrencesInRange', () => {
  const base = { id: 'rent-1', active: true, nextOccurrence: '2026-09-01', endDate: null as string | null }
  it('expands weekly occurrences and gives each a stable date-based id', () => {
    const result = getRecurringOccurrencesInRange({ ...base, frequency: 'WEEKLY' }, '2026-09-01', '2026-10-01')
    expect(result.map(item => item.occurrenceDate)).toEqual(['2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29'])
    expect(result[0].occurrenceId).toBe('recurring:rent-1:2026-09-01')
  })
  it('expands monthly and yearly occurrences within the range', () => {
    expect(getRecurringOccurrencesInRange({ ...base, frequency: 'MONTHLY' }, '2026-09-01', '2026-12-01').map(x => x.occurrenceDate)).toEqual(['2026-09-01', '2026-10-01', '2026-11-01'])
    expect(getRecurringOccurrencesInRange({ ...base, frequency: 'YEARLY' }, '2026-01-01', '2028-01-01').map(x => x.occurrenceDate)).toEqual(['2026-09-01', '2027-09-01'])
  })
  it('honors end dates and rejects invalid or unknown schedules', () => {
    expect(getRecurringOccurrencesInRange({ ...base, endDate: '2026-09-10', frequency: 'WEEKLY' }, '2026-09-01', '2026-10-01').map(x => x.occurrenceDate)).toEqual(['2026-09-01', '2026-09-08'])
    expect(getRecurringOccurrencesInRange({ ...base, frequency: 'DAILY' }, '2026-09-01', '2026-10-01')).toEqual([])
    expect(getRecurringOccurrencesInRange({ ...base, nextOccurrence: '2026-02-30', frequency: 'MONTHLY' }, '2026-09-01', '2026-10-01')).toEqual([])
  })
  it('clamps month-end dates instead of overflowing into the following month', () => {
    const result = getRecurringOccurrencesInRange({ ...base, nextOccurrence: '2026-01-31', frequency: 'MONTHLY' }, '2026-01-01', '2026-05-01')
    expect(result.map(x => x.occurrenceDate)).toEqual(['2026-01-31', '2026-02-28', '2026-03-28', '2026-04-28'])
  })
})
