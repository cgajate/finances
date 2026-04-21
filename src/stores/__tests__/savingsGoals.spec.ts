import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'

describe('savingsGoals store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('addGoal', () => {
    it('starts with empty goals', () => {
      const store = useSavingsGoalsStore()
      expect(store.goals).toHaveLength(0)
    })

    it('adds a goal with correct defaults', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'Vacation', targetAmount: 3000, deadline: '2026-12-31' })
      expect(store.goals).toHaveLength(1)
      const goal = store.goals[0]!
      expect(goal.name).toBe('Vacation')
      expect(goal.targetAmount).toBe(3000)
      expect(goal.savedAmount).toBe(0)
      expect(goal.deadline).toBe('2026-12-31')
      expect(goal.id).toBeTruthy()
      expect(goal.createdAt).toBeTruthy()
    })

    it('allows setting initial savedAmount', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'Car', targetAmount: 10000, deadline: '2027-06-01', savedAmount: 2500 })
      expect(store.goals[0]!.savedAmount).toBe(2500)
    })
  })

  describe('removeGoal', () => {
    it('removes a goal by id', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'A', targetAmount: 100, deadline: '2026-12-31' })
      store.addGoal({ name: 'B', targetAmount: 200, deadline: '2026-12-31' })
      const id = store.goals[0]!.id
      store.removeGoal(id)
      expect(store.goals).toHaveLength(1)
      expect(store.goals[0]!.name).toBe('B')
    })

    it('does nothing for non-existent id', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'A', targetAmount: 100, deadline: '2026-12-31' })
      store.removeGoal('nonexistent')
      expect(store.goals).toHaveLength(1)
    })
  })

  describe('updateGoal', () => {
    it('updates goal fields', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'Trip', targetAmount: 2000, deadline: '2026-12-31' })
      const id = store.goals[0]!.id
      store.updateGoal(id, { name: 'Beach Trip', targetAmount: 2500 })
      expect(store.goals[0]!.name).toBe('Beach Trip')
      expect(store.goals[0]!.targetAmount).toBe(2500)
    })

    it('does nothing for non-existent id', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'A', targetAmount: 100, deadline: '2026-12-31' })
      store.updateGoal('nonexistent', { name: 'Changed' })
      expect(store.goals[0]!.name).toBe('A')
    })
  })

  describe('addSavings', () => {
    it('increments savedAmount', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'Fund', targetAmount: 1000, deadline: '2026-12-31' })
      const id = store.goals[0]!.id
      store.addSavings(id, 250)
      expect(store.goals[0]!.savedAmount).toBe(250)
      store.addSavings(id, 100.50)
      expect(store.goals[0]!.savedAmount).toBe(350.50)
    })

    it('does nothing for non-existent id', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'A', targetAmount: 100, deadline: '2026-12-31' })
      store.addSavings('nonexistent', 50)
      expect(store.goals[0]!.savedAmount).toBe(0)
    })
  })

  describe('getGoalById', () => {
    it('returns the goal', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'X', targetAmount: 500, deadline: '2026-12-31' })
      const id = store.goals[0]!.id
      expect(store.getGoalById(id)?.name).toBe('X')
    })

    it('returns undefined for missing id', () => {
      const store = useSavingsGoalsStore()
      expect(store.getGoalById('nope')).toBeUndefined()
    })
  })

  describe('activeGoals', () => {
    it('returns goals where savedAmount < targetAmount', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'A', targetAmount: 1000, deadline: '2026-12-31' })
      store.addGoal({ name: 'B', targetAmount: 500, deadline: '2026-12-31', savedAmount: 500 })
      expect(store.activeGoals).toHaveLength(1)
      expect(store.activeGoals[0]!.name).toBe('A')
    })
  })

  describe('completedGoals', () => {
    it('returns goals where savedAmount >= targetAmount', () => {
      const store = useSavingsGoalsStore()
      store.addGoal({ name: 'Done', targetAmount: 100, deadline: '2026-12-31', savedAmount: 100 })
      store.addGoal({ name: 'Over', targetAmount: 50, deadline: '2026-12-31', savedAmount: 75 })
      store.addGoal({ name: 'Active', targetAmount: 500, deadline: '2026-12-31' })
      expect(store.completedGoals).toHaveLength(2)
      expect(store.completedGoals.map((g) => g.name)).toContain('Done')
      expect(store.completedGoals.map((g) => g.name)).toContain('Over')
    })
  })

  describe('localStorage persistence', () => {
    it('loads from localStorage on init', () => {
      localStorage.setItem(
        'savings:goals',
        JSON.stringify([
          { id: '1', name: 'Saved', targetAmount: 1000, savedAmount: 400, deadline: '2026-12-31', createdAt: '2026-01-01T00:00:00Z' },
        ]),
      )
      const store = useSavingsGoalsStore()
      expect(store.goals).toHaveLength(1)
      expect(store.goals[0]!.name).toBe('Saved')
    })

    it('handles invalid JSON gracefully', () => {
      localStorage.setItem('savings:goals', 'not-json')
      const store = useSavingsGoalsStore()
      expect(store.goals).toHaveLength(0)
    })
  })
})

