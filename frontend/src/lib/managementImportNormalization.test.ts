import { describe, expect, it } from 'vitest'
import { removeDuplicateLessons } from './managementImportNormalization'

const row = (sourceId: string, data: Record<string, unknown>) => ({ sourceId, data })

describe('removeDuplicateLessons', () => {
  it('keeps the first row for a fully specified matching lesson', () => {
    const first = row('lesson-1', { studentId: 'student-1', date: '2026-09-01', time: '08:00', modality: 'Funcional', status: 'Realizada' })
    const duplicate = row('lesson-2', { studentId: 'student-1', date: '2026-09-01', time: '08:00', modality: 'Funcional', status: 'Realizada' })
    const distinct = row('lesson-3', { studentId: 'student-1', date: '2026-09-01', time: '09:00', modality: 'Funcional', status: 'Realizada' })

    expect(removeDuplicateLessons([first, duplicate, distinct])).toEqual([first, distinct])
  })

  it('preserves rows when any comparison field is missing', () => {
    const first = row('lesson-1', { studentId: 'student-1', date: '2026-09-01' })
    const second = row('lesson-2', { studentId: 'student-1', date: '2026-09-01' })

    expect(removeDuplicateLessons([first, second])).toEqual([first, second])
  })

  it('does not collide when field values contain separators', () => {
    const first = row('lesson-1', { studentId: 'a|b', date: '2026-09-01', time: '08:00', modality: 'C', status: 'Done' })
    const second = row('lesson-2', { studentId: 'a', date: 'b|2026-09-01', time: '08:00', modality: 'C', status: 'Done' })

    expect(removeDuplicateLessons([first, second])).toHaveLength(2)
  })
})
