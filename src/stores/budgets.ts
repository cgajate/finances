import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Budget, ExpenseCategory } from '@/types/finance'
import { EXPENSE_CATEGORIES } from '@/types/finance'
import { useFinancesStore } from '@/stores/finances'
import { getDb } from '@/lib/firebase'
import { useFirestoreSync } from '@/composables/useFirestoreSync'
import { useActivityFeedStore } from '@/stores/activityFeed'

function generateId(): string {
  return crypto.randomUUID()
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

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export interface BudgetStatus {
  category: ExpenseCategory
  limit: number
  spent: number
  percent: number
  status: 'ok' | 'warning' | 'over'
}

export const useBudgetsStore = defineStore('budgets', () => {
  const budgets = ref<Budget[]>(loadFromStorage('budgets:list', []))

  watch(
    budgets,
    (val) => localStorage.setItem('budgets:list', JSON.stringify(val)),
    { deep: true },
  )

  function enableSync(householdId: string) {
    const db = getDb()
    if (!db) return
    useFirestoreSync(db, `households/${householdId}`, 'budgets', budgets)
  }

  /** Get budgets for the current month, auto-copying from previous month if none exist */
  const currentBudgets = computed(() => {
    const month = currentMonth()
    let current = budgets.value.filter((b) => b.month === month)

    if (current.length === 0) {
      // Find the most recent month with budgets
      const months = [...new Set(budgets.value.map((b) => b.month))].sort().reverse()
      const prevMonth = months[0]
      if (prevMonth) {
        const prev = budgets.value.filter((b) => b.month === prevMonth)
        for (const b of prev) {
          const newBudget: Budget = {
            id: generateId(),
            category: b.category,
            limit: b.limit,
            month,
          }
          budgets.value.push(newBudget)
        }
        current = budgets.value.filter((b) => b.month === month)
      }
    }
    return current
  })

  const budgetStatus = computed<BudgetStatus[]>(() => {
    const financesStore = useFinancesStore()
    const spending = financesStore.spendingByCategory
    return currentBudgets.value.map((b) => {
      const spent = spending.get(b.category) ?? 0
      const percent = b.limit > 0 ? (spent / b.limit) * 100 : 0
      let status: BudgetStatus['status'] = 'ok'
      if (percent >= 100) status = 'over'
      else if (percent >= 80) status = 'warning'
      return { category: b.category, limit: b.limit, spent, percent, status }
    })
  })

  function setBudget(category: ExpenseCategory, limit: number, userId = 'anonymous') {
    const month = currentMonth()
    const existing = budgets.value.findIndex(
      (b) => b.category === category && b.month === month,
    )
    if (existing !== -1) {
      const item = budgets.value[existing]
      if (item) {
        budgets.value.splice(existing, 1, { ...item, limit })
        useActivityFeedStore().logActivity(userId, 'edit', 'budget', item.id, `Updated ${category} budget to $${limit}`)
      }
    } else {
      const id = generateId()
      budgets.value.push({ id, category, limit, month })
      useActivityFeedStore().logActivity(userId, 'add', 'budget', id, `Set ${category} budget to $${limit}`)
    }
  }

  function removeBudget(category: ExpenseCategory, userId = 'anonymous') {
    const month = currentMonth()
    const item = budgets.value.find(
      (b) => b.category === category && b.month === month,
    )
    budgets.value = budgets.value.filter(
      (b) => !(b.category === category && b.month === month),
    )
    if (item) {
      useActivityFeedStore().logActivity(userId, 'delete', 'budget', item.id, `Removed ${category} budget`)
    }
  }

  function getBudgetForCategory(category: ExpenseCategory): Budget | undefined {
    const month = currentMonth()
    return budgets.value.find((b) => b.category === category && b.month === month)
  }

  /** Categories that don't have a budget set for the current month */
  const availableCategories = computed(() => {
    const month = currentMonth()
    const used = new Set(
      budgets.value.filter((b) => b.month === month).map((b) => b.category),
    )
    return EXPENSE_CATEGORIES.filter((c) => !used.has(c))
  })

  return {
    budgets,
    currentBudgets,
    budgetStatus,
    setBudget,
    removeBudget,
    getBudgetForCategory,
    availableCategories,
    enableSync,
  }
})

