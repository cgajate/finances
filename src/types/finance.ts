export type Frequency = 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface RecurringIncome {
  id: string
  type: 'recurring'
  amount: number
  frequency: Frequency
  description: string
  notes: string
  date: string | null // optional scheduled date
  createdAt: string
}

export interface AdhocIncome {
  id: string
  type: 'adhoc'
  amount: number
  description: string
  date: string
  createdAt: string
}

export type Income = RecurringIncome | AdhocIncome

export interface RecurringExpense {
  id: string
  type: 'recurring'
  amount: number
  frequency: Frequency
  description: string
  notes: string
  dueDate: string | null
  createdAt: string
}

export interface AdhocExpense {
  id: string
  type: 'adhoc'
  amount: number
  description: string
  notes: string
  dueDate: string | null
  createdAt: string
}

export type Expense = RecurringExpense | AdhocExpense

export interface ForecastLineItem {
  id: string
  description: string
  amount: number
  source: 'recurring' | 'adhoc'
  frequency?: Frequency
}

export interface MonthlyBreakdown {
  /** YYYY-MM format */
  month: string
  label: string
  incomeItems: ForecastLineItem[]
  expenseItems: ForecastLineItem[]
  totalIncome: number
  totalExpenses: number
  net: number
  cumulativeSavings: number
}

