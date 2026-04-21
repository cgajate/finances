import { computed, type Ref } from 'vue'
import type { Expense, Frequency, ExpenseCategory } from '@/types/finance'
import { useCategoriesStore } from '@/stores/categories'

function monthlyEquivalent(amount: number, frequency: Frequency): number {
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

function toYearMonth(dateStr: string): string {
  return dateStr.substring(0, 7)
}

function generatePastMonths(count: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
  }
  return months
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const date = new Date(parseInt(y ?? '2026', 10), parseInt(m ?? '1', 10) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export interface CategoryMonthData {
  month: string
  label: string
  amount: number
}

export interface CategoryTrend {
  category: ExpenseCategory
  months: CategoryMonthData[]
  total: number
  average: number
  /** Percent change from first half to second half of the range */
  trend: number
  direction: 'up' | 'down' | 'flat'
}

export interface SpendingTrendsSummary {
  months: string[]
  monthLabels: string[]
  categories: CategoryTrend[]
  totalByMonth: CategoryMonthData[]
  maxMonthlyTotal: number
}

export function useSpendingTrends(
  expenses: Ref<Expense[]> | Expense[],
  monthCount: Ref<number>,
) {
  const expensesVal = computed(() => ('value' in expenses ? expenses.value : expenses))

  const trends = computed<SpendingTrendsSummary>(() => {
    const months = generatePastMonths(monthCount.value)
    const monthLabels = months.map(getMonthLabel)

    const allCats = useCategoriesStore().activeExpenseCategories as ExpenseCategory[]

    // Build a map: category -> month -> amount
    const catMap = new Map<ExpenseCategory, Map<string, number>>()
    for (const cat of allCats) {
      catMap.set(cat, new Map(months.map((m) => [m, 0])))
    }

    for (const exp of expensesVal.value) {
      const cat: ExpenseCategory = exp.category ?? 'Other'
      const monthMap = catMap.get(cat)
      if (!monthMap) continue

      if (exp.type === 'recurring') {
        // Distribute recurring across all months
        const monthlyAmt = monthlyEquivalent(exp.amount, exp.frequency)
        for (const m of months) {
          const prev = monthMap.get(m) ?? 0
          monthMap.set(m, prev + monthlyAmt)
        }
      } else if (exp.dueDate) {
        // Adhoc: place in its month
        const ym = toYearMonth(exp.dueDate)
        if (monthMap.has(ym)) {
          const prev = monthMap.get(ym) ?? 0
          monthMap.set(ym, prev + exp.amount)
        }
      }
    }

    // Build category trends
    const categories: CategoryTrend[] = []
    for (const cat of allCats) {
      const monthMap = catMap.get(cat)!
      const monthData: CategoryMonthData[] = months.map((m, i) => ({
        month: m,
        label: monthLabels[i] ?? m,
        amount: Math.round((monthMap.get(m) ?? 0) * 100) / 100,
      }))

      const total = monthData.reduce((s, d) => s + d.amount, 0)
      if (total === 0) continue // Skip categories with no spending

      const average = Math.round((total / months.length) * 100) / 100

      // Compute trend: compare first half avg vs second half avg
      const half = Math.floor(months.length / 2)
      const firstHalf = monthData.slice(0, half)
      const secondHalf = monthData.slice(half)
      const firstAvg =
        firstHalf.length > 0
          ? firstHalf.reduce((s, d) => s + d.amount, 0) / firstHalf.length
          : 0
      const secondAvg =
        secondHalf.length > 0
          ? secondHalf.reduce((s, d) => s + d.amount, 0) / secondHalf.length
          : 0

      let trend = 0
      let direction: CategoryTrend['direction'] = 'flat'
      if (firstAvg > 0) {
        trend = Math.round(((secondAvg - firstAvg) / firstAvg) * 100)
        if (trend > 2) direction = 'up'
        else if (trend < -2) direction = 'down'
      } else if (secondAvg > 0) {
        trend = 100
        direction = 'up'
      }

      categories.push({
        category: cat,
        months: monthData,
        total: Math.round(total * 100) / 100,
        average,
        trend,
        direction,
      })
    }

    // Sort by total descending
    categories.sort((a, b) => b.total - a.total)

    // Total by month (all categories combined)
    const totalByMonth: CategoryMonthData[] = months.map((m, i) => {
      const amount = categories.reduce((s, c) => {
        const md = c.months.find((cm) => cm.month === m)
        return s + (md?.amount ?? 0)
      }, 0)
      return { month: m, label: monthLabels[i] ?? m, amount: Math.round(amount * 100) / 100 }
    })

    const maxMonthlyTotal = Math.max(...totalByMonth.map((m) => m.amount), 1)

    return { months, monthLabels, categories, totalByMonth, maxMonthlyTotal }
  })

  return { trends }
}

