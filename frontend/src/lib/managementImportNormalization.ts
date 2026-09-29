type ImportRow = { sourceId: string; data: Record<string, unknown> }

export function removeDuplicateLessons(rows: ImportRow[]): ImportRow[] {
  const seen = new Set<string>()
  return rows.filter(row => {
    const data = row.data
    const values = [data.studentId, data.date, data.time, data.modality]
      .map(value => String(value ?? '').trim())
    // Missing fields are not enough evidence to call two lessons duplicates.
    if (values.some(value => !value)) return true
    const key = JSON.stringify(values)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
