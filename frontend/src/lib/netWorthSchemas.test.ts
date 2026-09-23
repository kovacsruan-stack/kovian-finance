import { describe, expect, it } from 'vitest'
import { financeAssetSchema, financeLiabilitySchema } from './apiSchemas'
describe('net worth API schemas',()=>{it('accepts valid asset',()=>expect(financeAssetSchema.parse({id:'a',ownerId:'o',name:'Reserva',assetType:'CASH',acquisitionValue:100,currentValue:120,liquidity:'HIGH',active:true}).currentValue).toBe(120));it('rejects invalid liability amount',()=>expect(()=>financeLiabilitySchema.parse({id:'l',ownerId:'o',name:'Debt',liabilityType:'LOAN',amount:'120',active:true})).toThrow())})
