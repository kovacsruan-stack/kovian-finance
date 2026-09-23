import { describe, expect, it } from 'vitest'
import { z } from 'zod'
const insightSchema=z.object({type:z.string(),title:z.string(),explanation:z.string(),severity:z.string(),generatedAt:z.string()})
describe('KOVI insight contract',()=>{it('accepts backend payload',()=>expect(insightSchema.parse({type:'SAVINGS_RATE',title:'Margem reduzida',explanation:'A diferença ficou abaixo do esperado.','severity':'MEDIUM',generatedAt:'2026-09-23T17:00:00Z'}).type).toBe('SAVINGS_RATE'));it('rejects stale frontend shape',()=>expect(()=>insightSchema.parse({code:'X',description:'x'})).toThrow())})
