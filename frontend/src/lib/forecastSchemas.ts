import { z } from 'zod'
export const cashFlowForecastSchema = z.object({ date:z.string(), income:z.number().finite(), expense:z.number().finite(), netCashFlow:z.number().finite(), projectedBalance:z.number().finite() })
export const cashFlowForecastListSchema = z.array(cashFlowForecastSchema)
