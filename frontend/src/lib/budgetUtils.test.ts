import { describe, expect, it } from 'vitest'
import { budgetPercent, budgetRemaining, budgetSpent, categoryTree, periodBounds, periodStartFor } from './budgetUtils'

describe('budgetUtils', () => {
  it('starts weekly budgets on Monday', () => { expect(periodStartFor('WEEKLY', new Date('2026-09-23T15:00:00Z')).getDay()).toBe(1) })
  it('calculates remaining and percentage safely', () => { expect(budgetRemaining(250, 1000)).toBe(750); expect(budgetPercent(250, 1000)).toBe(25); expect(budgetPercent(0, 250)).toBe(0) })
  it('builds deterministic budget bounds for each period', () => {
    const monthly = periodBounds({ id: 'm', categoryId: 'c', period: 'MONTHLY', periodStart: '2026-09-01T00:00:00Z', limitAmount: 100 })
    const weekly = periodBounds({ id: 'w', categoryId: 'c', period: 'WEEKLY', periodStart: '2026-09-07T00:00:00Z', limitAmount: 100 })
    const yearly = periodBounds({ id: 'y', categoryId: 'c', period: 'YEARLY', periodStart: '2026-01-01T00:00:00Z', limitAmount: 100 })
    expect(monthly.to.getUTCMonth()).toBe(9)
    expect(weekly.to.getUTCDate()).toBe(14)
    expect(yearly.to.getUTCFullYear()).toBe(2027)
  })

  it('normalizes monthly periods even when the stored date is month-end', () => {
    const bounds = periodBounds({
      id: 'month-end',
      categoryId: 'food',
      period: 'MONTHLY',
      periodStart: '2026-01-31T00:00:00Z',
      limitAmount: 100,
    })
    expect(bounds.from.getDate()).toBe(1)
    expect(bounds.from.getMonth()).toBe(0)
    expect(bounds.to.getDate()).toBe(1)
    expect(bounds.to.getMonth()).toBe(1)
  })

  it('returns invalid bounds for malformed period dates instead of counting transactions', () => {
    const bounds = periodBounds({
      id: 'invalid',
      categoryId: 'food',
      period: 'MONTHLY',
      periodStart: 'not-a-date',
      limitAmount: 100,
    })
    expect(Number.isNaN(bounds.from.getTime())).toBe(true)
    expect(Number.isNaN(bounds.to.getTime())).toBe(true)
  })

  it('counts only matching non-cancelled expenses inside the budget window', () => {
    const budget = { id: 'b', categoryId: 'food', period: 'MONTHLY' as const, periodStart: '2026-09-01T00:00:00Z', limitAmount: 500 }
    const transactions = [
      { id: '1', accountId: 'a', categoryId: 'food', description: 'Lunch', amount: 100, type: 'EXPENSE' as const, status: 'POSTED', occurredAt: '2026-09-10T12:00:00Z' },
      { id: '2', accountId: 'a', categoryId: 'food', description: 'Cancelled', amount: 300, type: 'EXPENSE' as const, status: 'CANCELLED', occurredAt: '2026-09-11T12:00:00Z' },
      { id: '3', accountId: 'a', categoryId: 'transport', description: 'Taxi', amount: 200, type: 'EXPENSE' as const, status: 'POSTED', occurredAt: '2026-09-12T12:00:00Z' },
      { id: '4', accountId: 'a', categoryId: 'food', description: 'Old', amount: 250, type: 'EXPENSE' as const, status: 'POSTED', occurredAt: '2026-08-31T12:00:00Z' },
    ]
    expect(budgetSpent(budget, transactions)).toBe(100)
  })

  it('keeps category roots followed by their direct children', () => {
    const categories = [
      { id: 'child', name: 'Child', kind: 'EXPENSE' as const, parentId: 'root' },
      { id: 'root', name: 'Root', kind: 'EXPENSE' as const, parentId: null },
      { id: 'other', name: 'Other', kind: 'INCOME' as const, parentId: null },
    ]
    expect(categoryTree(categories).map(category => category.id)).toEqual(['root', 'child', 'other'])
  })

  it('ignores malformed transaction dates and non-finite amounts', () => {
    const budget = { id: 'b', categoryId: 'food', period: 'MONTHLY' as const, periodStart: '2026-09-01T00:00:00Z', limitAmount: 500 }
    const transactions = [
      { id: '1', accountId: 'a', categoryId: 'food', description: 'Invalid date', amount: 100, type: 'EXPENSE' as const, status: 'POSTED', occurredAt: 'not-a-date' },
      { id: '2', accountId: 'a', categoryId: 'food', description: 'Invalid amount', amount: Number.NaN, type: 'EXPENSE' as const, status: 'POSTED', occurredAt: '2026-09-10T12:00:00Z' },
      { id: '3', accountId: 'a', categoryId: 'food', description: 'Valid', amount: 25, type: 'EXPENSE' as const, status: 'POSTED', occurredAt: '2026-09-10T12:00:00Z' },
    ]
    expect(budgetSpent(budget, transactions)).toBe(25)
  })

  it('handles a missing period date from malformed runtime data', () => {
    const bounds = periodBounds({
      id: 'missing-date',
      categoryId: 'food',
      period: 'MONTHLY',
      periodStart: undefined as never,
      limitAmount: 100,
    })
    expect(Number.isNaN(bounds.from.getTime())).toBe(true)
    expect(Number.isNaN(bounds.to.getTime())).toBe(true)
  })

  it('returns safe values for non-finite budget inputs', () => {
    expect(budgetPercent(Number.NaN, 100)).toBe(0)
    expect(budgetPercent(100, Number.POSITIVE_INFINITY)).toBe(0)
    expect(budgetRemaining(Number.NaN, 100)).toBe(0)
  })

})
