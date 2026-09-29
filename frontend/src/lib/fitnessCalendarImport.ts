export type ImportedCalendarLesson = { sourceId: string; data: Record<string, unknown> }

export function parseCalendarFile(text: string): ImportedCalendarLesson[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, '')
  const blocks = unfolded.split(/BEGIN:VEVENT/i).slice(1)
  const unescapeText = (value: string) => value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
  const readProperty = (body: string, name: string) => {
    const line = body.split(/\r?\n/).find(item => item.slice(0, item.indexOf(':')).split(';')[0].toUpperCase() === name)
    return line ? line.slice(line.indexOf(':') + 1).trim() : ''
  }
  const parseDate = (raw: string) => {
    const match = raw.match(/^(\d{4})(\d{2})(\d{2})/)
    if (!match) return ''
    const date = match[1] + '-' + match[2] + '-' + match[3]
    const parsed = new Date(date + 'T00:00:00Z')
    return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? '' : date
  }
  return blocks.flatMap((block, index) => {
    const body = block.split(/END:VEVENT/i)[0] ?? ''
    const rawStart = readProperty(body, 'DTSTART')
    const date = parseDate(rawStart)
    const summary = unescapeText(readProperty(body, 'SUMMARY') || 'Evento importado do Fitness')
    const uid = unescapeText(readProperty(body, 'UID') || 'fitness-calendar-' + index).trim()
    if (!date || !uid) return []
    const rawEnd = readProperty(body, 'DTEND')
    const endDate = rawEnd ? parseDate(rawEnd) : ''
    const recurrenceRule = readProperty(body, 'RRULE')
    const location = unescapeText(readProperty(body, 'LOCATION'))
    const url = readProperty(body, 'URL')
    const categories = unescapeText(readProperty(body, 'CATEGORIES'))
    const description = unescapeText(readProperty(body, 'DESCRIPTION'))
    return [{
      sourceId: uid.slice(0, 120),
      data: {
        date,
        title: summary,
        notes: description,
        status: /^CANCELLED$/i.test(readProperty(body, 'STATUS')) ? 'Cancelada' : 'Agendada',
        source: 'Kovian Fitness calendar import',
        ...(endDate ? { endDate } : {}),
        ...(recurrenceRule ? { recurrenceRule } : {}),
        ...(location ? { location } : {}),
        ...(url ? { url } : {}),
        ...(categories ? { categories } : {}),
        ...(rawStart ? { sourceStart: rawStart } : {}),
        ...(rawEnd ? { sourceEnd: rawEnd } : {}),
      },
    }]
  })
}
