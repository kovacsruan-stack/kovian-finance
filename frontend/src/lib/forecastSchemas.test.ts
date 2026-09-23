import { describe, expect, it } from 'vitest'
import { cashFlowForecastListSchema } from './forecastSchemas'

describe('cash flow forecast schema', () => {
  it('accepts a valid forecast row', () => {
    expect(cashFlowForecastListSchema.parse([{ date:'2026-09-23', income:100, expense:40, netCashFlow:60, projectedBalance:1060 }])).toHaveLength(1)
  })
  it('rejects non-finite monetary values', () => {
    expect(() => cashFlowForecastListSchema.parse([{ date:'2026-09-23', income:Infinity, expense:40, netCashFlow:60, projectedBalance:1060 }])).toThrow()
  })
})
