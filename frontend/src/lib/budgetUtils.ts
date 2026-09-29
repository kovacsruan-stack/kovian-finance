import type { FinanceBudget, FinanceCategory, FinanceTransaction } from './api'

export function periodStartFor(period: FinanceBudget['period'], reference = new Date()): Date {
  const start = new Date(reference)
  start.setHours(0, 0, 0, 0)
  if (period === 'WEEKLY') {
    const day = start.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + mondayOffset)
    return start
  }
  if (period === 'YEARLY') return new Date(start.getFullYear(), 0, 1)
  return new Date(start.getFullYear(), start.getMonth(), 1)
}

export function periodBounds(budget: FinanceBudget): { from: Date; to: Date } {
  const start = new Date(budget.periodStart)
  if (budget.period === 'WEEKLY') {
    const to = new Date(start)
    to.setDate(to.getDate() + 7)
    return { from: start, to }
  }
  if (budget.period === 'YEARLY') {
    const to = new Date(start)
    to.setFullYear(to.getFullYear() + 1)
    return { from: start, to }
  }
  const to = new Date(start)
  to.setMonth(to.getMonth() + 1)
  return { from: start, to }
}

export function budgetSpent(budget: FinanceBudget, transactions: FinanceTransaction[]): number {
  const { from, to } = periodBounds(budget)
  return transactions
    .filter(tx => tx.type === 'EXPENSE' && tx.status !== 'CANCELLED' && tx.categoryId === budget.categoryId)
    .filter(tx => {
      const occurred = new Date(tx.occurredAt)
      const amount = Number(tx.amount)
      return Number.isFinite(occurred.getTime())
        && Number.isFinite(amount)
        && occurred >= from
        && occurred < to
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
}

export function budgetPercent(spent: number, limit: number): number {
  if (!Number.isFinite(spent) || !Number.isFinite(limit) || limit <= 0) return 0
  return Math.round((spent / limit) * 100)
}

export function budgetRemaining(spent: number, limit: number): number {
  if (!Number.isFinite(spent) || !Number.isFinite(limit)) return 0
  return Math.max(0, limit - spent)
}

export function categoryTree(categories: FinanceCategory[]): FinanceCategory[] {
  const roots = categories.filter(category => !category.parentId)
  const children = categories.filter(category => category.parentId)
  return roots.flatMap(root => [root, ...children.filter(child => child.parentId === root.id)])
}
