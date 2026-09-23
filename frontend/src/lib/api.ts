export type FinanceAccount = {
  id: string
  name: string
  accountType: string
  currency: string
  currentBalance: number
  status: string
}

export type FinanceTransaction = {
  id: string
  accountId: string
  categoryId: string | null
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  status: string
  occurredAt: string
}

export type FinanceGoal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  active: boolean
}

export type FinanceCard = {
  id: string
  name: string
  brand: string | null
  lastFour: string | null
  creditLimit: number
  closingDay: number
  dueDay: number
  status: string
}

export type FinanceInvoice = {
  id: string
  cardId: string
  referenceMonth: string
  dueDate: string
  status: string
  totalAmount: number
  paidAmount: number
}
export type FinancePurchase = { id: string; cardId: string; invoiceId: string; description: string; totalAmount: number; installmentAmount: number; installmentNumber: number; totalInstallments: number; purchasedAt: string }

export type FinanceCategory = {
  id: string
  name: string
  kind: 'INCOME' | 'EXPENSE'
  parentId: string | null
}

export type FinanceBudget = {
  id: string
  categoryId: string
  period: 'MONTHLY' | 'WEEKLY' | 'YEARLY'
  periodStart: string
  limitAmount: number
}
export type FinanceRecurring = { id: string; accountId: string; categoryId: string | null; description: string; amount: number; transactionType: 'INCOME' | 'EXPENSE'; frequency: string; nextOccurrence: string; endDate: string | null; active: boolean }
export type FinanceAnalytics = { from: string; to: string; income: number; expense: number; cashFlow: number; savingsRate: number; netWorth: number; assets: number; liabilities: number; metrics: Array<{ key: string; label: string; value: number; unit: string }> }

export type ReconciliationRun = {
  id: string
  accountId: string
  expectedBalance: number
  actualBalance: number
  difference: number
  status: string
}

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

async function get<T>(path: string): Promise<T> { return request<T>(path) }

async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export function getAccounts(ownerId: string) {
  return get<FinanceAccount[]>(`/accounts?ownerId=${encodeURIComponent(ownerId)}`)
}

export function getGoals(ownerId: string) {
  return get<FinanceGoal[]>(`/goals?ownerId=${encodeURIComponent(ownerId)}`)
}

export function getTransactions(from: string, to: string) {
  return get<FinanceTransaction[]>(
    `/transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  )
}

export function getReconciliationHistory() {
  return get<ReconciliationRun[]>('/reconciliation')
}

export function getCards(ownerId: string) {
  return get<FinanceCard[]>(`/cards?ownerId=${encodeURIComponent(ownerId)}`)
}

export function getInvoices(ownerId: string) {
  return get<FinanceInvoice[]>(`/cards/invoices?ownerId=${encodeURIComponent(ownerId)}`)
}

export function getCategories(ownerId: string, kind: FinanceCategory['kind']) {
  return get<FinanceCategory[]>(`/categories?ownerId=${encodeURIComponent(ownerId)}&kind=${encodeURIComponent(kind)}`)
}

export function getBudgets(ownerId: string, from: string, to: string) {
  return get<FinanceBudget[]>(`/budgets?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
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

export function getRecurring() { return get<FinanceRecurring[]>('/recurring') }
export function createRecurring(input: { accountId: string; categoryId?: string | null; description: string; amount: number; transactionType: 'INCOME' | 'EXPENSE'; frequency: string; nextOccurrence: string; endDate?: string | null }) { return post<FinanceRecurring>('/recurring', input) }
export function pauseRecurring(id: string) { return post<void>(`/recurring/${encodeURIComponent(id)}/pause`, {}) }
export function resumeRecurring(id: string) { return post<void>(`/recurring/${encodeURIComponent(id)}/resume`, {}) }
export function getAnalytics(from: string, to: string, ownerId: string) { return get<FinanceAnalytics>(`/analytics/dashboard?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`) }
export function getCategoryAnalytics(from: string, to: string, ownerId: string) { return get<Record<string, number>>(`/analytics/categories?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`) }
