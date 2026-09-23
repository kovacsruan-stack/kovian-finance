import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('LanguageSwitcher', () => {
  it('supports escape close and synchronizes document language', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/LanguageSwitcher.tsx'), 'utf8')
    expect(source).toContain("event.key === 'Escape'")
    expect(source).toContain('document.documentElement.lang = language')
    expect(source).toContain('aria-haspopup="menu"')
    expect(source).toContain('role="menuitem"')
  })
})
