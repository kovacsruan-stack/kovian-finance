import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccounts, getGoals, getTransactions, type FinanceTransaction } from './api'

export const financeQueryKeys = {
  accounts: (ownerId: string) => ['finance', 'accounts', ownerId] as const,
  goals: (ownerId: string) => ['finance', 'goals', ownerId] as const,
  transactions: (ownerId: string, from: string, to: string) => ['finance', 'transactions', ownerId, from, to] as const,
}

export function useFinanceDashboard(ownerId: string | null) {
  const now = new Date()
  const from = new Date(now); from.setDate(from.getDate() - 90)
  const to = now.toISOString()
  const fromIso = from.toISOString()
  const accounts = useQuery({ queryKey: ownerId ? financeQueryKeys.accounts(ownerId) : ['finance','accounts','anonymous'], queryFn: () => getAccounts(ownerId!), enabled: Boolean(ownerId), staleTime: 30_000 })
  const goals = useQuery({ queryKey: ownerId ? financeQueryKeys.goals(ownerId) : ['finance','goals','anonymous'], queryFn: () => getGoals(ownerId!), enabled: Boolean(ownerId), staleTime: 30_000 })
  const transactions = useQuery({ queryKey: ownerId ? financeQueryKeys.transactions(ownerId, fromIso, to) : ['finance','transactions','anonymous'], queryFn: () => getTransactions(fromIso, to), enabled: Boolean(ownerId), staleTime: 15_000 })
  return { accounts, goals, transactions, isLoading: accounts.isLoading || goals.isLoading || transactions.isLoading, isError: accounts.isError || goals.isError || transactions.isError }
}

export function useInvalidateFinance() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['finance'] })
}

export function useFinanceMutation<TArgs, TResult>(mutationFn: (args: TArgs) => Promise<TResult>) {
  const invalidate = useInvalidateFinance()
  return useMutation<TResult, Error, TArgs>({ mutationFn, onSuccess: invalidate })
}