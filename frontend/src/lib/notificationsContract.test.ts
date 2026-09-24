import { describe, expect, it } from 'vitest'
import { financeNotificationListSchema } from './apiSchemas'

describe('notification contract', () => {
  it('accepts a governed notification', () => {
    const value=financeNotificationListSchema.parse([{id:'11111111-1111-4111-8111-111111111111',type:'BUDGET_80_PERCENT',severity:'WARNING',title:'Budget',message:'Review spending',entityType:'BUDGET',entityId:'22222222-2222-4222-8222-222222222222',readAt:null,createdAt:'2026-09-23T10:00:00Z'}])
    expect(value[0].severity).toBe('WARNING')
  })
  it('rejects malformed notification identifiers', () => {
    expect(()=>financeNotificationListSchema.parse([{id:'bad',type:'INFO',severity:'INFO',title:'x',message:'y',entityType:null,entityId:null,readAt:null,createdAt:'2026-09-23T10:00:00Z'}])).toThrow()
  })
})
