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

export function expandCalendarEventDates(
  data: Record<string, unknown>,
  from: string,
  toExclusive: string,
): string[] {
  const startValue = String(data.date ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startValue) || from >= toExclusive) return []
  const start = new Date(startValue + 'T00:00:00Z')
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== startValue) return []
  const rule = String(data.recurrenceRule ?? '').trim()
  if (!rule) return startValue >= from && startValue < toExclusive ? [startValue] : []
  const parts: Record<string, string> = {}
  for (const part of rule.split(';')) {
    const separator = part.indexOf('=')
    if (separator > 0) {
      parts[part.slice(0, separator).toUpperCase()] = part.slice(separator + 1).toUpperCase()
    }
  }
  const frequency = parts.FREQ
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(frequency) || Object.keys(parts).some(key => key.startsWith('BY'))) {
    return startValue >= from && startValue < toExclusive ? [startValue] : []
  }
  const interval = Math.max(1, Math.min(366, Number(parts.INTERVAL) || 1))
  const countLimit = Math.max(1, Math.min(10000, Number(parts.COUNT) || 10000))
  const untilRaw = parts.UNTIL ?? ''
  const untilMatch = untilRaw.match(/^(\d{4})(\d{2})(\d{2})/)
  const until = untilMatch ? untilMatch[1] + '-' + untilMatch[2] + '-' + untilMatch[3] : '9999-12-31'
  const results: string[] = []
  let occurrence = new Date(start)
  for (let index = 0; index < countLimit && index < 10000; index++) {
    const date = occurrence.toISOString().slice(0, 10)
    if (date > until || date >= toExclusive) break
    if (date >= from) results.push(date)
    const year = occurrence.getUTCFullYear()
    const month = occurrence.getUTCMonth()
    const day = occurrence.getUTCDate()
    if (frequency === 'DAILY') occurrence = new Date(Date.UTC(year, month, day + interval))
    else if (frequency === 'WEEKLY') occurrence = new Date(Date.UTC(year, month, day + 7 * interval))
    else if (frequency === 'YEARLY') {
      const targetYear = year + interval
      const lastDay = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate()
      occurrence = new Date(Date.UTC(targetYear, month, Math.min(day, lastDay)))
    } else {
      const targetMonth = month + interval
      const targetYear = year + Math.floor(targetMonth / 12)
      const normalizedMonth = targetMonth % 12
      const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()
      occurrence = new Date(Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDay)))
    }
  }
  return results
}
