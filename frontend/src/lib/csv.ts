export function safeCsvCell(value: unknown): string {
  const text = String(value ?? '').replace(/"/g, '""')
  if (typeof value !== 'number' && /^[=+\-@]/.test(text)) return `"'${text}"`
  return `"${text}"`
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(safeCsvCell).join(','), ...rows.map(row => row.map(safeCsvCell).join(','))].join('\n')
}
