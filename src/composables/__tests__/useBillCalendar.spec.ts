import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useBillCalendar } from '@/composables/useBillCalendar'
import type { Income, Expense } from '@/types/finance'

describe('useBillCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-21T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function makeCal(incomes: Income[], expenses: Expense[], y = 2026, m = 3) {
    return useBillCalendar(ref(incomes), ref(expenses), ref(y), ref(m)) // m=3 → April
  }

  it('returns correct month label', () => {
    const { calendar } = makeCal([], [])
    expect(calendar.value.label).toContain('April')
    expect(calendar.value.label).toContain('2026')
  })

  it('returns weeks covering the full calendar grid', () => {
    const { calendar } = makeCal([], [])
    // April 2026 starts on Wednesday, so grid starts Sunday March 29
    // Should have 5 weeks
    expect(calendar.value.weeks.length).toBeGreaterThanOrEqual(4)
    expect(calendar.value.weeks.length).toBeLessThanOrEqual(6)
    // Each week has 7 days
    for (const week of calendar.value.weeks) {
      expect(week).toHaveLength(7)
    }
  })

  it('marks today correctly', () => {
    const { calendar } = makeCal([], [])
    const allDays = calendar.value.weeks.flat()
    const todayDays = allDays.filter((d) => d.isToday)
    expect(todayDays).toHaveLength(1)
    expect(todayDays[0]!.date).toBe('2026-04-21')
  })

  it('marks current month days correctly', () => {
    const { calendar } = makeCal([], [])
    const allDays = calendar.value.weeks.flat()
    const currentMonthDays = allDays.filter((d) => d.isCurrentMonth)
    expect(currentMonthDays).toHaveLength(30) // April has 30 days
  })

  it('places adhoc expense on correct day', () => {
    const { calendar } = makeCal(
      [],
      [{ id: 'e1', type: 'adhoc', amount: 200, description: 'Repair', notes: '', dueDate: '2026-04-15', createdAt: '2026-04-01T00:00:00Z' }],
    )
    const allDays = calendar.value.weeks.flat()
    const day15 = allDays.find((d) => d.date === '2026-04-15')
    expect(day15).toBeDefined()
    expect(day15!.events).toHaveLength(1)
    expect(day15!.events[0]!.kind).toBe('expense')
    expect(day15!.events[0]!.amount).toBe(200)
    expect(day15!.totalExpenses).toBe(200)
  })

  it('places adhoc income on correct day', () => {
    const { calendar } = makeCal(
      [{ id: 'i1', type: 'adhoc', amount: 500, description: 'Bonus', date: '2026-04-10', createdAt: '2026-04-01T00:00:00Z' }],
      [],
    )
    const allDays = calendar.value.weeks.flat()
    const day10 = allDays.find((d) => d.date === '2026-04-10')
    expect(day10!.events).toHaveLength(1)
    expect(day10!.events[0]!.kind).toBe('income')
    expect(day10!.totalIncome).toBe(500)
  })

  it('generates recurring monthly expense occurrences', () => {
    const { calendar } = makeCal(
      [],
      [{ id: 'e1', type: 'recurring', amount: 1500, frequency: 'monthly', description: 'Rent', notes: '', dueDate: '2026-01-01', createdAt: '2026-01-01T00:00:00Z' }],
    )
    const allDays = calendar.value.weeks.flat()
    const day1 = allDays.find((d) => d.date === '2026-04-01')
    expect(day1!.events).toHaveLength(1)
    expect(day1!.events[0]!.description).toBe('Rent')
  })

  it('generates recurring weekly income occurrences', () => {
    const { calendar } = makeCal(
      [{ id: 'i1', type: 'recurring', amount: 100, frequency: 'weekly', description: 'Gig', notes: '', date: '2026-04-01', createdAt: '2026-04-01T00:00:00Z' }],
      [],
    )
    const allDays = calendar.value.weeks.flat()
    const incDays = allDays.filter((d) => d.events.some((e) => e.kind === 'income'))
    // April has ~4-5 weeks, should see multiple occurrences
    expect(incDays.length).toBeGreaterThanOrEqual(4)
  })

  it('computes month totalIncome and totalExpenses for current month only', () => {
    const { calendar } = makeCal(
      [{ id: 'i1', type: 'adhoc', amount: 3000, description: 'Sal', date: '2026-04-15', createdAt: '2026-04-01T00:00:00Z' }],
      [{ id: 'e1', type: 'adhoc', amount: 1000, description: 'Bill', notes: '', dueDate: '2026-04-20', createdAt: '2026-04-01T00:00:00Z' }],
    )
    expect(calendar.value.totalIncome).toBe(3000)
    expect(calendar.value.totalExpenses).toBe(1000)
  })

  it('does not count other-month days in month totals', () => {
    // Place an event in March (which shows on April calendar as other-month)
    const { calendar } = makeCal(
      [],
      [{ id: 'e1', type: 'adhoc', amount: 500, description: 'Old', notes: '', dueDate: '2026-03-30', createdAt: '2026-03-01T00:00:00Z' }],
    )
    // The event exists on the grid but month total should not include it
    expect(calendar.value.totalExpenses).toBe(0)
  })

  it('skips recurring items without dates', () => {
    const { calendar } = makeCal(
      [{ id: 'i1', type: 'recurring', amount: 5000, frequency: 'monthly', description: 'Sal', notes: '', date: null, createdAt: '2026-01-01T00:00:00Z' }],
      [{ id: 'e1', type: 'recurring', amount: 2000, frequency: 'monthly', description: 'R', notes: '', dueDate: null, createdAt: '2026-01-01T00:00:00Z' }],
    )
    const allDays = calendar.value.weeks.flat()
    const withEvents = allDays.filter((d) => d.events.length > 0)
    expect(withEvents).toHaveLength(0)
  })

  it('events have correct frequency label', () => {
    const { calendar } = makeCal(
      [],
      [{ id: 'e1', type: 'adhoc', amount: 100, description: 'X', notes: '', dueDate: '2026-04-05', createdAt: '2026-04-01T00:00:00Z' }],
    )
    const allDays = calendar.value.weeks.flat()
    const day5 = allDays.find((d) => d.date === '2026-04-05')
    expect(day5!.events[0]!.frequency).toBe('one-time')
  })

  it('reacts to month change', () => {
    const monthRef = ref(3) // April
    const { calendar } = useBillCalendar(ref([]), ref([]), ref(2026), monthRef)
    expect(calendar.value.label).toContain('April')
    monthRef.value = 4 // May
    expect(calendar.value.label).toContain('May')
  })
})

