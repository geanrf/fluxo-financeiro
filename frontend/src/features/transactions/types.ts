export type TransactionType = 'INCOME' | 'EXPENSE'

export type FinancialTransaction = {
  id: string
  type: TransactionType
  description: string
  amount: number
  date: string
  category: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type TransactionPayload = {
  type: TransactionType
  description: string
  amount: number
  date: string
  category: string
  notes?: string
}
