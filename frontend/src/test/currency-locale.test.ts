import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('currency locale', () => {
  it('uses the active document language instead of a fixed locale', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8')
    expect(source).toContain('document.documentElement.lang')
    expect(source).not.toContain("toLocaleString('pt-BR'")
  })
})
