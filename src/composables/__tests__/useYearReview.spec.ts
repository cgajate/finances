import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useYearReview } from '@/composables/useYearReview'
import type { Income, Expense } from '@/types/finance'

describe('useYearReview', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-21T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function makeReview(incomes: Income[], expenses: Expense[], year = 2026) {
    const incRef = ref(incomes)
    const expRef = ref(expenses)
    const yearRef = ref(year)
    return useYearReview(incRef, expRef, yearRef)
  }

  it('returns 12 months for the selected year', () => {
    const { review } = makeReview([], [])
    expect(review.value.months).toHaveLength(12)
    expect(review.value.months[0]!.month).toBe('2026-01')
    expect(review.value.months[11]!.month).toBe('2026-12')
  })

  it('returns zero totals with no data', () => {
    const { review } = makeReview([], [])
    expect(review.value.totalIncome).toBe(0)
    expect(review.value.totalExpenses).toBe(0)
    expect(review.value.netSavings).toBe(0)
    expect(review.value.savingsRate).toBe(0)
  })

  it('distributes recurring monthly income across all months', () => {
    const { review } = makeReview(
      [{ id: '1', type: 'recurring', amount: 5000, frequency: 'monthly', description: 'Salary', notes: '', date: null, createdAt: '2026-01-01T00:00:00Z' }],
      [],
    )
    expect(review.value.totalIncome).toBe(60000)
    for (const m of review.value.months) {
      expect(m.income).toBe(5000)
    }
  })

  it('distributes recurring weekly income across all months', () => {
    const { review } = makeReview(
      [{ id: '1', type: 'recurring', amount: 100, frequency: 'weekly', description: 'Gig', notes: '', date: null, createdAt: '2026-01-01T00:00:00Z' }],
      [],
    )
    // 100 * 52 / 12 per month * 12 = 5200
    expect(review.value.totalIncome).toBeCloseTo(5200, 0)
  })

  it('places adhoc income in its specific month', () => {
    const { review } = makeReview(
      [{ id: '1', type: 'adhoc', amount: 1000, description: 'Bonus', date: '2026-06-15', createdAt: '2026-06-15T00:00:00Z' }],
      [],
    )
    expect(review.value.totalIncome).toBe(1000)
    expect(review.value.months[5]!.income).toBe(1000) // June
    expect(review.value.months[0]!.income).toBe(0)
  })

  it('ignores adhoc income from a different year', () => {
    const { review } = makeReview(
      [{ id: '1', type: 'adhoc', amount: 500, description: 'Old', date: '2025-03-01', createdAt: '2025-03-01T00:00:00Z' }],
      [],
    )
    expect(review.value.totalIncome).toBe(0)
  })

  it('distributes recurring expenses across all months', () => {
    const { review } = makeReview(
      [],
      [{ id: '1', type: 'recurring', amount: 1500, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null, createdAt: '2026-01-01T00:00:00Z' }],
    )
    expect(review.value.totalExpenses).toBe(18000)
  })

  it('places adhoc expense in its month', () => {
    const { review } = makeReview(
      [],
      [{ id: '1', type: 'adhoc', amount: 300, description: 'Repair', notes: '', dueDate: '2026-03-10', createdAt: '2026-03-10T00:00:00Z' }],
    )
    expect(review.value.months[2]!.expenses).toBe(300) // March
  })

  it('calculates net savings correctly', () => {
    const { review } = makeReview(
      [{ id: '1', type: 'recurring', amount: 5000, frequency: 'monthly', description: 'Sal', notes: '', date: null, createdAt: '2026-01-01T00:00:00Z' }],
      [{ id: '2', type: 'recurring', amount: 3000, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null, createdAt: '2026-01-01T00:00:00Z' }],
    )
    expect(review.value.netSavings).toBe(24000) // (5000-3000) * 12
  })

  it('calculates savings rate', () => {
    const { review } = makeReview(
      [{ id: '1', type: 'recurring', amount: 10000, frequency: 'monthly', description: 'S', notes: '', date: null, createdAt: '2026-01-01T00:00:00Z' }],
      [{ id: '2', type: 'recurring', amount: 4000, frequency: 'monthly', description: 'E', notes: '', dueDate: null, createdAt: '2026-01-01T00:00:00Z' }],
    )
    // Net = 72000, Income = 120000 → 60%
    expect(review.value.savingsRate).toBe(60)
  })

  it('groups expenses by category', () => {
    const { review } = makeReview(
      [],
      [
        { id: '1', type: 'recurring', amount: 1000, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null, category: 'Housing', createdAt: '2026-01-01T00:00:00Z' },
        { id: '2', type: 'recurring', amount: 500, frequency: 'monthly', description: 'Food', notes: '', dueDate: null, category: 'Food', createdAt: '2026-01-01T00:00:00Z' },
      ],
    )
    expect(review.value.topCategories).toHaveLength(2)
    expect(review.value.topCategories[0]!.category).toBe('Housing')
    expect(review.value.topCategories[0]!.total).toBe(12000)
    expect(review.value.topCategories[1]!.category).toBe('Food')
    expect(review.value.topCategories[1]!.total).toBe(6000)
  })

  it('calculates category percentages', () => {
    const { review } = makeReview(
      [],
      [
        { id: '1', type: 'recurring', amount: 750, frequency: 'monthly', description: 'R', notes: '', dueDate: null, category: 'Housing', createdAt: '2026-01-01T00:00:00Z' },
        { id: '2', type: 'recurring', amount: 250, frequency: 'monthly', description: 'F', notes: '', dueDate: null, category: 'Food', createdAt: '2026-01-01T00:00:00Z' },
      ],
    )
    expect(review.value.topCategories[0]!.percent).toBe(75)
    expect(review.value.topCategories[1]!.percent).toBe(25)
  })

  it('identifies best and worst months', () => {
    const { review } = makeReview(
      [
        { id: '1', type: 'recurring', amount: 5000, frequency: 'monthly', description: 'S', notes: '', date: null, createdAt: '2026-01-01T00:00:00Z' },
        { id: '2', type: 'adhoc', amount: 2000, description: 'Bonus', date: '2026-06-15', createdAt: '2026-06-15T00:00:00Z' },
      ],
      [
        { id: '3', type: 'recurring', amount: 3000, frequency: 'monthly', description: 'R', notes: '', dueDate: null, createdAt: '2026-01-01T00:00:00Z' },
        { id: '4', type: 'adhoc', amount: 4000, description: 'Big', notes: '', dueDate: '2026-02-01', createdAt: '2026-02-01T00:00:00Z' },
      ],
    )
    // June: 5000+2000 income, 3000 expense → net 4000 (best)
    expect(review.value.bestMonth!.month).toBe('2026-06')
    // Feb: 5000 income, 3000+4000 expense → net -2000 (worst)
    expect(review.value.worstMonth!.month).toBe('2026-02')
  })

  it('returns null bestMonth/worstMonth when no activity', () => {
    const { review } = makeReview([], [])
    expect(review.value.bestMonth).toBeNull()
    expect(review.value.worstMonth).toBeNull()
  })

  it('availableYears includes current year', () => {
    const { availableYears } = makeReview([], [])
    expect(availableYears.value).toContain(2026)
  })

  it('availableYears includes years from data', () => {
    const { availableYears } = makeReview(
      [{ id: '1', type: 'adhoc', amount: 100, description: 'Old', date: '2024-05-01', createdAt: '2024-05-01T00:00:00Z' }],
      [{ id: '2', type: 'adhoc', amount: 200, description: 'E', notes: '', dueDate: '2025-07-01', createdAt: '2025-07-01T00:00:00Z' }],
    )
    expect(availableYears.value).toContain(2024)
    expect(availableYears.value).toContain(2025)
    expect(availableYears.value).toContain(2026)
  })

  it('reacts to year change', () => {
    const incRef = ref<Income[]>([
      { id: '1', type: 'adhoc', amount: 1000, description: 'A', date: '2025-03-01', createdAt: '2025-03-01T00:00:00Z' },
      { id: '2', type: 'adhoc', amount: 2000, description: 'B', date: '2026-03-01', createdAt: '2026-03-01T00:00:00Z' },
    ])
    const yearRef = ref(2026)
    const { review } = useYearReview(incRef, ref([]), yearRef)
    expect(review.value.totalIncome).toBe(2000)
    yearRef.value = 2025
    expect(review.value.totalIncome).toBe(1000)
  })
})

