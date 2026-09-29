export function formatCurrency(value: number, currency = 'BRL', locale?: string): string {
  const resolvedLocale = locale || (typeof document !== 'undefined' ? document.documentElement.lang || 'pt-BR' : 'pt-BR')
  return value.toLocaleString(resolvedLocale, { style: 'currency', currency })
}
