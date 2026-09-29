import { describe, expect, it } from 'vitest'
import { getDashboardWindow } from './queries'

describe('finance dashboard query window', () => {
  it('uses the local calendar date instead of the UTC date', () => {
    const date = new Date(2026, 8, 23, 23, 30)
    expect(getLocalDayKey(date)).toBe('2026-09-23')
  })

  it('is deterministic for the same calendar day', () => {
    const first = getDashboardWindow('2026-09-23')
    const second = getDashboardWindow('2026-09-23')
    expect(second).toEqual(first)
  })

  it('covers the trailing 90-day period through the end of the day', () => {
    const { fromIso, toIso } = getDashboardWindow('2026-09-23')
    expect(fromIso).toBe('2026-06-25T23:59:59.999Z')
    expect(toIso).toBe('2026-09-23T23:59:59.999Z')
  })
})
