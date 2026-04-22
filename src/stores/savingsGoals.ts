import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { SavingsGoal } from '@/types/finance'
import { getDb } from '@/lib/firebase'
import { useFirestoreSync } from '@/composables/useFirestoreSync'
import { useActivityFeedStore } from '@/stores/activityFeed'
import { generateId } from '@/lib/id'
import { loadFromStorage } from '@/lib/storage'

export const useSavingsGoalsStore = defineStore('savingsGoals', () => {
  const goals = ref<SavingsGoal[]>(loadFromStorage('savings:goals', []))

  watch(
    goals,
    (val) => localStorage.setItem('savings:goals', JSON.stringify(val)),
    { deep: true },
  )

  function enableSync(householdId: string) {
    const db = getDb()
    if (!db) return
    useFirestoreSync(db, `households/${householdId}`, 'savingsGoals', goals)
  }

  function addGoal(data: { name: string; targetAmount: number; deadline: string; savedAmount?: number }, userId = 'anonymous') {
    const id = generateId()
    goals.value.push({
      id,
      name: data.name,
      targetAmount: data.targetAmount,
      savedAmount: data.savedAmount ?? 0,
      deadline: data.deadline,
      createdAt: new Date().toISOString(),
    })
    useActivityFeedStore().logActivity(userId, 'add', 'savings-goal', id, `Added savings goal "${data.name}"`)
  }

  function removeGoal(id: string, userId = 'anonymous') {
    const goal = goals.value.find((g) => g.id === id)
    goals.value = goals.value.filter((g) => g.id !== id)
    if (goal) {
      useActivityFeedStore().logActivity(userId, 'delete', 'savings-goal', id, `Deleted savings goal "${goal.name}"`)
    }
  }

  function updateGoal(id: string, data: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>, userId = 'anonymous') {
    const index = goals.value.findIndex((g) => g.id === id)
    if (index !== -1) {
      const existing = goals.value[index]
      if (existing) {
        goals.value.splice(index, 1, { ...existing, ...data })
        useActivityFeedStore().logActivity(userId, 'edit', 'savings-goal', id, `Updated savings goal "${existing.name}"`)
      }
    }
  }

  function addSavings(id: string, amount: number, userId = 'anonymous') {
    const goal = goals.value.find((g) => g.id === id)
    if (goal) {
      goal.savedAmount = Math.round((goal.savedAmount + amount) * 100) / 100
      useActivityFeedStore().logActivity(userId, 'edit', 'savings-goal', id, `Added $${amount} to "${goal.name}"`)
    }
  }

  function getGoalById(id: string): SavingsGoal | undefined {
    return goals.value.find((g) => g.id === id)
  }

  const activeGoals = computed(() =>
    goals.value.filter((g) => g.savedAmount < g.targetAmount),
  )

  const completedGoals = computed(() =>
    goals.value.filter((g) => g.savedAmount >= g.targetAmount),
  )

  return {
    goals,
    activeGoals,
    completedGoals,
    addGoal,
    removeGoal,
    updateGoal,
    addSavings,
    getGoalById,
    enableSync,
  }
})

