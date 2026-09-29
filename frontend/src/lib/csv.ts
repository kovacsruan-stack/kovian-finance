export function safeCsvCell(value: unknown): string {
  const text = String(value ?? '').replace(/"/g, '""')
  if (typeof value !== 'number' && /^[=+\-@]/.test(text)) return `"'"${text}"`
  return `"${text}"`
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(safeCsvCell).join(','), ...rows.map(row => row.map(safeCsvCell).join(','))].join('\n')
}

export type ExportableFinanceTransaction = {
  id: string
  categoryId: string | null
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  status: string
  occurredAt: string
}

/**
 * Produces the importer's documented CSV contract. Cancelled entries are
 * excluded because importing them as active transactions would alter balances.
 */
export function buildTransactionImportCsv(transactions: ExportableFinanceTransaction[]): string {
  const headers = ['date', 'description', 'amount', 'type', 'source_transaction_id', 'category_id']
  const rows = transactions
    .filter(transaction => transaction.status !== 'CANCELLED' && transaction.type !== 'TRANSFER')
    .map(transaction => [
      transaction.occurredAt.slice(0, 10),
      transaction.description,
      transaction.amount,
      transaction.type,
      transaction.id,
      transaction.categoryId ?? '',
    ])

  return buildCsv(headers, rows)
}
