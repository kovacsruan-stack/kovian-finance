const PREFIX = 'kovian.finance.ui.'
const allowedKeys = ['language', 'theme', 'density', 'lastView'] as const
export type FinancePreferenceKey = typeof allowedKeys[number]
export type FinanceTheme = 'system' | 'light' | 'dark'
export type FinanceDensity = 'comfortable' | 'compact'

function storage(): Storage | null {
  try { return typeof window !== 'undefined' ? window.localStorage : null } catch { return null }
}

export function getPreference<T extends string>(key: FinancePreferenceKey, fallback: T): T {
  const value = storage()?.getItem(PREFIX + key)
  return value && value.length <= 100 ? value as T : fallback
}

export function setPreference(key: FinancePreferenceKey, value: string): void {
  if (!allowedKeys.includes(key)) return
  const safe = value.trim().slice(0, 100)
  if (!safe) return
  storage()?.setItem(PREFIX + key, safe)
}

export function clearPreference(key: FinancePreferenceKey): void {
  storage()?.removeItem(PREFIX + key)
}

export const financeUiStoragePrefix = PREFIX
