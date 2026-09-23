import { z } from 'zod'
const amount = z.number().finite()
export const financeAccountSchema = z.object({ id:z.string(), name:z.string(), accountType:z.string(), currency:z.string().length(3), currentBalance:amount, status:z.string() })
export const financeTransactionSchema = z.object({ id:z.string(), accountId:z.string(), categoryId:z.string().nullable(), description:z.string(), amount, type:z.enum(['INCOME','EXPENSE','TRANSFER']), status:z.string(), occurredAt:z.string() })
export const financeGoalSchema = z.object({ id:z.string(), name:z.string(), targetAmount:amount, currentAmount:amount, targetDate:z.string().nullable(), active:z.boolean() })
export const financeCardSchema = z.object({ id:z.string(), name:z.string(), brand:z.string().nullable(), lastFour:z.string().nullable(), creditLimit:amount, closingDay:z.number().int().min(1).max(31), dueDay:z.number().int().min(1).max(31), status:z.string() })
export const financeInvoiceSchema = z.object({ id:z.string(), cardId:z.string(), referenceMonth:z.string(), dueDate:z.string(), status:z.string(), totalAmount:amount, paidAmount:amount })
export const financePurchaseSchema = z.object({ id:z.string(), cardId:z.string(), invoiceId:z.string(), description:z.string(), totalAmount:amount, installmentAmount:amount, installmentNumber:z.number().int().positive(), totalInstallments:z.number().int().positive(), purchasedAt:z.string() })
export const financeCategorySchema = z.object({ id:z.string(), name:z.string(), kind:z.enum(['INCOME','EXPENSE']), parentId:z.string().nullable() })
export const financeBudgetSchema = z.object({ id:z.string(), categoryId:z.string(), period:z.enum(['MONTHLY','WEEKLY','YEARLY']), periodStart:z.string(), limitAmount:amount })
export const financeRecurringSchema = z.object({ id:z.string(), accountId:z.string(), categoryId:z.string().nullable(), description:z.string(), amount, transactionType:z.enum(['INCOME','EXPENSE']), frequency:z.string(), nextOccurrence:z.string(), endDate:z.string().nullable(), active:z.boolean() })
export const financeAnalyticsSchema = z.object({ from:z.string(), to:z.string(), income:amount, expense:amount, cashFlow:amount, savingsRate:z.number().finite(), netWorth:amount, assets:amount, liabilities:amount, metrics:z.array(z.object({key:z.string(),label:z.string(),value:amount,unit:z.string()})) })
export const reconciliationRunSchema = z.object({ id:z.string(), accountId:z.string(), expectedBalance:amount, actualBalance:amount, difference:amount, status:z.string() })
export const financeAccountListSchema=z.array(financeAccountSchema)
export const financeTransactionListSchema=z.array(financeTransactionSchema)
export const financeGoalListSchema=z.array(financeGoalSchema)
export const financeCardListSchema=z.array(financeCardSchema)
export const financeInvoiceListSchema=z.array(financeInvoiceSchema)
export const financeCategoryListSchema=z.array(financeCategorySchema)
export const financeBudgetListSchema=z.array(financeBudgetSchema)
export const financeRecurringListSchema=z.array(financeRecurringSchema)
export const reconciliationRunListSchema=z.array(reconciliationRunSchema)

export const financeAssetSchema=z.object({id:z.string(),ownerId:z.string(),name:z.string(),assetType:z.string(),acquisitionValue:amount,currentValue:amount,liquidity:z.string(),active:z.boolean()})
export const financeLiabilitySchema=z.object({id:z.string(),ownerId:z.string(),name:z.string(),liabilityType:z.string(),amount:amount,active:z.boolean()})
export const financeAssetListSchema=z.array(financeAssetSchema)
export const financeLiabilityListSchema=z.array(financeLiabilitySchema)


export const financeDebtSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  outstandingAmount: z.number().finite(),
  status: z.string(),
})
export const financeDebtListSchema = z.array(financeDebtSchema)
