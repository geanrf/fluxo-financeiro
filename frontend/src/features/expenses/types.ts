export type Expense = {
  id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
  updatedAt: string
}

export type ExpensePayload = {
  description: string
  amount: number
  category: string
  date: string
}
