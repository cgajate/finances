import { computed, type Ref } from 'vue'
import type {
  Income,
  Expense,
  Frequency,
  MonthlyBreakdown,
  ForecastLineItem,
} from '@/types/finance'
import { getEffectiveAmount } from '@/lib/overrides'

/**
 * How many times a recurring item occurs in a single month.
 * Uses averaged values for sub-monthly frequencies.
 */
function occurrencesPerMonth(frequency: Frequency): number {
  switch (frequency) {
    case 'weekly':
      return 52 / 12
    case 'bi-weekly':
      return 26 / 12
    case 'monthly':
      return 1
    case 'quarterly':
      return 1 / 3
    case 'yearly':
      return 1 / 12
  }
}

/**
 * Check if a yearly/quarterly item falls in a specific month.
 * If the item has a date, match by month; otherwise use averaged amount.
 */
function recurringHitsMonth(
  frequency: Frequency,
  itemDate: string | null,
  targetMonth: string,
): { hits: boolean; multiplier: number } {
  // For weekly/bi-weekly/monthly: always hits, use averaged multiplier
  if (frequency === 'weekly' || frequency === 'bi-weekly' || frequency === 'monthly') {
    return { hits: true, multiplier: occurrencesPerMonth(frequency) }
  }

  // For quarterly/yearly: if we have a date, check which months it falls in
  if (itemDate) {
    const itemMonth = parseInt(itemDate.split('-')[1] ?? '0', 10)
    const targetMo = parseInt(targetMonth.split('-')[1] ?? '0', 10)

    if (frequency === 'yearly') {
      return { hits: itemMonth === targetMo, multiplier: itemMonth === targetMo ? 1 : 0 }
    }

    if (frequency === 'quarterly') {
      // Hits every 3 months from the item's month
      const diff = ((targetMo - itemMonth) % 12 + 12) % 12
      const isQuarterMonth = diff % 3 === 0
      return { hits: isQuarterMonth, multiplier: isQuarterMonth ? 1 : 0 }
    }
  }

  // No date — use averaged
  return { hits: true, multiplier: occurrencesPerMonth(frequency) }
}

function toYearMonth(dateStr: string): string {
  return dateStr.substring(0, 7)
}

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const date = new Date(parseInt(y ?? '2026', 10), parseInt(m ?? '1', 10) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function generateMonthRange(monthsBefore: number, monthsAfter: number): string[] {
  const months: string[] = []
  const now = new Date()

  for (let i = -monthsBefore; i <= monthsAfter; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
  }

  return months
}

export function useForecasting(
  incomes: Ref<Income[]> | Income[],
  expenses: Ref<Expense[]> | Expense[],
  monthsBefore: Ref<number>,
  monthsAfter: Ref<number>,
) {
  const incomesVal = computed(() => ('value' in incomes ? incomes.value : incomes))
  const expensesVal = computed(() => ('value' in expenses ? expenses.value : expenses))

  const breakdown = computed<MonthlyBreakdown[]>(() => {
    const months = generateMonthRange(monthsBefore.value, monthsAfter.value)
    let cumulative = 0

    return months.map((month) => {
      const incomeItems: ForecastLineItem[] = []
      const expenseItems: ForecastLineItem[] = []

      // Process incomes
      for (const inc of incomesVal.value) {
        if (inc.type === 'recurring') {
          const { hits, multiplier } = recurringHitsMonth(inc.frequency, inc.date, month)
          if (hits && multiplier > 0) {
            const amt = getEffectiveAmount(inc.amount, inc.overrides, month)
            incomeItems.push({
              id: inc.id,
              description: inc.description,
              amount: Math.round(amt * multiplier * 100) / 100,
              source: 'recurring',
              frequency: inc.frequency,
            })
          }
        } else {
          // Adhoc — place in its specific month
          if (toYearMonth(inc.date) === month) {
            incomeItems.push({
              id: inc.id,
              description: inc.description,
              amount: inc.amount,
              source: 'adhoc',
            })
          }
        }
      }

      // Process expenses
      for (const exp of expensesVal.value) {
        if (exp.type === 'recurring') {
          const { hits, multiplier } = recurringHitsMonth(exp.frequency, exp.dueDate, month)
          if (hits && multiplier > 0) {
            const amt = getEffectiveAmount(exp.amount, exp.overrides, month)
            expenseItems.push({
              id: exp.id,
              description: exp.description,
              amount: Math.round(amt * multiplier * 100) / 100,
              source: 'recurring',
              frequency: exp.frequency,
            })
          }
        } else {
          // Adhoc expense — place in its specific month if it has a date
          if (exp.dueDate && toYearMonth(exp.dueDate) === month) {
            expenseItems.push({
              id: exp.id,
              description: exp.description,
              amount: exp.amount,
              source: 'adhoc',
            })
          }
        }
      }

      const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0)
      const totalExpenses = expenseItems.reduce((s, e) => s + e.amount, 0)
      const net = Math.round((totalIncome - totalExpenses) * 100) / 100
      cumulative = Math.round((cumulative + net) * 100) / 100

      return {
        month,
        label: getMonthLabel(month),
        incomeItems,
        expenseItems,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        net,
        cumulativeSavings: cumulative,
      }
    })
  })

  const currentMonthIndex = computed(() => {
    const now = new Date()
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return breakdown.value.findIndex((b) => b.month === current)
  })

  const yearProjection = computed(() => {
    // Sum of net for the next 12 months (including current)
    const startIdx = Math.max(currentMonthIndex.value, 0)
    const next12 = breakdown.value.slice(startIdx, startIdx + 12)
    return {
      totalIncome: Math.round(next12.reduce((s, m) => s + m.totalIncome, 0) * 100) / 100,
      totalExpenses: Math.round(next12.reduce((s, m) => s + m.totalExpenses, 0) * 100) / 100,
      netSavings: Math.round(next12.reduce((s, m) => s + m.net, 0) * 100) / 100,
      months: next12,
    }
  })

  return { breakdown, currentMonthIndex, yearProjection }
}

