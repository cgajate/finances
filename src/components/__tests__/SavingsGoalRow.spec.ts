import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SavingsGoalRow from '@/components/SavingsGoalRow.vue'
import type { SavingsGoal } from '@/types/finance'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]!
}

function makeGoal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
  return {
    id: 'g1',
    name: 'Vacation',
    targetAmount: 1000,
    savedAmount: 500,
    deadline: daysFromNow(30),
    createdAt: '2026-01-01',
    ...overrides,
  }
}

function mountRow(goal: SavingsGoal, mode?: 'compact' | 'full', slotContent?: string) {
  return mount(SavingsGoalRow, {
    props: { goal, mode },
    slots: slotContent ? { default: slotContent } : {},
    global: {
      stubs: { ProgressBar: { template: '<div class="progress-stub" />', props: ['percent', 'variant', 'height'] } },
    },
  })
}

describe('SavingsGoalRow', () => {
  // --- Compact mode (default) ---
  it('renders goal name', () => {
    const wrapper = mountRow(makeGoal())
    expect(wrapper.find('.savings-goal-row__name').text()).toBe('Vacation')
  })

  it('renders compact amounts by default', () => {
    const wrapper = mountRow(makeGoal())
    expect(wrapper.find('.savings-goal-row__amt').exists()).toBe(true)
    expect(wrapper.text()).toContain('$500.00')
    expect(wrapper.text()).toContain('$1,000.00')
  })

  it('applies compact class by default', () => {
    const wrapper = mountRow(makeGoal())
    expect(wrapper.find('.savings-goal-row--compact').exists()).toBe(true)
  })

  it('does not show deadline in compact mode', () => {
    const wrapper = mountRow(makeGoal())
    expect(wrapper.find('.savings-goal-row__deadline').exists()).toBe(false)
  })

  it('does not show full amounts row in compact mode', () => {
    const wrapper = mountRow(makeGoal())
    expect(wrapper.find('.savings-goal-row__amounts').exists()).toBe(false)
  })

  it('does not show meter label in compact mode', () => {
    const wrapper = mountRow(makeGoal())
    expect(wrapper.find('.savings-goal-row__meter-label').exists()).toBe(false)
  })

  // --- Full mode ---
  it('applies full class in full mode', () => {
    const wrapper = mountRow(makeGoal(), 'full')
    expect(wrapper.find('.savings-goal-row--full').exists()).toBe(true)
  })

  it('shows deadline in full mode with days left', () => {
    const wrapper = mountRow(makeGoal({ deadline: daysFromNow(10) }), 'full')
    expect(wrapper.find('.savings-goal-row__deadline').text()).toContain('days left')
  })

  it('shows "Due today" when deadline is today', () => {
    const wrapper = mountRow(makeGoal({ deadline: daysFromNow(0) }), 'full')
    expect(wrapper.find('.savings-goal-row__deadline').text()).toContain('Due today')
  })

  it('shows overdue text when deadline is past', () => {
    const wrapper = mountRow(makeGoal({ deadline: daysFromNow(-5) }), 'full')
    expect(wrapper.find('.savings-goal-row__deadline').text()).toContain('days overdue')
    expect(wrapper.find('.savings-goal-row__deadline--overdue').exists()).toBe(true)
  })

  it('shows full amounts row in full mode', () => {
    const wrapper = mountRow(makeGoal(), 'full')
    expect(wrapper.find('.savings-goal-row__amounts').exists()).toBe(true)
    expect(wrapper.find('.savings-goal-row__saved').text()).toContain('$500.00')
    expect(wrapper.find('.savings-goal-row__target').text()).toContain('$1,000.00')
    expect(wrapper.find('.savings-goal-row__of').text()).toBe('of')
  })

  it('shows meter label in full mode', () => {
    const wrapper = mountRow(makeGoal(), 'full')
    expect(wrapper.find('.savings-goal-row__meter-label').text()).toContain('% complete')
  })

  it('does not show compact amount in full mode', () => {
    const wrapper = mountRow(makeGoal(), 'full')
    expect(wrapper.find('.savings-goal-row__amt').exists()).toBe(false)
  })

  // --- percentComplete ---
  it('returns 0% when targetAmount is 0', () => {
    const wrapper = mountRow(makeGoal({ targetAmount: 0, savedAmount: 100 }))
    expect(wrapper.find('.savings-goal-row__meter-label').exists()).toBe(false)
    // Access via vm
    expect((wrapper.vm as any).percentComplete()).toBe(0)
  })

  it('returns 0% when targetAmount is negative', () => {
    expect((mountRow(makeGoal({ targetAmount: -10 })).vm as any).percentComplete()).toBe(0)
  })

  it('clamps percentComplete to 100', () => {
    expect((mountRow(makeGoal({ savedAmount: 2000, targetAmount: 1000 })).vm as any).percentComplete()).toBe(100)
  })

  it('calculates correct percent', () => {
    expect((mountRow(makeGoal({ savedAmount: 250, targetAmount: 1000 })).vm as any).percentComplete()).toBe(25)
  })

  // --- meterVariant ---
  it('returns ok when 100% complete', () => {
    expect((mountRow(makeGoal({ savedAmount: 1000, targetAmount: 1000 })).vm as any).meterVariant()).toBe('ok')
  })

  it('returns primary when >= 60%', () => {
    expect((mountRow(makeGoal({ savedAmount: 700, targetAmount: 1000 })).vm as any).meterVariant()).toBe('primary')
  })

  it('returns warning when >= 30%', () => {
    expect((mountRow(makeGoal({ savedAmount: 300, targetAmount: 1000 })).vm as any).meterVariant()).toBe('warning')
  })

  it('returns over when < 30%', () => {
    expect((mountRow(makeGoal({ savedAmount: 100, targetAmount: 1000 })).vm as any).meterVariant()).toBe('over')
  })

  // --- isCompleted ---
  it('applies completed class when savedAmount >= targetAmount', () => {
    const wrapper = mountRow(makeGoal({ savedAmount: 1000, targetAmount: 1000 }))
    expect(wrapper.find('.savings-goal-row--completed').exists()).toBe(true)
  })

  it('does not apply completed class when not reached', () => {
    const wrapper = mountRow(makeGoal({ savedAmount: 500, targetAmount: 1000 }))
    expect(wrapper.find('.savings-goal-row--completed').exists()).toBe(false)
  })

  // --- Slot ---
  it('renders default slot content', () => {
    const wrapper = mountRow(makeGoal(), 'full', '<button class="test-action">Fund</button>')
    expect(wrapper.find('.test-action').exists()).toBe(true)
  })
})

