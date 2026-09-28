import { describe, expect, it } from 'vitest'
import { summarizeForecast } from './forecastAnalysis'
import type { CashFlowForecast } from './forecastTypes'

const rows: CashFlowForecast[] = [
  { date: '2026-10-01', income: 100, expense: 80, netCashFlow: 20, projectedBalance: 50 },
  { date: '2026-10-02', income: 100, expense: 130, netCashFlow: -30, projectedBalance: -10 },
  { date: '2026-10-03', income: 100, expense: 90, netCashFlow: 10, projectedBalance: 0 },
]

describe('summarizeForecast', () => {
  it('aggregates flow and identifies the minimum and first negative balance', () => {
    expect(summarizeForecast(rows)).toEqual({
      projectedIncome: 300,
      projectedExpense: 300,
      projectedNetFlow: 0,
      endingBalance: 0,
      minimumBalance: -10,
      minimumBalanceDate: '2026-10-02',
      firstNegativeBalanceDate: '2026-10-02',
      negativeBalanceDays: 1,
    })
  })
  it('returns explicit empty values for an empty forecast', () => {
    expect(summarizeForecast([])).toEqual({
      projectedIncome: 0, projectedExpense: 0, projectedNetFlow: 0,
      endingBalance: null, minimumBalance: null, minimumBalanceDate: null,
      firstNegativeBalanceDate: null, negativeBalanceDays: 0,
    })
  })
  it('does not flag a zero balance as negative', () => {
    const result = summarizeForecast([{ ...rows[2], projectedBalance: 0 }])
    expect(result.firstNegativeBalanceDate).toBeNull()
    expect(result.negativeBalanceDays).toBe(0)
  })
})
