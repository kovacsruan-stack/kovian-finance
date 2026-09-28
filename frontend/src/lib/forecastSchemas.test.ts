import { describe, expect, it } from 'vitest'
import { cashFlowForecastListSchema } from './forecastSchemas'

const row = { date: '2026-09-23', income: 100, expense: 40, netCashFlow: 60, projectedBalance: 1060 }

describe('cash flow forecast schema', () => {
  it('accepts a valid forecast row', () => {
    expect(cashFlowForecastListSchema.parse([row])).toHaveLength(1)
  })

  it('rejects non-finite monetary values', () => {
    expect(() => cashFlowForecastListSchema.parse([{ ...row, income: Infinity }])).toThrow()
  })

  it.each(['2026-2-03', '2026-02-30', '2026-13-01', 'not-a-date'])('rejects invalid calendar date %s', date => {
    expect(() => cashFlowForecastListSchema.parse([{ ...row, date }])).toThrow()
  })

  it('accepts leap day only in leap years', () => {
    expect(cashFlowForecastListSchema.parse([{ ...row, date: '2024-02-29' }])).toHaveLength(1)
    expect(() => cashFlowForecastListSchema.parse([{ ...row, date: '2025-02-29' }])).toThrow()
  })
})
