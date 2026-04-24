import { computed, type Ref } from 'vue'
import type { Income, Expense, Frequency } from '@/types/finance'
import { advanceDate } from '@/lib/dateUtils'
import { getEffectiveAmount } from '@/lib/overrides'

export interface CalendarEvent {
  id: string
  date: string
  description: string
  amount: number
  kind: 'income' | 'expense'
  frequency: Frequency | 'one-time'
  category?: string
}

export interface CalendarDay {
  date: string
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
  totalIncome: number
  totalExpenses: number
}

export interface CalendarMonth {
  year: number
  month: number
  label: string
  weeks: CalendarDay[][]
  totalIncome: number
  totalExpenses: number
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0] ?? ''
}

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Generate all occurrences of a recurring item within a date range.
 */
function generateOccurrences(
  startDate: string,
  frequency: Frequency,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  const dates: string[] = []
  let current = startDate

  // If start is before range, advance to range
  while (current < rangeStart) {
    current = advanceDate(current, frequency)
  }

  // Collect dates within range
  for (let i = 0; i < 200 && current <= rangeEnd; i++) {
    dates.push(current)
    current = advanceDate(current, frequency)
  }

  return dates
}

export function useBillCalendar(
  incomes: Ref<Income[]> | Income[],
  expenses: Ref<Expense[]> | Expense[],
  year: Ref<number>,
  month: Ref<number>, // 0-based
) {
  const incomesVal = computed(() => ('value' in incomes ? incomes.value : incomes))
  const expensesVal = computed(() => ('value' in expenses ? expenses.value : expenses))

  const calendar = computed<CalendarMonth>(() => {
    const y = year.value
    const m = month.value

    // Build the calendar grid
    const firstDay = new Date(y, m, 1)
    const lastDay = new Date(y, m + 1, 0)
    const startOfGrid = new Date(firstDay)
    startOfGrid.setDate(startOfGrid.getDate() - startOfGrid.getDay()) // Sunday start
    const endOfGrid = new Date(lastDay)
    endOfGrid.setDate(endOfGrid.getDate() + (6 - endOfGrid.getDay())) // Saturday end

    const rangeStart = toDateStr(startOfGrid)
    const rangeEnd = toDateStr(endOfGrid)

    // Collect all events in range
    const eventsByDate = new Map<string, CalendarEvent[]>()

    // Process incomes
    for (const inc of incomesVal.value) {
      if (inc.type === 'recurring' && inc.date) {
        const dates = generateOccurrences(inc.date, inc.frequency, rangeStart, rangeEnd)
        for (const d of dates) {
          const monthKey = d.substring(0, 7)
          const ev: CalendarEvent = {
            id: `${inc.id}-${d}`,
            date: d,
            description: inc.description,
            amount: getEffectiveAmount(inc.amount, inc.overrides, monthKey),
            kind: 'income',
            frequency: inc.frequency,
            category: inc.category,
          }
          const list = eventsByDate.get(d) ?? []
          list.push(ev)
          eventsByDate.set(d, list)
        }
      } else if (inc.type === 'adhoc') {
        const d = inc.date
        if (d >= rangeStart && d <= rangeEnd) {
          const ev: CalendarEvent = {
            id: inc.id,
            date: d,
            description: inc.description,
            amount: inc.amount,
            kind: 'income',
            frequency: 'one-time',
            category: inc.category,
          }
          const list = eventsByDate.get(d) ?? []
          list.push(ev)
          eventsByDate.set(d, list)
        }
      }
    }

    // Process expenses (exclude pending/rejected approval expenses)
    for (const exp of expensesVal.value) {
      if (exp.approvalStatus && exp.approvalStatus !== 'approved') continue
      if (exp.type === 'recurring' && exp.dueDate) {
        const dates = generateOccurrences(exp.dueDate, exp.frequency, rangeStart, rangeEnd)
        for (const d of dates) {
          const monthKey = d.substring(0, 7)
          const ev: CalendarEvent = {
            id: `${exp.id}-${d}`,
            date: d,
            description: exp.description,
            amount: getEffectiveAmount(exp.amount, exp.overrides, monthKey),
            kind: 'expense',
            frequency: exp.frequency,
            category: exp.category,
          }
          const list = eventsByDate.get(d) ?? []
          list.push(ev)
          eventsByDate.set(d, list)
        }
      } else if (exp.type === 'adhoc') {
        const d = exp.dueDate ?? exp.createdAt.split('T')[0] ?? ''
        if (d && d >= rangeStart && d <= rangeEnd) {
          const ev: CalendarEvent = {
            id: exp.id,
            date: d,
            description: exp.description,
            amount: exp.amount,
            kind: 'expense',
            frequency: 'one-time',
            category: exp.category,
          }
          const list = eventsByDate.get(d) ?? []
          list.push(ev)
          eventsByDate.set(d, list)
        }
      }
    }

    // Build weeks
    const todayStr = toDateStr(new Date())
    const weeks: CalendarDay[][] = []
    let current = new Date(startOfGrid)
    let monthTotalIncome = 0
    let monthTotalExpenses = 0

    while (current <= endOfGrid) {
      const week: CalendarDay[] = []
      for (let dw = 0; dw < 7; dw++) {
        const dateStr = toDateStr(current)
        const events = eventsByDate.get(dateStr) ?? []
        const totalIncome = events
          .filter((e) => e.kind === 'income')
          .reduce((s, e) => s + e.amount, 0)
        const totalExpenses = events
          .filter((e) => e.kind === 'expense')
          .reduce((s, e) => s + e.amount, 0)

        const isCurrentMonth = current.getMonth() === m && current.getFullYear() === y
        if (isCurrentMonth) {
          monthTotalIncome += totalIncome
          monthTotalExpenses += totalExpenses
        }

        week.push({
          date: dateStr,
          dayOfMonth: current.getDate(),
          isCurrentMonth,
          isToday: dateStr === todayStr,
          events,
          totalIncome,
          totalExpenses,
        })
        current.setDate(current.getDate() + 1)
      }
      weeks.push(week)
    }

    return {
      year: y,
      month: m,
      label: getMonthLabel(y, m),
      weeks,
      totalIncome: Math.round(monthTotalIncome * 100) / 100,
      totalExpenses: Math.round(monthTotalExpenses * 100) / 100,
    }
  })

  return { calendar }
}

