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
  const dateMatch = typeof budget.periodStart === 'string' ? /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(budget.periodStart) : null
  if (!dateMatch) return { from: new Date(Number.NaN), to: new Date(Number.NaN) }
  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const reference = new Date(year, month - 1, day)
  if (reference.getFullYear() !== year || reference.getMonth() !== month - 1 || reference.getDate() !== day) {
    return { from: new Date(Number.NaN), to: new Date(Number.NaN) }
  }

  if (budget.period === 'WEEKLY') {
    const from = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
    const day = from.getDay()
    from.setDate(from.getDate() + (day === 0 ? -6 : 1 - day))
    const to = new Date(from)
    to.setDate(to.getDate() + 7)
    return { from, to }
  }
  if (budget.period === 'YEARLY') {
    const from = new Date(reference.getFullYear(), 0, 1)
    return { from, to: new Date(reference.getFullYear() + 1, 0, 1) }
  }
  const from = new Date(reference.getFullYear(), reference.getMonth(), 1)
  return { from, to: new Date(reference.getFullYear(), reference.getMonth() + 1, 1) }
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
