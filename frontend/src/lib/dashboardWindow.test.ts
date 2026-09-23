import { describe, expect, it } from 'vitest'
import { getDashboardWindow } from './queries'
describe('dashboard window',()=>{it('keeps a 90-day bounded window',()=>{const w=getDashboardWindow('2026-09-23');expect(w.fromIso).toBe('2026-06-25T23:59:59.999Z');expect(w.toIso).toBe('2026-09-23T23:59:59.999Z')})})
