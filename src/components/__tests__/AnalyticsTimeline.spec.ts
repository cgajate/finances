import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AnalyticsTimeline from '@/components/AnalyticsTimeline.vue'
import type { MonthlyBreakdown } from '@/types/finance'

function makeBreakdown(overrides: Partial<MonthlyBreakdown> = {}): MonthlyBreakdown {
  return {
    month: '2026-04',
    label: 'April 2026',
    incomeItems: [],
    expenseItems: [],
    totalIncome: 0,
    totalExpenses: 0,
    net: 0,
    cumulativeSavings: 0,
    ...overrides,
  }
}

function mountComponent(props: {
  breakdown: MonthlyBreakdown[]
  monthsBefore?: number
  monthsAfter?: number
}) {
  return mount(AnalyticsTimeline, {
    props: {
      monthsBefore: 3,
      monthsAfter: 3,
      ...props,
    },
  })
}

describe('AnalyticsTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-24T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ─── Range controls ───

  it('renders range controls with correct values', () => {
    const wrapper = mountComponent({ breakdown: [] })
    const labels = wrapper.findAll('.range-field label')
    expect(labels[0]!.text()).toContain('Past months: 3')
    expect(labels[1]!.text()).toContain('Future months: 3')
  })

  it('emits update:monthsBefore when past range changes', async () => {
    const wrapper = mountComponent({ breakdown: [] })
    const input = wrapper.findAll('.range-field input')[0]!
    await input.setValue(6)
    expect(wrapper.emitted('update:monthsBefore')).toBeTruthy()
  })

  it('emits update:monthsAfter when future range changes', async () => {
    const wrapper = mountComponent({ breakdown: [] })
    const input = wrapper.findAll('.range-field input')[1]!
    await input.setValue(12)
    expect(wrapper.emitted('update:monthsAfter')).toBeTruthy()
  })

  // ─── Month cards rendering ───

  it('renders a card for each month in breakdown', () => {
    const breakdown = [
      makeBreakdown({ month: '2026-03', label: 'March 2026' }),
      makeBreakdown({ month: '2026-04', label: 'April 2026' }),
      makeBreakdown({ month: '2026-05', label: 'May 2026' }),
    ]
    const wrapper = mountComponent({ breakdown })
    expect(wrapper.findAll('.month-card')).toHaveLength(3)
  })

  it('shows month label', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ label: 'April 2026' })],
    })
    expect(wrapper.find('.month-name').text()).toBe('April 2026')
  })

  // ─── Current month ───

  it('marks the current month with .current class', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ month: '2026-04' })],
    })
    expect(wrapper.find('.month-card').classes()).toContain('current')
  })

  it('shows "Current" badge for current month', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ month: '2026-04' })],
    })
    expect(wrapper.find('.current-badge').exists()).toBe(true)
    expect(wrapper.find('.current-badge').text()).toBe('Current')
  })

  it('does not show "Current" badge for non-current months', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ month: '2026-05', label: 'May 2026' })],
    })
    expect(wrapper.find('.current-badge').exists()).toBe(false)
  })

  // ─── Past month ───

  it('marks past months with .past class', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ month: '2026-03', label: 'March 2026' })],
    })
    expect(wrapper.find('.month-card').classes()).toContain('past')
  })

  it('does not mark future months as past', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ month: '2026-05', label: 'May 2026' })],
    })
    expect(wrapper.find('.month-card').classes()).not.toContain('past')
  })

  it('does not mark current month as past', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ month: '2026-04' })],
    })
    expect(wrapper.find('.month-card').classes()).not.toContain('past')
  })

  // ─── Summary display ───

  it('displays income, expense, and net in summary', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ totalIncome: 5000, totalExpenses: 3000, net: 2000 })],
    })
    expect(wrapper.find('.summary-income').text()).toContain('$5,000.00')
    expect(wrapper.find('.summary-expense').text()).toContain('$3,000.00')
    expect(wrapper.find('.summary-net').text()).toContain('$2,000.00')
  })

  it('adds + prefix for positive net', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ net: 500 })],
    })
    expect(wrapper.find('.summary-net').text()).toContain('+')
  })

  it('applies negative class to negative net', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ net: -100 })],
    })
    expect(wrapper.find('.summary-net').classes()).toContain('negative')
  })

  it('does not apply negative class to positive net', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ net: 100 })],
    })
    expect(wrapper.find('.summary-net').classes()).not.toContain('negative')
  })

  // ─── Cumulative savings ───

  it('displays cumulative savings', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ cumulativeSavings: 10000 })],
    })
    expect(wrapper.find('.cumulative-value').text()).toContain('$10,000.00')
  })

  it('applies negative class to negative cumulative', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ cumulativeSavings: -500 })],
    })
    expect(wrapper.find('.cumulative-value').classes()).toContain('negative')
  })

  it('does not apply negative class to positive cumulative', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ cumulativeSavings: 500 })],
    })
    expect(wrapper.find('.cumulative-value').classes()).not.toContain('negative')
  })

  // ─── Expand / Collapse ───

  it('does not show details by default', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown()],
    })
    expect(wrapper.find('.month-details').exists()).toBe(false)
  })

  it('shows ▼ icon when collapsed', () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown()],
    })
    expect(wrapper.find('.expand-icon').text()).toBe('▼')
  })

  it('expands details on click', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown()],
    })
    await wrapper.find('.month-header').trigger('click')
    expect(wrapper.find('.month-details').exists()).toBe(true)
    expect(wrapper.find('.expand-icon').text()).toBe('▲')
  })

  it('adds expanded class when expanded', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown()],
    })
    await wrapper.find('.month-header').trigger('click')
    expect(wrapper.find('.month-card').classes()).toContain('expanded')
  })

  it('collapses details on second click', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown()],
    })
    await wrapper.find('.month-header').trigger('click')
    expect(wrapper.find('.month-details').exists()).toBe(true)
    await wrapper.find('.month-header').trigger('click')
    expect(wrapper.find('.month-details').exists()).toBe(false)
  })

  it('expands on Enter key', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown()],
    })
    await wrapper.find('.month-header').trigger('keydown.enter')
    expect(wrapper.find('.month-details').exists()).toBe(true)
  })

  it('expands on Space key', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown()],
    })
    await wrapper.find('.month-header').trigger('keydown.space')
    expect(wrapper.find('.month-details').exists()).toBe(true)
  })

  // ─── Expanded details — income items ───

  it('shows income items when expanded', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({
        incomeItems: [
          { id: '1', description: 'Salary', amount: 5000, source: 'recurring', frequency: 'monthly' },
        ],
      })],
    })
    await wrapper.find('.month-header').trigger('click')
    const incomeSection = wrapper.findAll('.detail-section')[0]!
    expect(incomeSection.find('h4').text()).toContain('Income (1)')
    expect(incomeSection.find('.detail-desc').text()).toBe('Salary')
    expect(incomeSection.find('.detail-amount').text()).toContain('$5,000.00')
    expect(incomeSection.find('.detail-badge').text()).toBe('monthly')
  })

  it('shows "No income this month" when no income items', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ incomeItems: [] })],
    })
    await wrapper.find('.month-header').trigger('click')
    const incomeSection = wrapper.findAll('.detail-section')[0]!
    expect(incomeSection.find('.detail-empty').text()).toBe('No income this month')
  })

  // ─── Expanded details — expense items ───

  it('shows expense items when expanded', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({
        expenseItems: [
          { id: '2', description: 'Rent', amount: 1500, source: 'recurring', frequency: 'monthly' },
        ],
      })],
    })
    await wrapper.find('.month-header').trigger('click')
    const expenseSection = wrapper.findAll('.detail-section')[1]!
    expect(expenseSection.find('h4').text()).toContain('Expenses (1)')
    expect(expenseSection.find('.detail-desc').text()).toBe('Rent')
    expect(expenseSection.find('.detail-amount').text()).toContain('$1,500.00')
  })

  it('shows "No expenses this month" when no expense items', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ expenseItems: [] })],
    })
    await wrapper.find('.month-header').trigger('click')
    const expenseSection = wrapper.findAll('.detail-section')[1]!
    expect(expenseSection.find('.detail-empty').text()).toBe('No expenses this month')
  })

  // ─── Detail badge — one-time vs recurring ───

  it('shows "one-time" badge for adhoc items', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({
        incomeItems: [
          { id: '3', description: 'Bonus', amount: 500, source: 'adhoc' },
        ],
      })],
    })
    await wrapper.find('.month-header').trigger('click')
    expect(wrapper.find('.detail-badge').text()).toBe('one-time')
  })

  it('shows frequency badge for recurring items', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({
        expenseItems: [
          { id: '4', description: 'Insurance', amount: 200, source: 'recurring', frequency: 'quarterly' },
        ],
      })],
    })
    await wrapper.find('.month-header').trigger('click')
    const expenseSection = wrapper.findAll('.detail-section')[1]!
    expect(expenseSection.find('.detail-badge').text()).toBe('quarterly')
  })

  it('shows "one-time" badge for adhoc expense items', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({
        expenseItems: [
          { id: '5', description: 'Car repair', amount: 800, source: 'adhoc' },
        ],
      })],
    })
    await wrapper.find('.month-header').trigger('click')
    const expenseSection = wrapper.findAll('.detail-section')[1]!
    expect(expenseSection.find('.detail-badge').text()).toBe('one-time')
  })

  // ─── Detail footer ───

  it('shows potential savings in footer', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ net: 2000 })],
    })
    await wrapper.find('.month-header').trigger('click')
    expect(wrapper.find('.detail-footer').text()).toContain('Potential Savings')
    expect(wrapper.find('.detail-footer').text()).toContain('$2,000.00')
  })

  it('applies negative class in footer for negative net', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ net: -300 })],
    })
    await wrapper.find('.month-header').trigger('click')
    expect(wrapper.find('.detail-footer .negative').exists()).toBe(true)
  })

  it('does not apply negative class in footer for positive net', async () => {
    const wrapper = mountComponent({
      breakdown: [makeBreakdown({ net: 300 })],
    })
    await wrapper.find('.month-header').trigger('click')
    expect(wrapper.find('.detail-footer .negative').exists()).toBe(false)
  })

  // ─── Multiple months — only one expanded at a time ───

  it('collapses previous month when a new one is expanded', async () => {
    const breakdown = [
      makeBreakdown({ month: '2026-03', label: 'March 2026' }),
      makeBreakdown({ month: '2026-04', label: 'April 2026' }),
    ]
    const wrapper = mountComponent({ breakdown })
    const headers = wrapper.findAll('.month-header')

    await headers[0]!.trigger('click')
    expect(wrapper.findAll('.month-details')).toHaveLength(1)

    await headers[1]!.trigger('click')
    expect(wrapper.findAll('.month-details')).toHaveLength(1)
    // The second card should be expanded now
    expect(wrapper.findAll('.month-card')[1]!.classes()).toContain('expanded')
    expect(wrapper.findAll('.month-card')[0]!.classes()).not.toContain('expanded')
  })
})

