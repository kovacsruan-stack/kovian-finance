import { describe, expect, it } from 'vitest'
import { budgetPercent, budgetRemaining, periodStartFor } from './budgetUtils'

describe('budgetUtils', () => {
  it('starts weekly budgets on Monday', () => { expect(periodStartFor('WEEKLY', new Date('2026-09-23T15:00:00Z')).getDay()).toBe(1) })
  it('calculates remaining and percentage safely', () => { expect(budgetRemaining(250, 1000)).toBe(750); expect(budgetPercent(250, 1000)).toBe(25); expect(budgetPercent(0, 250)).toBe(0) })
})
