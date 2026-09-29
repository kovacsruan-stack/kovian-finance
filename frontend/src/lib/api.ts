import { z } from 'zod'
export type { FinanceAccount, FinanceTransaction, FinanceGoal, FinanceCard, FinanceInvoice, FinancePurchase, FinanceCategory, FinanceBudget, FinanceRecurring, FinanceAnalytics, FinanceAsset, FinanceLiability, FinanceDebt, FinanceSnapshot, FinanceTransfer, ReconciliationRun } from './financeTypes'
import type { FinanceAccount, FinanceTransaction, FinanceGoal, FinanceCard, FinanceInvoice, FinancePurchase, FinanceCategory, FinanceBudget, FinanceRecurring, FinanceAnalytics, FinanceAsset, FinanceLiability, FinanceTransfer, ReconciliationRun } from './financeTypes'
import { cashFlowForecastListSchema } from './forecastSchemas'

import { financeImportSchema, financeImportListSchema, financeImportErrorListSchema, financeNotificationListSchema, financeDebtListSchema, financeSnapshotListSchema, financeTransferSchema, financeAssetListSchema, financeLiabilityListSchema, financeAccountListSchema, financeAccountSchema, financeTransactionListSchema, financeTransactionSchema, financeGoalListSchema, financeGoalSchema, financeCardListSchema, financeCardSchema, financeInvoiceListSchema, financePurchaseSchema, financePurchaseListSchema, financeCategoryListSchema, financeCategorySchema, financeBudgetListSchema, financeBudgetSchema, financeRecurringListSchema, financeRecurringSchema, reconciliationRunListSchema, financeAnalyticsSchema } from './apiSchemas'

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

export type FinanceAuthUser = { id: string; email: string; role: string; is_active: boolean }

export async function loginFinance(email: string, password: string): Promise<FinanceAuthUser> {
  let response: Response
  try {
    response = await fetch(baseUrl + '/auth/login', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ email: email.trim(), password }),
      signal: AbortSignal.timeout(15000),
    })
  } catch (error) {
    const cause = error as { message?: string }
    throw new Error(cause?.message || 'Não foi possível conectar ao serviço de autenticação.')
  }

  const payload = await response.json().catch(() => null) as {
    access_token?: unknown
    user?: FinanceAuthUser
    detail?: unknown
  } | null

  if (!response.ok) {
    const detail = typeof payload?.detail === 'string' ? payload.detail : ''
    throw new Error(response.status === 401
      ? 'E-mail ou senha inválidos.'
      : detail || 'Não foi possível autenticar. Tente novamente.')
  }
  if (!payload || typeof payload.access_token !== 'string' || !payload.user) {
    throw new Error('A resposta de autenticação é inválida.')
  }

  try {
    localStorage.setItem('access_token', payload.access_token)
  } catch {
    throw new Error('O navegador bloqueou o armazenamento da sessão. Permita o armazenamento do site e tente novamente.')
  }
  return payload.user
}

export function clearFinanceSession() {
  try { localStorage.removeItem('access_token') } catch { /* Storage may be unavailable. */ }
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

let sessionBootstrap: Promise<void> | null = null

async function createOrResumeAnonymousSession(): Promise<void> {
  const accessToken = token()
  const payload = accessToken ? decodePayload(accessToken) : null
  const expiresAt = typeof payload?.exp === 'number' ? payload.exp * 1000 : 0
  const subject = typeof payload?.sub === 'string' ? payload.sub : null
  let anonymousOwnerId: string | null = null
  let deviceId: string | null = null

  try {
    anonymousOwnerId = localStorage.getItem('kovian_anonymous_owner_id')
    deviceId = localStorage.getItem('kovian_anonymous_device_id')
  } catch {
    throw new Error('O navegador bloqueou o armazenamento local necessário para manter seus dados neste dispositivo.')
  }

  if (accessToken && subject && expiresAt > Date.now() + 60_000) return
  if (accessToken && subject && anonymousOwnerId !== subject) {
    throw new Error('A sessão anterior expirou. Para preservar os dados dessa conta, recupere o acesso antes de continuar.')
  }

  if (!deviceId) {
    if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
      throw new Error('Este navegador não oferece suporte à criação segura de uma sessão automática.')
    }
    deviceId = crypto.randomUUID()
    try {
      localStorage.setItem('kovian_anonymous_device_id', deviceId)
    } catch {
      throw new Error('Não foi possível guardar a sessão automática neste dispositivo.')
    }
  }

  let response: Response
  try {
    response = await fetch(baseUrl + '/auth/anonymous', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ device_id: deviceId }),
      signal: AbortSignal.timeout(15000),
    })
  } catch (error) {
    const cause = error as { message?: string }
    throw new Error(cause?.message || 'Não foi possível conectar ao serviço financeiro.')
  }

  const result = await response.json().catch(() => null) as {
    access_token?: unknown
    user?: FinanceAuthUser
    detail?: unknown
  } | null
  if (!response.ok || !result || typeof result.access_token !== 'string' || !result.user?.id) {
    const detail = typeof result?.detail === 'string' ? result.detail : ''
    throw new Error(detail || 'Não foi possível iniciar o acesso automático.')
  }

  try {
    localStorage.setItem('access_token', result.access_token)
    localStorage.setItem('kovian_anonymous_owner_id', result.user.id)
  } catch {
    throw new Error('Não foi possível guardar a sessão automática neste dispositivo.')
  }
}

export function ensureFinanceSession(): Promise<void> {
  if (!sessionBootstrap) {
    sessionBootstrap = createOrResumeAnonymousSession().finally(() => { sessionBootstrap = null })
  }
  return sessionBootstrap
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 15000): Promise<T> {
  await ensureFinanceSession()
  const accessToken = token()
  if (!accessToken) throw new Error('SESSION_UNAVAILABLE')
  const requestId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${++fallbackRequestId}`
  let response: Response
  try {
    response = await fetch(baseUrl + path, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
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
    const timedOut = cause?.name === 'TimeoutError' || cause?.name === 'AbortError'
    throw new FinanceApiError(0, requestId, timedOut ? 'TIMEOUT' : 'NETWORK_ERROR', timedOut ? `A operação excedeu o tempo limite de ${Math.round(timeoutMs / 1000)} segundos. Nenhum registro será apagado; confira o resultado antes de repetir.` : 'Não foi possível conectar ao serviço financeiro. Verifique a conexão e tente novamente.')
  }
  if (!response.ok) {
    let code = 'FINANCE_API_ERROR'
    let message: string | undefined
    try {
      const payload = await response.json() as { code?: unknown; error?: unknown; message?: unknown; detail?: unknown }
      const candidate = payload.code ?? payload.error
      if (typeof candidate === 'string' && candidate.trim()) code = candidate.trim().slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '_')
      const responseMessage = payload.message ?? payload.detail\n      if (typeof responseMessage === 'string' && responseMessage.trim()) message = responseMessage.trim().slice(0, 500)
    } catch {
      // Preserve the status-only error when the backend response is not JSON.
    }
    throw new FinanceApiError(response.status, response.headers.get('X-Request-ID') || requestId, code, message)
  }
  if (response.status === 204) return undefined as T
  try {
    return await response.json() as T
  } catch {
    throw new FinanceApiError(response.status, response.headers.get('X-Request-ID') || requestId, 'INVALID_RESPONSE', 'Finance API returned an invalid JSON response.')
  }
}

async function get<T>(path: string, schema?: { parse: (value: unknown) => T }): Promise<T> { const value = await request<unknown>(path); return schema ? schema.parse(value) : value as T }

async function postMultipart<T>(path: string, body: FormData): Promise<T> {
  await ensureFinanceSession()
  const accessToken = token()
  if (!accessToken) throw new Error('SESSION_UNAVAILABLE')
  const requestId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${++fallbackRequestId}`
  let response: Response
  try {
    response = await fetch(baseUrl + path, { method: 'POST', body, signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'X-Request-ID': requestId } })
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
    } catch {}
    throw new FinanceApiError(response.status, response.headers.get('X-Request-ID') || requestId, code, message)
  }
  if (response.status === 204) return undefined as T
  try {
    return await response.json() as T
  } catch {
    throw new FinanceApiError(response.status, response.headers.get('X-Request-ID') || requestId, 'INVALID_RESPONSE', 'Finance API returned an invalid JSON response.')
  }
}

async function post<T>(path: string, body: unknown, schema?: { parse: (value: unknown) => T }): Promise<T> {
  const value = await request<unknown>(path, { method: 'POST', body: JSON.stringify(body) })
  return schema ? schema.parse(value) : value as T
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

export function reconcileAccount(accountId: string) {
  return post<ReconciliationRun>(`/reconciliation/accounts/${encodeURIComponent(accountId)}`, {})
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
  return post<FinanceTransaction>('/transactions', input, financeTransactionSchema)
}

export function cancelTransaction(id: string) { return post<void>(`/transactions/${encodeURIComponent(id)}/cancel`, {}) }

export function createAccount(input: { ownerId: string; name: string; accountType: string; currency: string; openingBalance: number }) {
  return post<FinanceAccount>('/accounts', input, financeAccountSchema)
}

export function createCategory(input: { ownerId: string; name: string; kind: FinanceCategory['kind']; parentId?: string | null }) {
  return post<FinanceCategory>('/categories', input, financeCategorySchema)
}

export function createBudget(input: { ownerId: string; categoryId: string; period: FinanceBudget['period']; periodStart: string; limitAmount: number }) {
  return post<FinanceBudget>('/budgets', input, financeBudgetSchema)
}

export function createCard(input: { ownerId: string; name: string; brand?: string; lastFour?: string; creditLimit: number; closingDay: number; dueDay: number }) { return post<FinanceCard>('/cards', input, financeCardSchema) }
export function createCardPurchase(input: { ownerId: string; cardId: string; description: string; totalAmount: number; installments: number; purchasedAt?: string }) { return post<FinancePurchase>('/cards/purchases', input, financePurchaseSchema) }
export function getInvoicePurchases(id: string) { return get(`/cards/invoices/${encodeURIComponent(id)}/purchases`, financePurchaseListSchema) }
export function closeInvoice(id: string, ownerId: string) { return post<void>(`/cards/invoices/${encodeURIComponent(id)}/close?ownerId=${encodeURIComponent(ownerId)}`, {}) }
export function payInvoice(id: string, ownerId: string, accountId: string, amount?: number, idempotencyKey?: string) {
  const params = new URLSearchParams({ ownerId, accountId })
  if (amount !== undefined) params.set('amount', String(amount))
  if (idempotencyKey) params.set('idempotencyKey', idempotencyKey)
  return post<void>(`/cards/invoices/${encodeURIComponent(id)}/pay?${params.toString()}`, {})
}

export function createGoal(input: { ownerId: string; name: string; targetAmount: number; targetDate?: string | null }) {
  return post<FinanceGoal>('/goals', input, financeGoalSchema)
}
export function updateGoal(id: string, input: { name: string; targetAmount: number; targetDate?: string | null }) {
  return request<unknown>(`/goals/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }).then(value => financeGoalSchema.parse(value))
}
export function contributeToGoal(id: string, amount: number) {
  return post<FinanceGoal>(`/goals/${encodeURIComponent(id)}/contributions`, { amount }, financeGoalSchema)
}
export function archiveGoal(id: string) {
  return post<FinanceGoal>(`/goals/${encodeURIComponent(id)}/archive`, {}, financeGoalSchema)
}

export function getRecurring() { return get('/recurring', financeRecurringListSchema) }
export function processRecurringDue(date: string) {
  return request<number>(`/recurring/process-due?date=${encodeURIComponent(date)}`, { method: 'POST', body: JSON.stringify({}) })
}
export function createRecurring(input: { accountId: string; categoryId?: string | null; description: string; amount: number; transactionType: 'INCOME' | 'EXPENSE'; frequency: string; nextOccurrence: string; endDate?: string | null }) { return post<FinanceRecurring>('/recurring', input, financeRecurringSchema) }
export function updateRecurring(id: string, input: { accountId: string; categoryId?: string | null; description: string; amount: number; transactionType: 'INCOME' | 'EXPENSE'; frequency: string; nextOccurrence: string; endDate?: string | null }) {
  return request<unknown>(`/recurring/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }).then(value => financeRecurringSchema.parse(value))
}
export function pauseRecurring(id: string) { return post<void>(`/recurring/${encodeURIComponent(id)}/pause`, {}) }
export function resumeRecurring(id: string) { return post<void>(`/recurring/${encodeURIComponent(id)}/resume`, {}) }
export function archiveRecurring(id: string) {
  return request<void>(`/recurring/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({}) })
}
export function getAnalytics(from: string, to: string, ownerId: string) { return get(`/analytics/dashboard?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, financeAnalyticsSchema) }
export function getCategoryAnalytics(from: string, to: string, ownerId: string) { return get<Record<string, number>>(`/analytics/categories?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, z.record(z.string(), z.number().finite())) }

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

export type FinanceImportError = { rowNumber: number; errorCode: string; message: string }

export function importCsv(accountId: string, file: File) {
  const form = new FormData()
  form.append('accountId', accountId)
  form.append('file', file)
  return postMultipart<FinanceImport>('/imports/csv', form).then(value => financeImportSchema.parse(value))
}
export function getImportHistory() { return get('/imports', financeImportListSchema) }
export function getImportErrors(id: string) { return get(`/imports/${encodeURIComponent(id)}/errors`, financeImportErrorListSchema) }

export type IntegrationStatus = {
  adapters: Record<string, { enabled: boolean; configured: boolean }>
  outbox: { pending: number; processing: number; failed: number }
}
const integrationStatusSchema = z.object({
  adapters: z.record(z.string(), z.object({ enabled: z.boolean(), configured: z.boolean() })),
  outbox: z.object({ pending: z.number().int().nonnegative(), processing: z.number().int().nonnegative(), failed: z.number().int().nonnegative() }),
})
export function getIntegrationStatus() { return get('/integrations/status', integrationStatusSchema) }

export function getAssets(ownerId: string) { return get(`/assets?ownerId=${encodeURIComponent(ownerId)}`, financeAssetListSchema) }
export function getLiabilities(ownerId: string) { return get(`/liabilities?ownerId=${encodeURIComponent(ownerId)}`, financeLiabilityListSchema) }
export type FinanceInsight = { type: string; title: string; explanation: string; severity: string; generatedAt: string }
const financeInsightSchema=z.object({type:z.string(),title:z.string(),explanation:z.string(),severity:z.string(),generatedAt:z.string()})
export function getFinancialInsights(ownerId:string,from:string,to:string){return get(`/ai/finance/insights?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,z.array(financeInsightSchema))}

export function getDebts(ownerId: string) { return get(`/debts?ownerId=${encodeURIComponent(ownerId)}`, financeDebtListSchema) }

export function getNotifications(unreadOnly = false) { return get(`/notifications?unreadOnly=${unreadOnly}`, financeNotificationListSchema) }
export function markNotificationRead(id: string) { return post<void>(`/notifications/${encodeURIComponent(id)}/read`, {}) }
export function markAllNotificationsRead() { return post<{ markedRead: number }>('/notifications/read-all', {}) }

export function getFinancialSnapshots() { return get('/snapshots', financeSnapshotListSchema) }

export async function createTransfer(input: { fromAccountId: string; toAccountId: string; amount: number; description: string }, idempotencyKey?: string) {
  const key = idempotencyKey || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const value = await request<unknown>('/transfers', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(input) })
  return financeTransferSchema.parse(value)
}


export type ManagementResource = 'students' | 'modalities' | 'lessons' | 'payments' | 'expenses' | 'waitlist' | 'calendar_events'
export type ManagementRecord = {
  id: string
  sourceId: string | null
  data: Record<string, unknown>
  archived: boolean
  createdAt: string
  updatedAt: string
}
export type ManagementPage = {
  page: number
  size: number
  totalElements: number
  hasNext: boolean
  records: ManagementRecord[]
}
export function getManagementRecords(resource: ManagementResource, includeArchived = false) {
  return get<ManagementRecord[]>(`/management/${resource}${includeArchived ? '?includeArchived=true' : ''}`)
}
export function getManagementRecordsPage(resource: ManagementResource, includeArchived = false, page = 0, size = 50) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (includeArchived) params.set('includeArchived', 'true')
  return get<ManagementPage>(`/management/${resource}/page?${params.toString()}`)
}
export function createManagementRecord(resource: ManagementResource, data: Record<string, unknown>, sourceId?: string) {
  return post<ManagementRecord>(`/management/${resource}`, { data, ...(sourceId ? { sourceId } : {}) })
}
export function updateManagementRecord(resource: ManagementResource, id: string, data: Record<string, unknown>) {
  return request<ManagementRecord>(`/management/${resource}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ data }) })
}
export function archiveManagementRecord(resource: ManagementResource, id: string) {
  return request<{ archived: boolean; id: string }>(`/management/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' })
}


export function importManagementRecords(
  resource: ManagementResource,
  records: Array<{ sourceId: string; data: Record<string, unknown> }>,
) {
  return request<{ resource: ManagementResource; inserted: number; updated: number; unchanged: number; unresolvedStudentLinks: number }>(
    `/management/import-batch/${resource}`,
    { method: 'POST', body: JSON.stringify({ records }) },
    120000,
  )
}

export function restoreManagementRecord(resource: ManagementResource, id: string) {
  return request<{ restored: boolean; id: string }>(`/management/${resource}/${encodeURIComponent(id)}/restore`, { method: 'POST', body: JSON.stringify({}) })
}

export type ManagementReconciliation = {
  resources: Record<string, { expectedCount: number; actualCount: number; delta: number | null }>
  sourceIds: Record<string, { expectedCount: number; actualCount: number; missingCount: number; unexpectedCount: number; missingSample: string[]; unexpectedSample: string[] }>
  unresolvedStudentLinks: number
  reconciled: boolean
}
export function reconcileManagement(
  expectedCounts: Partial<Record<ManagementResource, number>>,
  expectedSourceIds: Partial<Record<ManagementResource, string[]>> = {},
) {
  return request<ManagementReconciliation>('/management/reconcile', {
    method: 'POST',
    body: JSON.stringify({ expectedCounts, expectedSourceIds }),
  }, 120000)
}
