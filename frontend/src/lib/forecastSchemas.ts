import { z } from 'zod'

/** Accept calendar dates only; parsing with Date alone normalizes impossible dates. */
const isoCalendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').refine(value => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}, 'Expected a real calendar date')

export const cashFlowForecastSchema = z.object({
  date: isoCalendarDate,
  income: z.number().finite(),
  expense: z.number().finite(),
  netCashFlow: z.number().finite(),
  projectedBalance: z.number().finite(),
})
export const cashFlowForecastListSchema = z.array(cashFlowForecastSchema)
