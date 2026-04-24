import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BudgetProgressRow from '@/components/BudgetProgressRow.vue'
import type { BudgetStatus } from '@/stores/budgets'

const ProgressBarStub = {
  name: 'ProgressBar',
  template: '<div class="progress-bar-stub" />',
  props: ['percent', 'variant', 'height'],
}

function makeStatus(overrides: Partial<BudgetStatus> = {}): BudgetStatus {
  return {
    category: 'Food',
    limit: 500,
    spent: 250,
    percent: 50,
    status: 'ok',
    ...overrides,
  }
}

function mountRow(props: { status: BudgetStatus; mode?: 'compact' | 'full' }, slotContent?: string) {
  return mount(BudgetProgressRow, {
    props,
    global: { stubs: { ProgressBar: ProgressBarStub } },
    slots: slotContent ? { default: slotContent } : {},
  })
}

describe('BudgetProgressRow', () => {
  // ─── Default / compact mode ───

  it('renders with compact class by default', () => {
    const wrapper = mountRow({ status: makeStatus() })
    expect(wrapper.find('.budget-progress-row--compact').exists()).toBe(true)
  })

  it('displays category name', () => {
    const wrapper = mountRow({ status: makeStatus({ category: 'Housing' }) })
    expect(wrapper.find('.budget-progress-row__category').text()).toBe('Housing')
  })

  it('displays spent / limit amounts', () => {
    const wrapper = mountRow({ status: makeStatus({ spent: 200, limit: 400 }) })
    const amount = wrapper.find('.budget-progress-row__amount').text()
    expect(amount).toContain('$200.00')
    expect(amount).toContain('$400.00')
  })

  it('applies status-ok class for ok status', () => {
    const wrapper = mountRow({ status: makeStatus({ status: 'ok' }) })
    expect(wrapper.find('.budget-progress-row__amount').classes()).toContain('status-ok')
  })

  it('applies status-warning class for warning status', () => {
    const wrapper = mountRow({ status: makeStatus({ status: 'warning' }) })
    expect(wrapper.find('.budget-progress-row__amount').classes()).toContain('status-warning')
  })

  it('applies status-over class for over status', () => {
    const wrapper = mountRow({ status: makeStatus({ status: 'over' }) })
    expect(wrapper.find('.budget-progress-row__amount').classes()).toContain('status-over')
  })

  it('passes correct props to ProgressBar in compact mode', () => {
    const wrapper = mountRow({ status: makeStatus({ percent: 75, status: 'warning' }) })
    const bar = wrapper.findComponent(ProgressBarStub)
    expect(bar.props('percent')).toBe(75)
    expect(bar.props('variant')).toBe('warning')
    expect(bar.props('height')).toBe(8)
  })

  // ─── Full mode ───

  it('renders with full class when mode is full', () => {
    const wrapper = mountRow({ status: makeStatus(), mode: 'full' })
    expect(wrapper.find('.budget-progress-row--full').exists()).toBe(true)
    expect(wrapper.find('.budget-progress-row--compact').exists()).toBe(false)
  })

  it('passes height 10 to ProgressBar in full mode', () => {
    const wrapper = mountRow({ status: makeStatus(), mode: 'full' })
    const bar = wrapper.findComponent(ProgressBarStub)
    expect(bar.props('height')).toBe(10)
  })

  // ─── Slot ───

  it('renders default slot content', () => {
    const wrapper = mountRow(
      { status: makeStatus(), mode: 'full' },
      '<div class="custom-slot">Actions</div>',
    )
    expect(wrapper.find('.custom-slot').exists()).toBe(true)
    expect(wrapper.find('.custom-slot').text()).toBe('Actions')
  })

  it('renders without slot content', () => {
    const wrapper = mountRow({ status: makeStatus() })
    expect(wrapper.find('.custom-slot').exists()).toBe(false)
  })
})

