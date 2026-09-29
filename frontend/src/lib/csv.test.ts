import { describe, expect, it } from 'vitest'
import { buildCsv, buildTransactionImportCsv, safeCsvCell } from './csv'

describe('CSV serialization', () => {
  it('keeps numeric negative values intact', () => {
    expect(safeCsvCell(-123.45)).toBe('" -123.45"'.replace(' ',''))
  })

  it('neutralizes formula-like strings', () => {
    expect(safeCsvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"')
    expect(safeCsvCell('+CMD')).toBe('"\'+CMD"')
    expect(safeCsvCell('-CMD')).toBe('"\'-CMD"')
  })

  it('builds a quoted CSV document', () => {
    expect(buildCsv(['amount', 'description'], [[-10, 'Mercado']])).toBe('"amount","description"\n"-10","Mercado"')
  })
})

describe('transaction import/export contract', () => {
  it('exports the columns required by the importer and preserves source identity', () => {
    const csv = buildTransactionImportCsv([{
      id: 'transaction-123',
      categoryId: 'category-456',
      description: 'Mercado, semanal',
      amount: 42.5,
      type: 'EXPENSE',
      status: 'POSTED',
      occurredAt: '2026-09-28T15:30:00Z',
    }])

    expect(csv).toBe(
      '"date","description","amount","type","source_transaction_id","category_id"\n' +
      '"2026-09-28","Mercado, semanal","42.5","EXPENSE","transaction-123","category-456"',
    )
  })

  it('does not export cancelled transactions or transfers as importable movements', () => {
    const csv = buildTransactionImportCsv([
      { id: 'cancelled', categoryId: 'category-1', description: 'Cancelled', amount: 10, type: 'EXPENSE', status: 'CANCELLED', occurredAt: '2026-09-01T00:00:00Z' },
      { id: 'transfer', categoryId: null, description: 'Transfer', amount: 10, type: 'TRANSFER', status: 'POSTED', occurredAt: '2026-09-01T00:00:00Z' },
    ])

    expect(csv.split('\n')).toHaveLength(1)
    expect(csv).toContain('"source_transaction_id"')
  })
})
