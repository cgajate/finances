export type Frequency = 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly'

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

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

/** Per-month amount overrides for recurring items. Key is YYYY-MM format. */
export type MonthlyOverrides = Record<string, number>

export interface RecurringIncome {
  id: string
  type: 'recurring'
  amount: number
  frequency: Frequency
  description: string
  notes: string
  date: string | null
  category?: IncomeCategory
  createdAt: string
  createdBy?: string
  createdByPhoto?: string | null
  /** Per-month amount overrides — key is YYYY-MM, value is the adjusted amount */
  overrides?: MonthlyOverrides
}

export interface AdhocIncome {
  id: string
  type: 'adhoc'
  amount: number
  description: string
  date: string
  category?: IncomeCategory
  createdAt: string
  createdBy?: string
  createdByPhoto?: string | null
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
  assignedTo?: string
  createdAt: string
  createdBy?: string
  createdByPhoto?: string | null
  /** Per-month amount overrides — key is YYYY-MM, value is the adjusted amount */
  overrides?: MonthlyOverrides
  /** Approval workflow status — only set when approval is required */
  approvalStatus?: ApprovalStatus
}

export interface AdhocExpense {
  id: string
  type: 'adhoc'
  amount: number
  description: string
  notes: string
  dueDate: string | null
  category?: ExpenseCategory
  assignedTo?: string
  createdAt: string
  createdBy?: string
  createdByPhoto?: string | null
  /** Approval workflow status — only set when approval is required */
  approvalStatus?: ApprovalStatus
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

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  /** ISO date string — deadline */
  deadline: string
  createdAt: string
}

export type ActivityAction = 'add' | 'edit' | 'delete'
export type ActivityEntity = 'income' | 'expense' | 'budget' | 'savings-goal'

export interface ActivityEntry {
  id: string
  userId: string
  action: ActivityAction
  entity: ActivityEntity
  entityId: string
  description: string
  timestamp: string
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalRequest {
  id: string
  expenseId: string
  amount: number
  description: string
  requestedBy: string
  reviewedBy: string | null
  status: ApprovalStatus
  createdAt: string
  resolvedAt: string | null
}

export type NetWorthEntryKind = 'asset' | 'liability'

export interface NetWorthEntry {
  id: string
  kind: NetWorthEntryKind
  name: string
  amount: number
  createdAt: string
}
