import { computed, type Ref } from 'vue'
import type { Income, Expense, Frequency, ExpenseCategory } from '@/types/finance'

function monthlyAmount(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case 'weekly':
      return (amount * 52) / 12
    case 'bi-weekly':
      return (amount * 26) / 12
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'yearly':
      return amount / 12
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export interface MonthSummary {
  month: string
  label: string
  income: number
  expenses: number
  net: number
}

export interface CategorySummary {
  category: ExpenseCategory
  total: number
  percent: number
}

export interface YearReview {
  year: number
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
  months: MonthSummary[]
  topCategories: CategorySummary[]
  bestMonth: MonthSummary | null
  worstMonth: MonthSummary | null
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const date = new Date(parseInt(y ?? '2026', 10), parseInt(m ?? '1', 10) - 1)
  return date.toLocaleDateString('en-US', { month: 'short' })
}

function buildReview(
  year: number,
  incomes: Income[],
  expenses: Expense[],
): YearReview {
  // Build 12 months
  const months: MonthSummary[] = []
  for (let m = 1; m <= 12; m++) {
    const ym = `${year}-${String(m).padStart(2, '0')}`
    months.push({ month: ym, label: getMonthLabel(ym), income: 0, expenses: 0, net: 0 })
  }

  // Distribute recurring incomes across all 12 months
  for (const inc of incomes) {
    if (inc.type === 'recurring') {
      const monthly = monthlyAmount(inc.amount, inc.frequency)
      for (const m of months) {
        m.income = round(m.income + monthly)
      }
    } else {
      // Adhoc: if its date is in this year, put it in that month
      const ym = inc.date.substring(0, 7)
      const target = months.find((m) => m.month === ym)
      if (target) {
        target.income = round(target.income + inc.amount)
      }
    }
  }

  // Distribute recurring expenses across all 12 months
  for (const exp of expenses) {
    if (exp.type === 'recurring') {
      const monthly = monthlyAmount(exp.amount, exp.frequency)
      for (const m of months) {
        m.expenses = round(m.expenses + monthly)
      }
    } else {
      if (exp.dueDate) {
        const ym = exp.dueDate.substring(0, 7)
        const target = months.find((m) => m.month === ym)
        if (target) {
          target.expenses = round(target.expenses + exp.amount)
        }
      }
    }
  }

  // Compute net per month
  for (const m of months) {
    m.net = round(m.income - m.expenses)
  }

  const totalIncome = round(months.reduce((s, m) => s + m.income, 0))
  const totalExpenses = round(months.reduce((s, m) => s + m.expenses, 0))
  const netSavings = round(totalIncome - totalExpenses)
  const savingsRate = totalIncome > 0 ? round((netSavings / totalIncome) * 100) : 0

  // Category breakdown
  const catMap = new Map<ExpenseCategory, number>()
  for (const exp of expenses) {
    const cat: ExpenseCategory = exp.category ?? 'Other'
    const prev = catMap.get(cat) ?? 0
    if (exp.type === 'recurring') {
      catMap.set(cat, prev + monthlyAmount(exp.amount, exp.frequency) * 12)
    } else if (exp.dueDate && exp.dueDate.startsWith(String(year))) {
      catMap.set(cat, prev + exp.amount)
    }
  }

  const topCategories: CategorySummary[] = [...catMap.entries()]
    .map(([category, total]) => ({
      category,
      total: round(total),
      percent: totalExpenses > 0 ? round((total / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // Best and worst months (by net)
  const monthsWithActivity = months.filter((m) => m.income > 0 || m.expenses > 0)
  const bestMonth = monthsWithActivity.length > 0
    ? monthsWithActivity.reduce((best, m) => (m.net > best.net ? m : best))
    : null
  const worstMonth = monthsWithActivity.length > 0
    ? monthsWithActivity.reduce((worst, m) => (m.net < worst.net ? m : worst))
    : null

  return {
    year,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    months,
    topCategories,
    bestMonth,
    worstMonth,
  }
}

export function useYearReview(
  incomes: Ref<Income[]> | Income[],
  expenses: Ref<Expense[]> | Expense[],
  selectedYear: Ref<number>,
) {
  const incomesVal = computed(() => ('value' in incomes ? incomes.value : incomes))
  const expensesVal = computed(() => ('value' in expenses ? expenses.value : expenses))

  const review = computed<YearReview>(() =>
    buildReview(selectedYear.value, incomesVal.value, expensesVal.value),
  )

  const availableYears = computed(() => {
    const years = new Set<number>()
    years.add(new Date().getFullYear())
    for (const inc of incomesVal.value) {
      const d = inc.type === 'recurring' ? inc.date : inc.date
      if (d) years.add(parseInt(d.substring(0, 4), 10))
      years.add(new Date(inc.createdAt).getFullYear())
    }
    for (const exp of expensesVal.value) {
      if (exp.dueDate) years.add(parseInt(exp.dueDate.substring(0, 4), 10))
      years.add(new Date(exp.createdAt).getFullYear())
    }
    return [...years].sort((a, b) => b - a)
  })

  return { review, availableYears }
}

