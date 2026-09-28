import { describe, expect, it } from 'vitest'
import { isRecurringOccurrenceInRange } from './calendarEvents'

describe('isRecurringOccurrenceInRange', () => {
  const range = ['2026-09-01', '2026-10-01'] as const

  it('includes an active occurrence inside the month', () => {
    expect(isRecurringOccurrenceInRange({
      active: true, nextOccurrence: '2026-09-15', endDate: null,
    }, ...range)).toBe(true)
  })

  it('excludes inactive items and occurrences outside the month', () => {
    expect(isRecurringOccurrenceInRange({
      active: false, nextOccurrence: '2026-09-15', endDate: null,
    }, ...range)).toBe(false)
    expect(isRecurringOccurrenceInRange({
      active: true, nextOccurrence: '2026-10-01', endDate: null,
    }, ...range)).toBe(false)
    expect(isRecurringOccurrenceInRange({
      active: true, nextOccurrence: '2026-08-31', endDate: null,
    }, ...range)).toBe(false)
  })

  it('excludes occurrences after the configured end date', () => {
    expect(isRecurringOccurrenceInRange({
      active: true, nextOccurrence: '2026-09-15', endDate: '2026-09-14',
    }, ...range)).toBe(false)
  })

  it('includes an occurrence on the end date', () => {
    expect(isRecurringOccurrenceInRange({
      active: true, nextOccurrence: '2026-09-14', endDate: '2026-09-14',
    }, ...range)).toBe(true)
  })
})
