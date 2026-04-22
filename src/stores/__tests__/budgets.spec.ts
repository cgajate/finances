import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBudgetsStore } from '@/stores/budgets'

vi.mock('@/lib/firebase', () => ({ getDb: () => null }))

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

describe('budgets store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with empty budgets', () => {
    const store = useBudgetsStore()
    expect(store.budgets).toEqual([])
  })

  it('loads from localStorage', () => {
    const month = currentMonth()
    localStorage.setItem(
      'budgets:list',
      JSON.stringify([{ id: '1', category: 'Food', limit: 300, month }]),
    )
    setActivePinia(createPinia())
    const store = useBudgetsStore()
    expect(store.budgets).toHaveLength(1)
  })

  it('handles invalid JSON in localStorage', () => {
    localStorage.setItem('budgets:list', 'not-json')
    setActivePinia(createPinia())
    const store = useBudgetsStore()
    expect(store.budgets).toEqual([])
  })

  it('setBudget adds a new budget for current month', () => {
    const store = useBudgetsStore()
    store.setBudget('Food', 500)
    expect(store.budgets).toHaveLength(1)
    expect(store.budgets[0]!.category).toBe('Food')
    expect(store.budgets[0]!.limit).toBe(500)
    expect(store.budgets[0]!.month).toBe(currentMonth())
  })

  it('setBudget updates existing budget for same category and month', () => {
    const store = useBudgetsStore()
    store.setBudget('Food', 500)
    store.setBudget('Food', 700)
    expect(store.budgets).toHaveLength(1)
    expect(store.budgets[0]!.limit).toBe(700)
  })

  it('removeBudget removes a budget for current month', () => {
    const store = useBudgetsStore()
    store.setBudget('Food', 500)
    store.removeBudget('Food')
    const month = currentMonth()
    expect(store.budgets.filter((b) => b.month === month)).toHaveLength(0)
  })

  it('removeBudget with no matching budget does nothing', () => {
    const store = useBudgetsStore()
    store.removeBudget('Food')
    expect(store.budgets).toHaveLength(0)
  })

  it('getBudgetForCategory returns the budget', () => {
    const store = useBudgetsStore()
    store.setBudget('Food', 500)
    const budget = store.getBudgetForCategory('Food')
    expect(budget).toBeDefined()
    expect(budget!.limit).toBe(500)
  })

  it('getBudgetForCategory returns undefined when not found', () => {
    const store = useBudgetsStore()
    expect(store.getBudgetForCategory('Food')).toBeUndefined()
  })

  it('currentBudgets returns current month budgets', () => {
    const store = useBudgetsStore()
    store.setBudget('Food', 500)
    store.setBudget('Housing', 1500)
    expect(store.currentBudgets).toHaveLength(2)
  })

  it('currentBudgets rolls over from previous month when current is empty', () => {
    const store = useBudgetsStore()
    // Add a budget for previous month
    const prevDate = new Date()
    prevDate.setMonth(prevDate.getMonth() - 1)
    const prevMonth = prevDate.toISOString().slice(0, 7)
    store.budgets.push({ id: 'prev1', category: 'Food', limit: 300, month: prevMonth })
    // currentBudgets should auto-copy
    const current = store.currentBudgets
    expect(current.length).toBeGreaterThan(0)
    expect(current[0]!.month).toBe(currentMonth())
    expect(current[0]!.limit).toBe(300)
  })

  it('currentBudgets does not rollover when current month has budgets', () => {
    const store = useBudgetsStore()
    store.setBudget('Food', 500)
    const prevDate = new Date()
    prevDate.setMonth(prevDate.getMonth() - 1)
    const prevMonth = prevDate.toISOString().slice(0, 7)
    store.budgets.push({ id: 'prev1', category: 'Housing', limit: 1500, month: prevMonth })
    expect(store.currentBudgets).toHaveLength(1)
    expect(store.currentBudgets[0]!.category).toBe('Food')
  })

  it('budgetStatus computes ok status', () => {
    const store = useBudgetsStore()
    store.setBudget('Food', 500)
    const status = store.budgetStatus
    expect(status).toHaveLength(1)
    expect(status[0]!.status).toBe('ok')
    expect(status[0]!.limit).toBe(500)
  })

  it('availableCategories excludes used categories', () => {
    const store = useBudgetsStore()
    const before = store.availableCategories.length
    store.setBudget('Food', 500)
    expect(store.availableCategories.length).toBe(before - 1)
    expect(store.availableCategories).not.toContain('Food')
  })

  it('enableSync with no db does nothing', () => {
    const store = useBudgetsStore()
    expect(() => store.enableSync('house1')).not.toThrow()
  })

  it('persists to localStorage on change', async () => {
    const store = useBudgetsStore()
    store.setBudget('Food', 500)
    await new Promise((r) => setTimeout(r, 10))
    const stored = JSON.parse(localStorage.getItem('budgets:list')!)
    expect(stored).toHaveLength(1)
  })
})

