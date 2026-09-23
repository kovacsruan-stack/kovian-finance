import { describe, expect, it } from 'vitest'
import { buildCsv, safeCsvCell } from './csv'

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
