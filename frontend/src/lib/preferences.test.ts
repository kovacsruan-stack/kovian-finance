import { beforeEach, describe, expect, it } from 'vitest'
import { clearPreference, financeUiStoragePrefix, getPreference, setPreference } from './preferences'

describe('finance UI preferences', () => {
  beforeEach(() => localStorage.clear())

  it('uses a dedicated namespace and round-trips UI values', () => {
    setPreference('language', 'pt-BR')
    expect(getPreference('language', 'en')).toBe('pt-BR')
    expect(Object.keys(localStorage)).toEqual([financeUiStoragePrefix + 'language'])
  })

  it('never accepts empty values', () => {
    setPreference('theme', '   ')
    expect(getPreference('theme', 'system')).toBe('system')
  })

  it('clears only the requested preference', () => {
    setPreference('theme', 'dark')
    setPreference('density', 'compact')
    clearPreference('theme')
    expect(getPreference('theme', 'system')).toBe('system')
    expect(getPreference('density', 'comfortable')).toBe('compact')
  })
})
