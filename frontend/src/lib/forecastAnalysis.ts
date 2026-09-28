import type { CashFlowForecast } from './forecastTypes'

export type ForecastSummary = {
  projectedIncome: number
  projectedExpense: number
  projectedNetFlow: number
  endingBalance: number | null
  minimumBalance: number | null
  minimumBalanceDate: string | null
  firstNegativeBalanceDate: string | null
  negativeBalanceDays: number
}

export function summarizeForecast(rows: CashFlowForecast[]): ForecastSummary {
  if (!rows.length) return {
    projectedIncome: 0, projectedExpense: 0, projectedNetFlow: 0,
    endingBalance: null, minimumBalance: null, minimumBalanceDate: null,
    firstNegativeBalanceDate: null, negativeBalanceDays: 0,
  }
  let projectedIncome = 0
  let projectedExpense = 0
  let minimumBalance = Number.POSITIVE_INFINITY
  let minimumBalanceDate: string | null = null
  let firstNegativeBalanceDate: string | null = null
  let negativeBalanceDays = 0
  for (const row of rows) {
    projectedIncome += row.income
    projectedExpense += row.expense
    if (row.projectedBalance < minimumBalance) {
      minimumBalance = row.projectedBalance
      minimumBalanceDate = row.date
    }
    if (row.projectedBalance < 0) {
      negativeBalanceDays++
      firstNegativeBalanceDate ??= row.date
    }
  }
  return {
    projectedIncome,
    projectedExpense,
    projectedNetFlow: projectedIncome - projectedExpense,
    endingBalance: rows[rows.length - 1].projectedBalance,
    minimumBalance,
    minimumBalanceDate,
    firstNegativeBalanceDate,
    negativeBalanceDays,
  }
}
