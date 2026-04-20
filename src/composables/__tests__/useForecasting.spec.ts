import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useForecasting } from '@/composables/useForecasting'
import type { Income, Expense } from '@/types/finance'

describe('useForecasting', () => {
  // Fix the date so tests are deterministic
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates correct number of months', () => {
    const incomes = ref<Income[]>([])
    const expenses = ref<Expense[]>([])
    const before = ref(2)
    const after = ref(3)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    // 2 before + current + 3 after = 6
    expect(breakdown.value).toHaveLength(6)
  })

  it('includes current month', () => {
    const incomes = ref<Income[]>([])
    const expenses = ref<Expense[]>([])
    const before = ref(0)
    const after = ref(0)
    const { breakdown, currentMonthIndex } = useForecasting(incomes, expenses, before, after)
    expect(breakdown.value).toHaveLength(1)
    expect(breakdown.value[0]!.month).toBe('2026-04')
    expect(currentMonthIndex.value).toBe(0)
  })

  it('projects monthly recurring income into each month', () => {
    const incomes = ref<Income[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 3000,
        frequency: 'monthly',
        description: 'Salary',
        notes: '',
        date: null,
        createdAt: '2026-01-01',
      },
    ])
    const expenses = ref<Expense[]>([])
    const before = ref(0)
    const after = ref(2)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    // All 3 months should have this income
    for (const m of breakdown.value) {
      expect(m.incomeItems).toHaveLength(1)
      expect(m.totalIncome).toBe(3000)
    }
  })

  it('projects weekly income with averaged amount', () => {
    const incomes = ref<Income[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 100,
        frequency: 'weekly',
        description: 'Gig',
        notes: '',
        date: null,
        createdAt: '2026-01-01',
      },
    ])
    const expenses = ref<Expense[]>([])
    const before = ref(0)
    const after = ref(0)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    expect(breakdown.value[0]!.totalIncome).toBeCloseTo(100 * 52 / 12, 1)
  })

  it('projects bi-weekly income with averaged amount', () => {
    const incomes = ref<Income[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 2000,
        frequency: 'bi-weekly',
        description: 'Pay',
        notes: '',
        date: null,
        createdAt: '2026-01-01',
      },
    ])
    const expenses = ref<Expense[]>([])
    const before = ref(0)
    const after = ref(0)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    expect(breakdown.value[0]!.totalIncome).toBeCloseTo(2000 * 26 / 12, 1)
  })

  it('places yearly income only in matching month', () => {
    const incomes = ref<Income[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 12000,
        frequency: 'yearly',
        description: 'Bonus',
        notes: '',
        date: '2026-04-15',
        createdAt: '2026-01-01',
      },
    ])
    const expenses = ref<Expense[]>([])
    const before = ref(0)
    const after = ref(11)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    const aprilMonths = breakdown.value.filter((m) => m.month.endsWith('-04'))
    expect(aprilMonths).toHaveLength(1)
    expect(aprilMonths[0]!.totalIncome).toBe(12000)
    // Non-April months should have 0
    const nonApril = breakdown.value.filter((m) => !m.month.endsWith('-04'))
    for (const m of nonApril) {
      expect(m.totalIncome).toBe(0)
    }
  })

  it('yearly without date uses averaged amount', () => {
    const incomes = ref<Income[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 12000,
        frequency: 'yearly',
        description: 'Bonus',
        notes: '',
        date: null,
        createdAt: '2026-01-01',
      },
    ])
    const expenses = ref<Expense[]>([])
    const before = ref(0)
    const after = ref(0)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    expect(breakdown.value[0]!.totalIncome).toBeCloseTo(1000, 0)
  })

  it('places quarterly income in correct months', () => {
    // Item in month 1 (Jan) hits Jan, Apr, Jul, Oct
    const incomes = ref<Income[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 900,
        frequency: 'quarterly',
        description: 'Quarterly',
        notes: '',
        date: '2026-01-15',
        createdAt: '2026-01-01',
      },
    ])
    const expenses = ref<Expense[]>([])
    const before = ref(3) // Jan through
    const after = ref(8) // Dec
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    // Should hit Jan(1), Apr(4), Jul(7), Oct(10)
    const hits = breakdown.value.filter((m) => m.totalIncome > 0)
    const hitMonths = hits.map((h) => parseInt(h.month.split('-')[1]!, 10))
    expect(hitMonths).toContain(1)
    expect(hitMonths).toContain(4)
    expect(hitMonths).toContain(7)
    expect(hitMonths).toContain(10)
  })

  it('quarterly without date uses averaged amount', () => {
    const incomes = ref<Income[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 900,
        frequency: 'quarterly',
        description: 'Q',
        notes: '',
        date: null,
        createdAt: '2026-01-01',
      },
    ])
    const expenses = ref<Expense[]>([])
    const before = ref(0)
    const after = ref(0)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    expect(breakdown.value[0]!.totalIncome).toBeCloseTo(300, 0)
  })

  it('places adhoc income in its specific month only', () => {
    const incomes = ref<Income[]>([
      {
        id: '1',
        type: 'adhoc',
        amount: 500,
        description: 'Gift',
        date: '2026-04-10',
        createdAt: '2026-01-01',
      },
    ])
    const expenses = ref<Expense[]>([])
    const before = ref(1)
    const after = ref(1)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    const aprilM = breakdown.value.find((m) => m.month === '2026-04')!
    expect(aprilM.totalIncome).toBe(500)
    const marchM = breakdown.value.find((m) => m.month === '2026-03')!
    expect(marchM.totalIncome).toBe(0)
  })

  it('projects recurring expense into each month', () => {
    const incomes = ref<Income[]>([])
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'recurring',
        amount: 1500,
        frequency: 'monthly',
        description: 'Rent',
        notes: '',
        dueDate: null,
        createdAt: '2026-01-01',
      },
    ])
    const before = ref(0)
    const after = ref(2)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    for (const m of breakdown.value) {
      expect(m.totalExpenses).toBe(1500)
    }
  })

  it('places adhoc expense in its month', () => {
    const incomes = ref<Income[]>([])
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'adhoc',
        amount: 200,
        description: 'Fix',
        notes: '',
        dueDate: '2026-04-05',
        createdAt: '2026-01-01',
      },
    ])
    const before = ref(1)
    const after = ref(1)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    expect(breakdown.value.find((m) => m.month === '2026-04')!.totalExpenses).toBe(200)
    expect(breakdown.value.find((m) => m.month === '2026-03')!.totalExpenses).toBe(0)
  })

  it('adhoc expense without dueDate is not placed', () => {
    const incomes = ref<Income[]>([])
    const expenses = ref<Expense[]>([
      {
        id: '1',
        type: 'adhoc',
        amount: 200,
        description: 'Fix',
        notes: '',
        dueDate: null,
        createdAt: '2026-01-01',
      },
    ])
    const before = ref(0)
    const after = ref(0)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    expect(breakdown.value[0]!.totalExpenses).toBe(0)
  })

  it('calculates net correctly', () => {
    const incomes = ref<Income[]>([
      { id: '1', type: 'recurring', amount: 5000, frequency: 'monthly', description: 'Sal', notes: '', date: null, createdAt: '2026-01-01' },
    ])
    const expenses = ref<Expense[]>([
      { id: '2', type: 'recurring', amount: 2000, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null, createdAt: '2026-01-01' },
    ])
    const before = ref(0)
    const after = ref(0)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    expect(breakdown.value[0]!.net).toBe(3000)
  })

  it('calculates cumulative savings across months', () => {
    const incomes = ref<Income[]>([
      { id: '1', type: 'recurring', amount: 1000, frequency: 'monthly', description: 'S', notes: '', date: null, createdAt: '2026-01-01' },
    ])
    const expenses = ref<Expense[]>([])
    const before = ref(0)
    const after = ref(2)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    expect(breakdown.value[0]!.cumulativeSavings).toBe(1000)
    expect(breakdown.value[1]!.cumulativeSavings).toBe(2000)
    expect(breakdown.value[2]!.cumulativeSavings).toBe(3000)
  })

  it('generates month labels', () => {
    const incomes = ref<Income[]>([])
    const expenses = ref<Expense[]>([])
    const before = ref(0)
    const after = ref(0)
    const { breakdown } = useForecasting(incomes, expenses, before, after)
    expect(breakdown.value[0]!.label).toContain('April')
    expect(breakdown.value[0]!.label).toContain('2026')
  })

  describe('yearProjection', () => {
    it('sums next 12 months', () => {
      const incomes = ref<Income[]>([
        { id: '1', type: 'recurring', amount: 1000, frequency: 'monthly', description: 'S', notes: '', date: null, createdAt: '2026-01-01' },
      ])
      const expenses = ref<Expense[]>([
        { id: '2', type: 'recurring', amount: 400, frequency: 'monthly', description: 'E', notes: '', dueDate: null, createdAt: '2026-01-01' },
      ])
      const before = ref(0)
      const after = ref(11)
      const { yearProjection } = useForecasting(incomes, expenses, before, after)
      expect(yearProjection.value.totalIncome).toBe(12000)
      expect(yearProjection.value.totalExpenses).toBe(4800)
      expect(yearProjection.value.netSavings).toBe(7200)
      expect(yearProjection.value.months).toHaveLength(12)
    })
  })

  describe('with plain arrays (non-ref)', () => {
    it('works with plain arrays', () => {
      const incomes: Income[] = [
        { id: '1', type: 'adhoc', amount: 100, description: 'G', date: '2026-04-01', createdAt: '2026-01-01' },
      ]
      const expenses: Expense[] = []
      const before = ref(0)
      const after = ref(0)
      const { breakdown } = useForecasting(incomes, expenses, before, after)
      expect(breakdown.value[0]!.totalIncome).toBe(100)
    })
  })
})

