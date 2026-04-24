import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useForecasting } from '@/composables/useForecasting'
import type { Income, Expense } from '@/types/finance'

describe('useForecasting — monthly overrides', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses override amount for a monthly recurring expense in the overridden month', () => {
    const incomes = ref<Income[]>([])
    const expenses = ref<Expense[]>([
      {
        id: 'pseg',
        type: 'recurring',
        amount: 300,
        frequency: 'monthly',
        description: 'PSEG',
        notes: '',
        dueDate: '2026-04-15',
        createdAt: '2026-01-01',
        overrides: { '2026-04': 200 },
      },
    ])
    const { breakdown } = useForecasting(incomes, expenses, ref(0), ref(2))

    // April should use the override (200), May and June should use base (300)
    const apr = breakdown.value.find((b) => b.month === '2026-04')!
    const may = breakdown.value.find((b) => b.month === '2026-05')!
    const jun = breakdown.value.find((b) => b.month === '2026-06')!

    expect(apr.expenseItems[0]!.amount).toBe(200)
    expect(apr.totalExpenses).toBe(200)
    expect(may.expenseItems[0]!.amount).toBe(300)
    expect(jun.expenseItems[0]!.amount).toBe(300)
  })

  it('uses override amount for a monthly recurring income in the overridden month', () => {
    const incomes = ref<Income[]>([
      {
        id: 'salary',
        type: 'recurring',
        amount: 5000,
        frequency: 'monthly',
        description: 'Salary',
        notes: '',
        date: null,
        createdAt: '2026-01-01',
        overrides: { '2026-04': 4500 },
      },
    ])
    const expenses = ref<Expense[]>([])
    const { breakdown } = useForecasting(incomes, expenses, ref(0), ref(1))

    const apr = breakdown.value.find((b) => b.month === '2026-04')!
    const may = breakdown.value.find((b) => b.month === '2026-05')!

    expect(apr.incomeItems[0]!.amount).toBe(4500)
    expect(may.incomeItems[0]!.amount).toBe(5000)
  })

  it('uses override for weekly recurring expense (per-occurrence override)', () => {
    const incomes = ref<Income[]>([])
    const expenses = ref<Expense[]>([
      {
        id: 'groceries',
        type: 'recurring',
        amount: 100,
        frequency: 'weekly',
        description: 'Groceries',
        notes: '',
        dueDate: '2026-04-01',
        createdAt: '2026-01-01',
        overrides: { '2026-04': 80 },
      },
    ])
    const { breakdown } = useForecasting(incomes, expenses, ref(0), ref(1))

    const apr = breakdown.value.find((b) => b.month === '2026-04')!
    const may = breakdown.value.find((b) => b.month === '2026-05')!

    // Weekly: multiplier is 52/12 ≈ 4.333
    const weeklyMultiplier = 52 / 12
    expect(apr.expenseItems[0]!.amount).toBeCloseTo(80 * weeklyMultiplier, 1)
    expect(may.expenseItems[0]!.amount).toBeCloseTo(100 * weeklyMultiplier, 1)
  })

  it('uses override for bi-weekly recurring income', () => {
    const incomes = ref<Income[]>([
      {
        id: 'pay',
        type: 'recurring',
        amount: 2500,
        frequency: 'bi-weekly',
        description: 'Paycheck',
        notes: '',
        date: null,
        createdAt: '2026-01-01',
        overrides: { '2026-04': 2200 },
      },
    ])
    const expenses = ref<Expense[]>([])
    const { breakdown } = useForecasting(incomes, expenses, ref(0), ref(1))

    const apr = breakdown.value.find((b) => b.month === '2026-04')!
    const may = breakdown.value.find((b) => b.month === '2026-05')!

    const biweeklyMultiplier = 26 / 12
    expect(apr.incomeItems[0]!.amount).toBeCloseTo(2200 * biweeklyMultiplier, 1)
    expect(may.incomeItems[0]!.amount).toBeCloseTo(2500 * biweeklyMultiplier, 1)
  })

  it('handles no overrides — uses base amount everywhere', () => {
    const incomes = ref<Income[]>([])
    const expenses = ref<Expense[]>([
      {
        id: 'rent',
        type: 'recurring',
        amount: 1500,
        frequency: 'monthly',
        description: 'Rent',
        notes: '',
        dueDate: null,
        createdAt: '2026-01-01',
      },
    ])
    const { breakdown } = useForecasting(incomes, expenses, ref(0), ref(2))

    for (const m of breakdown.value) {
      expect(m.expenseItems[0]!.amount).toBe(1500)
    }
  })

  it('net calculation reflects overrides', () => {
    const incomes = ref<Income[]>([
      {
        id: 'salary',
        type: 'recurring',
        amount: 5000,
        frequency: 'monthly',
        description: 'Salary',
        notes: '',
        date: null,
        createdAt: '2026-01-01',
        overrides: { '2026-04': 4000 },
      },
    ])
    const expenses = ref<Expense[]>([
      {
        id: 'rent',
        type: 'recurring',
        amount: 2000,
        frequency: 'monthly',
        description: 'Rent',
        notes: '',
        dueDate: null,
        createdAt: '2026-01-01',
        overrides: { '2026-04': 1800 },
      },
    ])
    const { breakdown } = useForecasting(incomes, expenses, ref(0), ref(1))

    const apr = breakdown.value.find((b) => b.month === '2026-04')!
    const may = breakdown.value.find((b) => b.month === '2026-05')!

    // April: 4000 - 1800 = 2200
    expect(apr.net).toBe(2200)
    // May: 5000 - 2000 = 3000
    expect(may.net).toBe(3000)
  })
})

