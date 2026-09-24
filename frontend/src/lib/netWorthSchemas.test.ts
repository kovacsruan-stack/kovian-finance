import { describe, expect, it } from 'vitest'
import { financeAssetSchema, financeLiabilitySchema } from './apiSchemas'
describe('net worth API schemas',()=>{it('accepts valid asset',()=>expect(financeAssetSchema.parse({id:'a',ownerId:'o',name:'Reserva',assetType:'CASH',acquisitionValue:100,currentValue:120,liquidity:'HIGH',active:true}).currentValue).toBe(120));it('rejects invalid liability amount',()=>expect(()=>financeLiabilitySchema.parse({id:'l',ownerId:'o',name:'Debt',liabilityType:'LOAN',amount:'120',active:true})).toThrow());it('rejects negative liability amount',()=>expect(()=>financeLiabilitySchema.parse({id:'l',ownerId:'o',name:'Debt',liabilityType:'LOAN',amount:-1,active:true})).toThrow())})

import { financeDebtListSchema } from './apiSchemas'

describe('finance debt response schema', () => {
  it('accepts an owner-scoped debt payload', () => {
    expect(financeDebtListSchema.parse([{ id: '11111111-1111-4111-8111-111111111111', ownerId: '22222222-2222-4222-8222-222222222222', name: 'Financiamento', debtType: 'LOAN', principalAmount: 15000, outstandingAmount: 1200, annualInterestRate: 12, startDate: '2026-01-01', endDate: null, totalInstallments: 12, status: 'ACTIVE' }])).toHaveLength(1)
  })
  it('rejects negative debt balances', () => { expect(() => financeDebtListSchema.parse([{ id: '11111111-1111-4111-8111-111111111111', ownerId: '22222222-2222-4222-8222-222222222222', name: 'Financiamento', debtType: 'LOAN', principalAmount: -1, outstandingAmount: 1200, annualInterestRate: 12, startDate: '2026-01-01', endDate: null, totalInstallments: 12, status: 'ACTIVE' }])).toThrow() })
  it('rejects malformed debt amounts', () => {
    expect(() => financeDebtListSchema.parse([{ id: '11111111-1111-4111-8111-111111111111', ownerId: '22222222-2222-4222-8222-222222222222', name: 'Financiamento', debtType: 'LOAN', principalAmount: 15000, outstandingAmount: '1200', annualInterestRate: 12, startDate: '2026-01-01', endDate: null, totalInstallments: 12, status: 'ACTIVE' }])).toThrow()
  })
})
