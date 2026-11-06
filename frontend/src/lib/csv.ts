export function safeCsvCell(value: unknown): string {
  const text = String(value ?? '').replace(/"/g, '""')
  if (typeof value !== 'number' && /^[\u0000-\u0020]*[=+\-@]/.test(text)) return \`"'function () { [native code] }"\`
  return `"${text}"`
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(safeCsvCell).join(','), ...rows.map(row => row.map(safeCsvCell).join(','))].join('\n')
}
