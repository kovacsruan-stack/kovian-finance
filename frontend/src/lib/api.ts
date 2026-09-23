export type { FinanceAccount, FinanceTransaction, FinanceGoal, FinanceCard, FinanceInvoice, FinancePurchase, FinanceCategory, FinanceBudget, FinanceRecurring, FinanceAnalytics, ReconciliationRun } from './financeTypes'
import type { FinanceAccount, FinanceTransaction, FinanceGoal, FinanceCard, FinanceInvoice, FinancePurchase, FinanceCategory, FinanceBudget, FinanceRecurring, FinanceAnalytics, ReconciliationRun } from './financeTypes'
import { cashFlowForecastListSchema } from './forecastSchemas'

import { financeAccountListSchema, financeTransactionListSchema, financeGoalListSchema, financeCardListSchema, financeInvoiceListSchema, financeCategoryListSchema, financeBudgetListSchema, financeRecurringListSchema, reconciliationRunListSchema, financeAnalyticsSchema } from './apiSchemas'

let fallbackRequestId = 0

const baseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1').replace(/\/$/, '')

export class FinanceApiError extends Error {
  readonly status: number
  readonly requestId: string
  readonly code: string

  constructor(status: number, requestId: string, code = 'FINANCE_API_ERROR', message?: string) {
    super(message || `${code}_${status}`)
    this.name = 'FinanceApiError'
    this.status = status
    this.requestId = requestId
    this.code = code
  }
}

function token(): string | null {
  try {
    return localStorage.getItem('access_token')
  } catch {
    return null
  }
}

function decodePayload(value: string): Record<string, unknown> | null {
  try {
    const part = value.split('.')[1]
    if (!part) return null
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')))
        .map(char => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    const payload = JSON.parse(json) as unknown
    return payload && typeof payload === 'object' ? payload as Record<string, unknown> : null
  } catch {
    return null
  }
}

export function getOwnerId(): string | null {
  const accessToken = token()
  if (!accessToken) return null
  const payload = decodePayload(accessToken)
  const candidate = payload?.sub ?? payload?.ownerId ?? payload?.userId
  return typeof candidate === 'string' ? candidate : null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = token()
  if (!accessToken) throw new Error('AUTHENTICATION_REQUIRED')
  const requestId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${++fallbackRequestId}`
  let response: Response
  try {
    response = await fetch(baseUrl + path, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(15000),
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Request-ID': requestId,
      ...(init?.headers ?? {}),
    },
  })
  } catch (error) {
    const cause = error as { name?: string; message?: string }
    const timedOut = cause?.name === 'TimeoutError'
    throw new FinanceApiError(0, requestId, timedOut ? 'TIMEOUT' : 'NETWORK_ERROR', timedOut ? 'Finance API request timed out.' : cause?.message || 'Finance API request failed.')
  }
  if (!response.ok) {
    let code = 'FINANCE_API_ERROR'
    let message: string | undefined
    try {
      const payload = await response.json() as { code?: unknown; error?: unknown; message?: unknown }
      const candidate = payload.code ?? payload.error
      if (typeof candidate === 'string' && candidate.trim()) code = candidate.trim().slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '_')
      if (typeof payload.message === 'string' && payload.message.trim()) message = payload.message.trim().slice(0, 500)
    } catch {
      // Preserve the status-only error when the backend response is not JSON.
    }
    throw new FinanceApiError(response.status, response.headers.get('X-Request-ID') || requestId, code, message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

async function get<T>(path: string, schema?: { parse: (value: unknown) => T }): Promise<T> { const value = await request<unknown>(path); return schema ? schema.parse(value) : value as T }

async function postMultipart<T>(path: string, body: FormData): Promise<T> {
  const accessToken = token()
  if (!accessToken) throw new Error('AUTHENTICATION_REQUIRED')
  const requestId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${++fallbackRequestId}`
  const response = await fetch(baseUrl + path, { method: 'POST', body, signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'X-Request-ID': requestId } })
  if (!response.ok) throw new FinanceApiError(response.status, response.headers.get('X-Request-ID') || requestId)
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export function getAccounts(ownerId: string) {
  return get(`/accounts?ownerId=${encodeURIComponent(ownerId)}`, financeAccountListSchema)
}

export function getGoals(ownerId: string) {
  return get(`/goals?ownerId=${encodeURIComponent(ownerId)}`, financeGoalListSchema)
}

export function getTransactions(from: string, to: string) {
  return get(`/transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, financeTransactionListSchema)
}

export function getReconciliationHistory() {
  return get('/reconciliation', reconciliationRunListSchema)
}

export function getCards(ownerId: string) {
  return get(`/cards?ownerId=${encodeURIComponent(ownerId)}`, financeCardListSchema)
}

export function getInvoices(ownerId: string) {
  return get(`/cards/invoices?ownerId=${encodeURIComponent(ownerId)}`, financeInvoiceListSchema)
}

export function getCategories(ownerId: string, kind: FinanceCategory['kind']) {
  return get(`/categories?ownerId=${encodeURIComponent(ownerId)}&kind=${encodeURIComponent(kind)}`, financeCategoryListSchema)
}

export function getBudgets(ownerId: string, from: string, to: string) {
  return get(`/budgets?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, financeBudgetListSchema)
}

export function createTransaction(input: { accountId: string; categoryId: string; description: string; amount: number; type: 'INCOME' | 'EXPENSE'; occurredAt: string; externalId?: string }) {
  return post<FinanceTransaction>('/transactions', input)
}

export function cancelTransaction(id: string) { return post<void>(`/transactions/${encodeURIComponent(id)}/cancel`, {}) }

export function createAccount(input: { ownerId: string; name: string; accountType: string; currency: string; openingBalance: number }) {
  return post<FinanceAccount>('/accounts', input)
}

export function createCategory(input: { ownerId: string; name: string; kind: FinanceCategory['kind']; parentId?: string | null }) {
  return post<FinanceCategory>('/categories', input)
}

export function createBudget(input: { ownerId: string; categoryId: string; period: FinanceBudget['period']; periodStart: string; limitAmount: number }) {
  return post<FinanceBudget>('/budgets', input)
}

export function createCard(input: { ownerId: string; name: string; brand?: string; lastFour?: string; creditLimit: number; closingDay: number; dueDay: number }) { return post<FinanceCard>('/cards', input) }
export function createCardPurchase(input: { ownerId: string; cardId: string; description: string; totalAmount: number; installments: number; purchasedAt?: string }) { return post<FinancePurchase>('/cards/purchases', input) }
export function getInvoicePurchases(id: string) { return get<FinancePurchase[]>(`/cards/invoices/${encodeURIComponent(id)}/purchases`) }
export function closeInvoice(id: string, ownerId: string) { return post<void>(`/cards/invoices/${encodeURIComponent(id)}/close?ownerId=${encodeURIComponent(ownerId)}`, {}) }
export function payInvoice(id: string, ownerId: string, accountId: string) { return post<void>(`/cards/invoices/${encodeURIComponent(id)}/pay?ownerId=${encodeURIComponent(ownerId)}&accountId=${encodeURIComponent(accountId)}`, {}) }

export function createGoal(input: { ownerId: string; name: string; targetAmount: number; targetDate?: string | null }) {
  return post<FinanceGoal>('/goals', input)
}

export function getRecurring() { return get('/recurring', financeRecurringListSchema) }
export function createRecurring(input: { accountId: string; categoryId?: string | null; description: string; amount: number; transactionType: 'INCOME' | 'EXPENSE'; frequency: string; nextOccurrence: string; endDate?: string | null }) { return post<FinanceRecurring>('/recurring', input) }
export function pauseRecurring(id: string) { return post<void>(`/recurring/${encodeURIComponent(id)}/pause`, {}) }
export function resumeRecurring(id: string) { return post<void>(`/recurring/${encodeURIComponent(id)}/resume`, {}) }
export function getAnalytics(from: string, to: string, ownerId: string) { return get(`/analytics/dashboard?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, financeAnalyticsSchema) }
export function getCategoryAnalytics(from: string, to: string, ownerId: string) { return get<Record<string, number>>(`/analytics/categories?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`) }

export function getForecastCashFlow(ownerId: string, from: string, days: number) { return get(`/forecast/cash-flow?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&days=${days}`, cashFlowForecastListSchema) }


export type FinanceImport = {
  id: string
  accountId: string
  filename: string
  status: string
  totalRows: number
  importedRows: number
  duplicateRows: number
  failedRows: number
}

export function importCsv(accountId: string, file: File) {
  const form = new FormData()
  form.append('accountId', accountId)
  form.append('file', file)
  return postMultipart<FinanceImport>('/imports/csv', form)
}
export function getImportHistory() { return get<FinanceImport[]>('/imports') }
export function getImportErrors(id: string) { return get<Array<{ rowNumber?: number; message?: string }>>(`/imports/${encodeURIComponent(id)}/errors`) }
