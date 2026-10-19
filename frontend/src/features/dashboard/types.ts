import type { TransactionType } from '../transactions/types'

export type MonthlySummary = {
  month: string
  income: number
  expense: number
  result: number
}

export type CategorySummary = {
  category: string
  amount: number
}

export type RecentTransaction = {
  id: string
  type: TransactionType
  description: string
  amount: number
  category: string
  date: string
}

export type DashboardSummary = {
  from: string
  to: string
  totalBalance: number
  periodIncome: number
  periodExpense: number
  periodResult: number
  monthlySummary: MonthlySummary[]
  expenseCategories: CategorySummary[]
  recentTransactions: RecentTransaction[]
}
