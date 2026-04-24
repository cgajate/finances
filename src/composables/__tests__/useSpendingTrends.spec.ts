import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useSpendingTrends } from '@/composables/useSpendingTrends'
import type { Expense } from '@/types/finance'

describe('useSpendingTrends', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  function makeExpenses(): Expense[] {
    const now = new Date()
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return [
      {
        id: '1',
        type: 'recurring',
        amount: 100,
        frequency: 'monthly',
        description: 'Groceries',
        notes: '',
        dueDate: null,
        category: 'Food',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        type: 'adhoc',
        amount: 50,
        description: 'Pizza',
        notes: '',
        dueDate: `${curMonth}-15`,
        category: 'Food',
        createdAt: '2026-01-02T00:00:00Z',
      },
      {
        id: '3',
        type: 'recurring',
        amount: 200,
        frequency: 'weekly',
        description: 'Gas',
        notes: '',
        dueDate: null,
        category: 'Transport',
        createdAt: '2026-01-03T00:00:00Z',
      },
    ]
  }

  it('returns trends with categories', () => {
    const expenses = ref(makeExpenses())
    const monthCount = ref(6)
    const { trends } = useSpendingTrends(expenses, monthCount)
    expect(trends.value.months).toHaveLength(6)
    expect(trends.value.monthLabels).toHaveLength(6)
    expect(trends.value.categories.length).toBeGreaterThan(0)
  })

  it('returns correct month labels', () => {
    const expenses = ref<Expense[]>([])
    const monthCount = ref(3)
    const { trends } = useSpendingTrends(expenses, monthCount)
    expect(trends.value.months).toHaveLength(3)
    expect(trends.value.monthLabels).toHaveLength(3)
    // Labels should be short month + 2-digit year format
    for (const label of trends.value.monthLabels) {
      expect(label).toMatch(/\w+ '?\d{2}/)
    }
  })

  it('handles empty expenses', () => {
    const expenses = ref<Expense[]>([])
    const monthCount = ref(6)
    const { trends } = useSpendingTrends(expenses, monthCount)
    expect(trends.value.categories).toHaveLength(0)
    expect(trends.value.maxMonthlyTotal).toBe(1) // min 1
  })

  it('distributes recurring expense across all months', () => {
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 100,
        frequency: 'monthly',
        description: 'Groceries',
        notes: '',
        dueDate: null,
        category: 'Food',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(6)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const foodTrend = trends.value.categories.find((c) => c.category === 'Food')
    expect(foodTrend).toBeDefined()
    // Each month should have 100
    for (const m of foodTrend!.months) {
      expect(m.amount).toBeCloseTo(100)
    }
  })

  it('places adhoc expense in its month only', () => {
    const now = new Date()
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'adhoc',
        amount: 50,
        description: 'Pizza',
        notes: '',
        dueDate: `${curMonth}-15`,
        category: 'Food',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(6)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const foodTrend = trends.value.categories.find((c) => c.category === 'Food')
    expect(foodTrend).toBeDefined()
    const curMonthData = foodTrend!.months.find((m) => m.month === curMonth)
    expect(curMonthData!.amount).toBe(50)
  })

  it('skips adhoc expense with no dueDate', () => {
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'adhoc',
        amount: 50,
        description: 'NoDue',
        notes: '',
        dueDate: null,
        category: 'Food',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(6)
    const { trends } = useSpendingTrends(expenses, monthCount)
    // Food category should not appear (0 spending)
    const foodTrend = trends.value.categories.find((c) => c.category === 'Food')
    expect(foodTrend).toBeUndefined()
  })

  it('computes trend direction up', () => {
    // Create expenses that only exist in the second half of months
    const now = new Date()
    // Use current month for adhoc
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'adhoc',
        amount: 500,
        description: 'Big',
        notes: '',
        dueDate: `${curMonth}-01`,
        category: 'Food',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(6)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const foodTrend = trends.value.categories.find((c) => c.category === 'Food')
    if (foodTrend) {
      // Direction should be 'up' as first half has 0 and second has spending
      expect(foodTrend.direction).toBe('up')
      expect(foodTrend.trend).toBe(100)
    }
  })

  it('computes flat trend for uniform spending', () => {
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 100,
        frequency: 'monthly',
        description: 'Groceries',
        notes: '',
        dueDate: null,
        category: 'Food',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(6)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const foodTrend = trends.value.categories.find((c) => c.category === 'Food')
    expect(foodTrend).toBeDefined()
    expect(foodTrend!.direction).toBe('flat')
    expect(foodTrend!.trend).toBe(0)
  })

  it('totalByMonth sums across categories', () => {
    const expenses = ref(makeExpenses())
    const monthCount = ref(6)
    const { trends } = useSpendingTrends(expenses, monthCount)
    expect(trends.value.totalByMonth).toHaveLength(6)
    for (const m of trends.value.totalByMonth) {
      expect(m.amount).toBeGreaterThanOrEqual(0)
    }
  })

  it('maxMonthlyTotal is at least 1', () => {
    const expenses = ref<Expense[]>([])
    const monthCount = ref(3)
    const { trends } = useSpendingTrends(expenses, monthCount)
    expect(trends.value.maxMonthlyTotal).toBe(1)
  })

  it('sorts categories by total descending', () => {
    const expenses = ref(makeExpenses())
    const monthCount = ref(6)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const cats = trends.value.categories
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i]!.total).toBeLessThanOrEqual(cats[i - 1]!.total)
    }
  })

  it('handles weekly frequency in monthlyEquivalent', () => {
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 10,
        frequency: 'weekly',
        description: 'W',
        notes: '',
        dueDate: null,
        category: 'Transport',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(1)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const t = trends.value.categories.find((c) => c.category === 'Transport')
    expect(t).toBeDefined()
    expect(t!.months[0]!.amount).toBeCloseTo((10 * 52) / 12, 1)
  })

  it('handles bi-weekly frequency', () => {
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 10,
        frequency: 'bi-weekly',
        description: 'BW',
        notes: '',
        dueDate: null,
        category: 'Transport',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(1)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const t = trends.value.categories.find((c) => c.category === 'Transport')
    expect(t!.months[0]!.amount).toBeCloseTo((10 * 26) / 12, 1)
  })

  it('handles quarterly frequency', () => {
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 90,
        frequency: 'quarterly',
        description: 'Q',
        notes: '',
        dueDate: null,
        category: 'Healthcare',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(1)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const t = trends.value.categories.find((c) => c.category === 'Healthcare')
    expect(t!.months[0]!.amount).toBeCloseTo(30, 1)
  })

  it('handles yearly frequency', () => {
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 1200,
        frequency: 'yearly',
        description: 'Y',
        notes: '',
        dueDate: null,
        category: 'Education',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(1)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const t = trends.value.categories.find((c) => c.category === 'Education')
    expect(t!.months[0]!.amount).toBeCloseTo(100, 1)
  })

  it('accepts plain array input', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        type: 'recurring',
        amount: 100,
        frequency: 'monthly',
        description: 'G',
        notes: '',
        dueDate: null,
        category: 'Food',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]
    const monthCount = ref(3)
    const { trends } = useSpendingTrends(expenses, monthCount)
    expect(trends.value.categories.length).toBeGreaterThan(0)
  })

  it('ignores expense with unknown category not in store', () => {
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 100,
        frequency: 'monthly',
        description: 'X',
        notes: '',
        dueDate: null,
        category: 'NonexistentCategory' as any,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(3)
    const { trends } = useSpendingTrends(expenses, monthCount)
    // Should not crash
    expect(trends.value).toBeDefined()
  })

  it('defaults category to Other when undefined', () => {
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 100,
        frequency: 'monthly',
        description: 'NoCategory',
        notes: '',
        dueDate: null,
        createdAt: '2026-01-01T00:00:00Z',
      } as Expense,
    ])
    const monthCount = ref(3)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const other = trends.value.categories.find((c) => c.category === 'Other')
    expect(other).toBeDefined()
  })

  it('adhoc expense outside range is not counted', () => {
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'adhoc',
        amount: 999,
        description: 'Old',
        notes: '',
        dueDate: '2020-01-15',
        category: 'Food',
        createdAt: '2020-01-01T00:00:00Z',
      },
    ])
    const monthCount = ref(3)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const foodTrend = trends.value.categories.find((c) => c.category === 'Food')
    expect(foodTrend).toBeUndefined()
  })

  it('computes trend direction down when spending decreases', () => {
    const now = new Date()
    const expenses = ref<Expense[]>([])
    // Add adhoc expenses: higher amounts in older months, lower in recent months
    for (let i = 5; i >= 3; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      expenses.value.push({
        id: `down-${i}`,
        type: 'adhoc',
        amount: 300,
        description: `Old ${i}`,
        notes: '',
        dueDate: `${ym}-15`,
        category: 'Entertainment',
        createdAt: '2026-01-01T00:00:00Z',
      })
    }
    // Small amount in current month
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    expenses.value.push({
      id: 'down-now',
      type: 'adhoc',
      amount: 10,
      description: 'Small recent',
      notes: '',
      dueDate: `${curMonth}-15`,
      category: 'Entertainment',
      createdAt: '2026-01-01T00:00:00Z',
    })
    const monthCount = ref(6)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const ent = trends.value.categories.find((c) => c.category === 'Entertainment')
    expect(ent).toBeDefined()
    expect(ent!.direction).toBe('down')
    expect(ent!.trend).toBeLessThan(-2)
  })

  it('handles recurring expense with overrides', () => {
    const now = new Date()
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevYm = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`
    const expenses = ref<Expense[]>([
      {
        id: 'ov1',
        type: 'recurring',
        amount: 100,
        frequency: 'monthly',
        description: 'Overridden',
        notes: '',
        dueDate: null,
        category: 'Food',
        createdAt: '2026-01-01T00:00:00Z',
        overrides: { [prevYm]: 200 },
      },
    ])
    const monthCount = ref(3)
    const { trends } = useSpendingTrends(expenses, monthCount)
    const food = trends.value.categories.find((c) => c.category === 'Food')
    expect(food).toBeDefined()
    const overriddenMonth = food!.months.find((m) => m.month === prevYm)
    expect(overriddenMonth).toBeDefined()
    expect(overriddenMonth!.amount).toBeCloseTo(200, 1)
  })
})
