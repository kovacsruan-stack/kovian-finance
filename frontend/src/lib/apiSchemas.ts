import { z } from 'zod'
const amount = z.number().finite()
const nonNegativeAmount = amount.min(0)
const positiveAmount = amount.min(0.0001)
export const financeAccountSchema = z.object({ id:z.string(), name:z.string(), accountType:z.string(), currency:z.string().length(3), currentBalance:amount, status:z.string() })
export const financeTransactionSchema = z.object({ id:z.string(), accountId:z.string(), categoryId:z.string().nullable(), description:z.string(), amount:positiveAmount, type:z.enum(['INCOME','EXPENSE','TRANSFER']), status:z.string(), occurredAt:z.string() })
export const financeGoalSchema = z.object({ id:z.string(), name:z.string(), targetAmount:positiveAmount, currentAmount:nonNegativeAmount, targetDate:z.string().nullable(), active:z.boolean() })
export const financeCardSchema = z.object({ id:z.string(), name:z.string(), brand:z.string().nullable(), lastFour:z.string().nullable(), creditLimit:nonNegativeAmount, closingDay:z.number().int().min(1).max(31), dueDay:z.number().int().min(1).max(31), status:z.string() })
export const financeInvoiceSchema = z.object({ id:z.string(), cardId:z.string(), referenceMonth:z.string(), dueDate:z.string(), status:z.string(), totalAmount:nonNegativeAmount, paidAmount:nonNegativeAmount })
export const financePurchaseSchema = z.object({ id:z.string(), cardId:z.string(), invoiceId:z.string(), description:z.string(), totalAmount:positiveAmount, installmentAmount:positiveAmount, installmentNumber:z.number().int().positive(), totalInstallments:z.number().int().positive(), purchasedAt:z.string() })
export const financeCategorySchema = z.object({ id:z.string(), name:z.string(), kind:z.enum(['INCOME','EXPENSE']), parentId:z.string().nullable() })
export const financeBudgetSchema = z.object({ id:z.string(), categoryId:z.string(), period:z.enum(['MONTHLY','WEEKLY','YEARLY']), periodStart:z.string(), limitAmount:nonNegativeAmount, spentAmount:nonNegativeAmount, remainingAmount:nonNegativeAmount, percentUsed:nonNegativeAmount })
export const financeRecurringSchema = z.object({ id:z.string(), accountId:z.string(), categoryId:z.string().nullable(), description:z.string(), amount:positiveAmount, transactionType:z.enum(['INCOME','EXPENSE']), frequency:z.string(), nextOccurrence:z.string(), endDate:z.string().nullable(), active:z.boolean() })
export const financeAnalyticsSchema = z.object({ from:z.string(), to:z.string(), income:nonNegativeAmount, expense:nonNegativeAmount, cashFlow:amount, savingsRate:z.number().finite(), netWorth:amount, assets:nonNegativeAmount, liabilities:nonNegativeAmount, metrics:z.array(z.object({key:z.string(),label:z.string(),value:amount,unit:z.string()})) })
export const reconciliationRunSchema = z.object({ id:z.string(), accountId:z.string(), expectedBalance:amount, actualBalance:amount, difference:amount, status:z.string() })
export const financeAccountListSchema=z.array(financeAccountSchema)
export const financeTransactionListSchema=z.array(financeTransactionSchema)
export const financeGoalListSchema=z.array(financeGoalSchema)
export const financeCardListSchema=z.array(financeCardSchema)
export const financeInvoiceListSchema=z.array(financeInvoiceSchema)
export const financePurchaseListSchema=z.array(financePurchaseSchema)
export const financeCategoryListSchema=z.array(financeCategorySchema)
export const financeBudgetListSchema=z.array(financeBudgetSchema)
export const financeRecurringListSchema=z.array(financeRecurringSchema)
export const reconciliationRunListSchema=z.array(reconciliationRunSchema)

export const financeAssetSchema=z.object({id:z.string(),ownerId:z.string(),name:z.string(),assetType:z.string(),acquisitionValue:nonNegativeAmount,currentValue:nonNegativeAmount,liquidity:z.string(),active:z.boolean()})
export const financeLiabilitySchema=z.object({id:z.string(),ownerId:z.string(),name:z.string(),liabilityType:z.string(),amount:nonNegativeAmount,active:z.boolean()})
export const financeAssetListSchema=z.array(financeAssetSchema)
export const financeLiabilityListSchema=z.array(financeLiabilitySchema)

export const financeDebtSchema = z.object({
  id: z.string().uuid(), ownerId: z.string().uuid(), name: z.string(), debtType: z.string(),
  principalAmount: nonNegativeAmount, outstandingAmount: nonNegativeAmount, annualInterestRate: nonNegativeAmount.nullable(),
  startDate: z.string(), endDate: z.string().nullable(), totalInstallments: z.number().int().positive(), status: z.string(),
})
export const financeDebtListSchema = z.array(financeDebtSchema)
export const financeImportSchema = z.object({
  id: z.string().uuid(), accountId: z.string().uuid(), filename: z.string(), status: z.string(),
  totalRows: z.number().int().nonnegative(), importedRows: z.number().int().nonnegative(), duplicateRows: z.number().int().nonnegative(), failedRows: z.number().int().nonnegative(),
})
export const financeImportListSchema = z.array(financeImportSchema)
export const financeImportErrorSchema = z.object({ rowNumber: z.number().int().nonnegative(), errorCode: z.string(), message: z.string() })
export const financeImportErrorListSchema = z.array(financeImportErrorSchema)
export const financeNotificationSchema=z.object({id:z.string().uuid(),type:z.string(),severity:z.string(),title:z.string(),message:z.string(),entityType:z.string().nullable(),entityId:z.string().uuid().nullable(),readAt:z.string().nullable(),createdAt:z.string()})
export const financeNotificationListSchema=z.array(financeNotificationSchema)
export const financeSnapshotSchema=z.object({id:z.string().uuid(),snapshotDate:z.string(),totalIncome:amount,totalExpense:amount,netCashFlow:amount,totalAssets:nonNegativeAmount,totalLiabilities:nonNegativeAmount,netWorth:amount})
export const financeSnapshotListSchema=z.array(financeSnapshotSchema)
export const financeTransferSchema=z.object({id:z.string().uuid(),fromAccountId:z.string().uuid(),toAccountId:z.string().uuid(),amount:positiveAmount,description:z.string(),status:z.string(),createdAt:z.string(),replayed:z.boolean()})
