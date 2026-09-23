import { describe, expect, it } from 'vitest'
import { financeSnapshotSchema, financeTransferSchema } from './apiSchemas'

describe('financial planner contracts', () => {
  it('accepts a complete snapshot response', () => {
    expect(financeSnapshotSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      snapshotDate: '2026-09-01',
      totalIncome: 5000,
      totalExpense: 3000,
      netCashFlow: 2000,
      totalAssets: 12000,
      totalLiabilities: 4000,
      netWorth: 8000,
    }).success).toBe(true)
  })

  it('rejects a transfer response with a negative amount', () => {
    expect(financeTransferSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      fromAccountId: '550e8400-e29b-41d4-a716-446655440001',
      toAccountId: '550e8400-e29b-41d4-a716-446655440002',
      amount: -10,
      description: 'Invalid',
      status: 'POSTED',
      createdAt: '2026-09-23T12:00:00Z',
      replayed: false,
    }).success).toBe(false)
  })
})
