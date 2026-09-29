import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccounts, getAnalytics, getGoals, getTransactions, type FinanceTransaction } from './api'

export function getLocalDayKey(date = new Date()) {
  return String(date.getFullYear()) + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
}

export function getDashboardWindow(dayKey: string) {
  const [year, month, day] = dayKey.split('-').map(Number)
  const end = new Date(year, month - 1, day, 23, 59, 59, 999)
  const start = new Date(end)
  start.setDate(start.getDate() - 90)
  return { fromIso: start.toISOString(), toIso: end.toISOString() }
}

export const financeQueryKeys = {
  accounts: (ownerId: string) => ['finance', 'accounts', ownerId] as const,
  goals: (ownerId: string) => ['finance', 'goals', ownerId] as const,
  transactions: (ownerId: string, from: string, to: string) => ['finance', 'transactions', ownerId, from, to] as const,
  analytics: (ownerId: string, from: string, to: string) => ['finance', 'analytics', ownerId, from, to] as const,
}

export function useFinanceDashboard(ownerId: string | null) {
  const dayKey = getLocalDayKey()
  const { fromIso, toIso } = useMemo(() => getDashboardWindow(dayKey), [dayKey])
  const accounts = useQuery({ queryKey: ownerId ? financeQueryKeys.accounts(ownerId) : ['finance','accounts','anonymous'], queryFn: () => getAccounts(ownerId!), enabled: Boolean(ownerId), staleTime: 30_000 })
  const goals = useQuery({ queryKey: ownerId ? financeQueryKeys.goals(ownerId) : ['finance','goals','anonymous'], queryFn: () => getGoals(ownerId!), enabled: Boolean(ownerId), staleTime: 30_000 })
  const transactions = useQuery({ queryKey: ownerId ? financeQueryKeys.transactions(ownerId, fromIso, toIso) : ['finance','transactions','anonymous'], queryFn: () => getTransactions(fromIso, toIso), enabled: Boolean(ownerId), staleTime: 15_000 })
  const analytics = useQuery({ queryKey: ownerId ? financeQueryKeys.analytics(ownerId, fromIso, toIso) : ['finance','analytics','anonymous'], queryFn: () => getAnalytics(fromIso, toIso, ownerId!), enabled: Boolean(ownerId), staleTime: 30_000 })
  return { accounts, goals, transactions, analytics, isLoading: accounts.isLoading || goals.isLoading || transactions.isLoading || analytics.isLoading, isError: accounts.isError || goals.isError || transactions.isError || analytics.isError }
}

export function useInvalidateFinance() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['finance'] })
}

export function useFinanceMutation<TArgs, TResult>(mutationFn: (args: TArgs) => Promise<TResult>) {
  const invalidate = useInvalidateFinance()
  return useMutation<TResult, Error, TArgs>({ mutationFn, onSuccess: invalidate })
}