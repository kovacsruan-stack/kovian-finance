import { describe, expect, it } from 'vitest'
import { expandCalendarEventDates, parseCalendarFile } from './fitnessCalendarImport'

describe('parseCalendarFile', () => {
  it('imports basic events and unescapes text', () => {
    const result = parseCalendarFile([
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:event-1',
      'DTSTART;VALUE=DATE:20260928',
      'SUMMARY:Treino\, pernas',
      'DESCRIPTION:Agendamento\\nConfirmado',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n'))

    expect(result).toHaveLength(1)
    expect(result[0].sourceId).toBe('event-1')
    expect(result[0].data.date).toBe('2026-09-28')
    expect(result[0].data.title).toBe('Treino, pernas')
    expect(result[0].data.notes).toBe('Agendamento\nConfirmado')
  })

  it('preserves recurrence and useful event metadata', () => {
    const result = parseCalendarFile([
      'BEGIN:VEVENT',
      'UID:event-2',
      'DTSTART:20261001T090000Z',
      'DTEND:20261001T100000Z',
      'RRULE:FREQ=WEEKLY;COUNT=4',
      'LOCATION:Studio KOVIAN',
      'URL:https://example.com/event',
      'CATEGORIES:Treino,Funcional',
      'STATUS:CONFIRMED',
      'END:VEVENT',
    ].join('\n'))

    expect(result[0].data).toMatchObject({
      date: '2026-10-01',
      endDate: '2026-10-01',
      recurrenceRule: 'FREQ=WEEKLY;COUNT=4',
      location: 'Studio KOVIAN',
      url: 'https://example.com/event',
      categories: 'Treino,Funcional',
      status: 'Agendada',
    })
  })

  it('creates stable, distinct fallback identifiers when UID is missing', () => {
    const makeEvent = (date: string, title: string) => [
      'BEGIN:VEVENT',
      'DTSTART;VALUE=DATE:' + date,
      'SUMMARY:' + title,
      'END:VEVENT',
    ].join('\\n')
    const first = parseCalendarFile(makeEvent('20260928', 'Treino'))
    const same = parseCalendarFile(makeEvent('20260928', 'Treino'))
    const different = parseCalendarFile(makeEvent('20260929', 'Treino'))

    expect(first[0].sourceId).toBe(same[0].sourceId)
    expect(first[0].sourceId).not.toBe(different[0].sourceId)
  })

  it('marks cancelled events and ignores invalid dates', () => {
    const result = parseCalendarFile([
      'BEGIN:VEVENT',
      'UID:cancelled',
      'DTSTART;VALUE=DATE:20260928',
      'STATUS:CANCELLED',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:invalid',
      'DTSTART;VALUE=DATE:20260230',
      'END:VEVENT',
    ].join('\n'))

    expect(result).toHaveLength(1)
    expect(result[0].data.status).toBe('Cancelada')
  })

  it('unfolds long lines and handles property names case-insensitively', () => {
    const result = parseCalendarFile([
      'BEGIN:VEVENT',
      'uid:event-3',
      'dtstart;value=DATE:20261215',
      'summary:Treino de força com',
      ' continuação',
      'END:VEVENT',
    ].join('\r\n'))

    expect(result[0].sourceId).toBe('event-3')
    expect(result[0].data.title).toBe('Treino de força comcontinuação')
  })
})

describe('expandCalendarEventDates', () => {
  it('expands weekly recurrence within the requested month', () => {
    expect(expandCalendarEventDates(
      { date: '2026-09-01', recurrenceRule: 'FREQ=WEEKLY;COUNT=5' },
      '2026-09-10',
      '2026-10-01',
    )).toEqual(['2026-09-15', '2026-09-22', '2026-09-29'])
  })

  it('honors interval, count, and until bounds', () => {
    expect(expandCalendarEventDates(
      { date: '2026-09-01', recurrenceRule: 'FREQ=DAILY;INTERVAL=2;COUNT=4;UNTIL=20260908' },
      '2026-09-01',
      '2026-09-15',
    )).toEqual(['2026-09-01', '2026-09-03', '2026-09-05', '2026-09-07'])
  })

  it('anchors monthly recurrence to the original day instead of drifting after short months', () => {
    expect(expandCalendarEventDates(
      { date: '2026-01-31', recurrenceRule: 'FREQ=MONTHLY;COUNT=4' },
      '2026-01-01',
      '2026-06-01',
    )).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('does not pretend to expand unsupported BY rules', () => {
    expect(expandCalendarEventDates(
      { date: '2026-09-01', recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR' },
      '2026-09-01',
      '2026-10-01',
    )).toEqual(['2026-09-01'])
  })
})
