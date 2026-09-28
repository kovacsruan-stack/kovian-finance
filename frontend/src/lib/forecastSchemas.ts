import { z } from 'zod'

const isoDate = z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).refine(value => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}, 'Expected a real calendar date')

export const cashFlowForecastSchema = z.object({
  date: isoDate,
  income: z.number().finite().nonnegative(),
  expense: z.number().finite().nonnegative(),
  netCashFlow: z.number().finite(),
  projectedBalance: z.number().finite(),
}).superRefine((row, context) => {
  if (Math.abs(row.netCashFlow - (row.income - row.expense)) > 0.011) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Net cash flow must equal income minus expenses', path: ['netCashFlow'] })
  }
})

export const cashFlowForecastListSchema = z.array(cashFlowForecastSchema).superRefine((rows, context) => {
  for (let index = 1; index < rows.length; index++) {
    if (rows[index].date <= rows[index - 1].date) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Forecast dates must be unique and strictly increasing', path: [index, 'date'] })
    }
  }
})
