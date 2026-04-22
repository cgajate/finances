import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useFinancesStore } from '@/stores/finances'
import { useBudgetsStore } from '@/stores/budgets'
import type { Frequency } from '@/types/finance'
import { getDb } from '@/lib/firebase'
import { useFirestoreSync } from '@/composables/useFirestoreSync'

export interface Notification {
  id: string
  kind: 'expense-due' | 'income-received' | 'budget-warning' | 'budget-over'
  sourceId: string
  description: string
  amount: number
  dueDate: string | null
  daysUntilDue: number | null
}

interface MutedEntry {
  sourceId: string
  mutedUntil: string // ISO date — muted until this date
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // ignore
  }
  return fallback
}

function getNextDueDate(dueDate: string, frequency: Frequency): string {
  const due = new Date(dueDate + 'T00:00:00')
  switch (frequency) {
    case 'weekly':
      due.setDate(due.getDate() + 7)
      break
    case 'bi-weekly':
      due.setDate(due.getDate() + 14)
      break
    case 'monthly':
      due.setMonth(due.getMonth() + 1)
      break
    case 'quarterly':
      due.setMonth(due.getMonth() + 3)
      break
    case 'yearly':
      due.setFullYear(due.getFullYear() + 1)
      break
  }
  return due.toISOString().split('T')[0] ?? dueDate
}

function daysBetween(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export const useNotificationsStore = defineStore('notifications', () => {
  const financesStore = useFinancesStore()

  // Persisted state: dismissed income IDs (one-time) and muted expenses
  const dismissedIncomeIds = ref<string[]>(
    loadFromStorage('notifications:dismissedIncomes', []),
  )
  const mutedExpenses = ref<MutedEntry[]>(
    loadFromStorage('notifications:mutedExpenses', []),
  )
  const dismissedBudgetIds = ref<string[]>(
    loadFromStorage('notifications:dismissedBudgets', []),
  )

  watch(
    dismissedIncomeIds,
    (val) => localStorage.setItem('notifications:dismissedIncomes', JSON.stringify(val)),
    { deep: true },
  )
  watch(
    mutedExpenses,
    (val) => localStorage.setItem('notifications:mutedExpenses', JSON.stringify(val)),
    { deep: true },
  )
  watch(
    dismissedBudgetIds,
    (val) => localStorage.setItem('notifications:dismissedBudgets', JSON.stringify(val)),
    { deep: true },
  )

  // Clean up expired mutes
  function cleanExpiredMutes() {
    const today = new Date().toISOString().split('T')[0] ?? ''
    mutedExpenses.value = mutedExpenses.value.filter((m) => m.mutedUntil > today)
  }

  function isExpenseMuted(sourceId: string): boolean {
    const today = new Date().toISOString().split('T')[0] ?? ''
    return mutedExpenses.value.some((m) => m.sourceId === sourceId && m.mutedUntil > today)
  }

  // Clean up expired mutes once on store init
  cleanExpiredMutes()

  // Expense notifications: due within 7 days
  const expenseNotifications = computed<Notification[]>(() => {
    const results: Notification[] = []

    for (const expense of financesStore.expenses) {
      if (!expense.dueDate) continue
      if (isExpenseMuted(expense.id)) continue

      const days = daysBetween(expense.dueDate)

      // Due within 7 days (including overdue up to 7 days past)
      if (days <= 7 && days >= -7) {
        results.push({
          id: `expense-${expense.id}`,
          kind: 'expense-due',
          sourceId: expense.id,
          description: expense.description,
          amount: expense.amount,
          dueDate: expense.dueDate,
          daysUntilDue: days,
        })
      }
    }

    results.sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0))
    return results
  })

  // Income notifications: one-time per new income entry
  const incomeNotifications = computed<Notification[]>(() => {
    const results: Notification[] = []

    for (const income of financesStore.incomes) {
      if (dismissedIncomeIds.value.includes(income.id)) continue

      const date = income.type === 'recurring' ? income.date : income.date
      if (!date) continue

      const days = daysBetween(date)
      // Show for income arriving within 7 days or up to 1 day past
      if (days <= 7 && days >= -1) {
        results.push({
          id: `income-${income.id}`,
          kind: 'income-received',
          sourceId: income.id,
          description: income.description,
          amount: income.amount,
          dueDate: date,
          daysUntilDue: days,
        })
      }
    }

    return results
  })

  const budgetNotifications = computed<Notification[]>(() => {
    const budgetsStore = useBudgetsStore()
    const results: Notification[] = []
    for (const bs of budgetsStore.budgetStatus) {
      const notifId = bs.status === 'over' ? `budget-over-${bs.category}` : `budget-warn-${bs.category}`
      if (dismissedBudgetIds.value.includes(notifId)) continue
      if (bs.status === 'over') {
        results.push({
          id: notifId,
          kind: 'budget-over',
          sourceId: bs.category,
          description: `${bs.category} budget exceeded!`,
          amount: bs.spent,
          dueDate: null,
          daysUntilDue: null,
        })
      } else if (bs.status === 'warning') {
        results.push({
          id: notifId,
          kind: 'budget-warning',
          sourceId: bs.category,
          description: `${bs.category} budget at ${Math.round(bs.percent)}%`,
          amount: bs.spent,
          dueDate: null,
          daysUntilDue: null,
        })
      }
    }
    return results
  })

  const allNotifications = computed(() => [
    ...expenseNotifications.value,
    ...incomeNotifications.value,
    ...budgetNotifications.value,
  ])

  const unreadCount = computed(() => allNotifications.value.length)

  // Actions
  function dismissIncome(sourceId: string) {
    if (!dismissedIncomeIds.value.includes(sourceId)) {
      dismissedIncomeIds.value.push(sourceId)
    }
  }

  function muteExpense(sourceId: string) {
    // Find the expense to determine mute duration based on frequency
    const expense = financesStore.getExpenseById(sourceId)
    if (!expense || !expense.dueDate) return

    let mutedUntil: string
    if (expense.type === 'recurring') {
      mutedUntil = getNextDueDate(expense.dueDate, expense.frequency)
    } else {
      // Adhoc: mute for 30 days (effectively forever for one-time)
      const d = new Date()
      d.setDate(d.getDate() + 30)
      mutedUntil = d.toISOString().split('T')[0] ?? ''
    }

    // Remove existing mute if any, then add new
    mutedExpenses.value = mutedExpenses.value.filter((m) => m.sourceId !== sourceId)
    mutedExpenses.value.push({ sourceId, mutedUntil })
  }

  function unmuteExpense(sourceId: string) {
    mutedExpenses.value = mutedExpenses.value.filter((m) => m.sourceId !== sourceId)
  }

  function dismissBudget(notifId: string) {
    if (!dismissedBudgetIds.value.includes(notifId)) {
      dismissedBudgetIds.value.push(notifId)
    }
  }

  function dismissAll() {
    // Dismiss all income notifications
    for (const n of incomeNotifications.value) {
      dismissIncome(n.sourceId)
    }
    // Mute all expense notifications
    for (const n of expenseNotifications.value) {
      muteExpense(n.sourceId)
    }
    // Dismiss all budget notifications
    for (const n of budgetNotifications.value) {
      dismissBudget(n.id)
    }
  }

  // --- Firestore sync ---
  function enableSync(householdId: string) {
    const db = getDb()
    if (!db) return
    const path = `households/${householdId}`
    useFirestoreSync(db, path, 'dismissedIncomeIds', dismissedIncomeIds)
    useFirestoreSync(db, path, 'mutedExpenses', mutedExpenses)
    useFirestoreSync(db, path, 'dismissedBudgetIds', dismissedBudgetIds)
  }

  return {
    expenseNotifications,
    incomeNotifications,
    budgetNotifications,
    allNotifications,
    unreadCount,
    dismissIncome,
    muteExpense,
    unmuteExpense,
    dismissBudget,
    dismissAll,
    isExpenseMuted,
    enableSync,
  }
})

