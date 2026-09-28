export interface RecurringCalendarOccurrence {
  active: boolean
  nextOccurrence: string
  endDate: string | null
}

/** Whether a recurring item has an active occurrence inside the visible month. */
export function isRecurringOccurrenceInRange(
  item: RecurringCalendarOccurrence,
  from: string,
  toExclusive: string,
): boolean {
  return item.active
    && item.nextOccurrence >= from
    && item.nextOccurrence < toExclusive
    && (!item.endDate || item.nextOccurrence <= item.endDate)
}
