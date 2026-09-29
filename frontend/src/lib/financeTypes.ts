export type FinanceAccount = { id: string; name: string; accountType: string; currency: string; currentBalance: number; status: string }
export type FinanceTransaction = { id: string; accountId: string; categoryId: string | null; description: string; amount: number; type: 'INCOME' | 'EXPENSE' | 'TRANSFER'; status: string; occurredAt: string }
export type FinanceGoal = { id: string; name: string; targetAmount: number; currentAmount: number; targetDate: string | null; active: boolean }
export type FinanceCard = { id: string; ownerId: string; name: string; brand: string | null; lastFour: string | null; creditLimit: number; usedLimit: number; availableLimit: number; closingDay: number; dueDay: number; status: string }
export type FinanceInvoice = { id: string; cardId: string; referenceMonth: string; closingDate: string; dueDate: string; status: string; totalAmount: number; paidAmount: number; remainingAmount: number }
export type FinancePurchase = { id: string; cardId: string; invoiceId: string; description: string; totalAmount: number; installmentAmount: number; installmentNumber: number; totalInstallments: number; purchasedAt: string }
export type FinanceCategory = { id: string; name: string; kind: 'INCOME' | 'EXPENSE'; parentId: string | null }
export type FinanceBudget = { id: string; categoryId: string; period: 'MONTHLY' | 'WEEKLY' | 'YEARLY'; periodStart: string; limitAmount: number; spentAmount: number; remainingAmount: number; percentUsed: number }
export type FinanceRecurring = { id: string; accountId: string; categoryId: string | null; description: string; amount: number; transactionType: 'INCOME' | 'EXPENSE'; frequency: string; nextOccurrence: string; endDate: string | null; active: boolean }
export type FinanceAnalytics = { from: string; to: string; income: number; expense: number; cashFlow: number; savingsRate: number; netWorth: number; assets: number; liabilities: number; metrics: Array<{ key: string; label: string; value: number; unit: string }> }
export type ReconciliationRun = { id: string; accountId: string; expectedBalance: number; actualBalance: number; difference: number; status: string }

export type FinanceAsset = { id: string; ownerId: string; name: string; assetType: string; acquisitionValue: number; currentValue: number; liquidity: string; active: boolean }
export type FinanceLiability = { id: string; ownerId: string; name: string; liabilityType: string; amount: number; active: boolean }
export type FinanceDebt = { id: string; ownerId: string; name: string; debtType: string; principalAmount: number; outstandingAmount: number; annualInterestRate: number | null; startDate: string; endDate: string | null; totalInstallments: number; status: 'ACTIVE' | 'PAID' | string }
export type FinanceSnapshot = { id: string; snapshotDate: string; totalIncome: number; totalExpense: number; netCashFlow: number; totalAssets: number; totalLiabilities: number; netWorth: number }
export type FinanceTransfer = { id: string; fromAccountId: string; toAccountId: string; amount: number; description: string; status: string; createdAt: string; replayed: boolean }
