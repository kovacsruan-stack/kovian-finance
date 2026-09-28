import { describe, expect, it } from 'vitest'
import { budgetPercent, budgetRemaining, budgetSpent, periodBounds } from './budgetUtils'
import type { FinanceBudget, FinanceTransaction } from './api'

const budget = (overrides: Partial<FinanceBudget> = {}): FinanceBudget => ({
  id: 'budget-1', categoryId: 'food', period: 'MONTHLY',
  periodStart: '2026-09-01T00:00:00.000Z', limitAmount: 500, ...overrides,
})
const transaction = (overrides: Partial<FinanceTransaction> = {}): FinanceTransaction => ({
  id: 'tx-1', accountId: 'account-1', categoryId: 'food', description: 'Groceries',
  amount: 100, type: 'EXPENSE', status: 'POSTED', occurredAt: '2026-09-10T12:00:00.000Z', ...overrides,
})

describe('budget calculations', () => {
  it('uses half-open monthly, weekly, and yearly periods', () => {
    const monthly = periodBounds(budget())
    expect(monthly.from.toISOString()).toBe('2026-09-01T00:00:00.000Z')
    expect(monthly.to.toISOString()).toBe('2026-10-01T00:00:00.000Z')
    expect(periodBounds(budget({ period: 'WEEKLY', periodStart: '2026-09-07T00:00:00.000Z' })).to.toISOString()).toBe('2026-09-14T00:00:00.000Z')
    expect(periodBounds(budget({ period: 'YEARLY', periodStart: '2026-01-01T00:00:00.000Z' })).to.toISOString()).toBe('2027-01-01T00:00:00.000Z')
  })

  it('sums only eligible expenses for the matching category and period', () => {
    expect(budgetSpent(budget(), [
      transaction({ amount: 80 }),
      transaction({ id: 'cancelled', amount: 50, status: 'CANCELLED' }),
      transaction({ id: 'income', amount: 90, type: 'INCOME' }),
      transaction({ id: 'other-category', amount: 70, categoryId: 'travel' }),
      transaction({ id: 'before', amount: 40, occurredAt: '2026-08-31T23:59:59.999Z' }),
      transaction({ id: 'at-end', amount: 30, occurredAt: '2026-10-01T00:00:00.000Z' }),
    ])).toBe(80)
  })

  it('ignores invalid dates and non-positive or non-finite amounts', () => {
    expect(budgetSpent(budget(), [
      transaction({ amount: 25 }),
      transaction({ id: 'bad-date', amount: 90, occurredAt: 'not-a-date' }),
      transaction({ id: 'negative', amount: -10 }),
      transaction({ id: 'zero', amount: 0 }),
      transaction({ id: 'infinite', amount: Number.POSITIVE_INFINITY }),
      transaction({ id: 'nan', amount: Number.NaN }),
    ])).toBe(25)
  })

  it('handles invalid limits and exposes overspending without negative remaining', () => {
    expect(budgetPercent(50, 0)).toBe(0)
    expect(budgetPercent(Number.NaN, 100)).toBe(0)
    expect(budgetPercent(50, Number.POSITIVE_INFINITY)).toBe(0)
    expect(budgetRemaining(50, Number.POSITIVE_INFINITY)).toBe(0)
    expect(budgetPercent(125, 100)).toBe(125)
    expect(budgetRemaining(125, 100)).toBe(0)
  })
})
