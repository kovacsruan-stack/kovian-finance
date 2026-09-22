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

export type ReconciliationRun = {
  id: string
  accountId: string
  expectedBalance: number
  actualBalance: number
  difference: number
  status: string
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1').replace(/\/$/, '')

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

async function get<T>(path: string): Promise<T> {
  const accessToken = token()
  if (!accessToken) throw new Error('AUTHENTICATION_REQUIRED')

  const response = await fetch(baseUrl + path, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) throw new Error(`FINANCE_API_${response.status}`)
  return response.json() as Promise<T>
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
  return get<FinanceCategory[]>(`/categories?ownerId=${encodeURIComponent(ownerId)}&kind=${kind}`)
}

export function getBudgets(ownerId: string, from: string, to: string) {
  return get<FinanceBudget[]>(`/budgets?ownerId=${encodeURIComponent(ownerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
}
