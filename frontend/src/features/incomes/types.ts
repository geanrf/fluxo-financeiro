export type Income = {
  id: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
  updatedAt: string
}

export type IncomePayload = {
  description: string
  amount: number
  category: string
  date: string
}
