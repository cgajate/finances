export type Frequency = 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly'

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Savings',
  'Other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Other',
] as const

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]

export interface RecurringIncome {
  id: string
  type: 'recurring'
  amount: number
  frequency: Frequency
  description: string
  notes: string
  date: string | null // optional scheduled date
  category?: IncomeCategory
  createdAt: string
}

export interface AdhocIncome {
  id: string
  type: 'adhoc'
  amount: number
  description: string
  date: string
  category?: IncomeCategory
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
  category?: ExpenseCategory
  createdAt: string
}

export interface AdhocExpense {
  id: string
  type: 'adhoc'
  amount: number
  description: string
  notes: string
  dueDate: string | null
  category?: ExpenseCategory
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

export interface Budget {
  id: string
  category: ExpenseCategory
  limit: number
  /** YYYY-MM format */
  month: string
}
