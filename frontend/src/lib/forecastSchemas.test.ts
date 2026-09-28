import { describe, expect, it } from 'vitest'
import { cashFlowForecastListSchema } from './forecastSchemas'

const row = { date: '2026-09-23', income: 100, expense: 40, netCashFlow: 60, projectedBalance: 1060 }

describe('cash flow forecast schema', () => {
  it('accepts a valid forecast row', () => {
    expect(cashFlowForecastListSchema.parse([row])).toHaveLength(1)
  })
  it('rejects non-finite and negative monetary inputs', () => {
    expect(() => cashFlowForecastListSchema.parse([{ ...row, income: Infinity }])).toThrow()
    expect(() => cashFlowForecastListSchema.parse([{ ...row, expense: -1 }])).toThrow()
  })
  it('rejects impossible dates and inconsistent net cash flow', () => {
    expect(() => cashFlowForecastListSchema.parse([{ ...row, date: '2026-02-30' }])).toThrow()
    expect(() => cashFlowForecastListSchema.parse([{ ...row, netCashFlow: 80 }])).toThrow()
  })
  it('requires dates to be unique and ordered', () => {
    expect(() => cashFlowForecastListSchema.parse([row, { ...row, date: '2026-09-23' }])).toThrow()
    expect(() => cashFlowForecastListSchema.parse([row, { ...row, date: '2026-09-22' }])).toThrow()
  })
})
