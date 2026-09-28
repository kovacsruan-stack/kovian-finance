import { describe, expect, it } from 'vitest'
import { localDateKey } from './ForecastPage'

describe('localDateKey', () => {
  it('formats local date components without UTC conversion', () => {
    expect(localDateKey(new Date(2026, 8, 28, 0, 15))).toBe('2026-09-28')
  })
  it('pads month and day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
  it('handles year boundaries and leap day', () => {
    expect(localDateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
    expect(localDateKey(new Date(2024, 1, 29, 12, 0))).toBe('2024-02-29')
  })
})
