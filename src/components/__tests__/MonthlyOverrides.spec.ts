import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MonthlyOverrides from '@/components/MonthlyOverrides.vue'

// Stub font-awesome-icon globally
const faStub = { template: '<i />' }

const CurrencyInputStub = {
  name: 'CurrencyInput',
  template: '<input />',
  props: ['modelValue'],
}

function mountComponent(props: {
  baseAmount: number
  overrides?: Record<string, number>
}) {
  return mount(MonthlyOverrides, {
    props,
    global: {
      stubs: { 'font-awesome-icon': faStub, CurrencyInput: CurrencyInputStub },
    },
  })
}

describe('MonthlyOverrides', () => {
  it('renders the toggle button', () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    expect(wrapper.find('.overrides__toggle').exists()).toBe(true)
    expect(wrapper.find('.overrides__toggle').text()).toContain('Monthly Adjustments')
  })

  it('does not show body when collapsed', () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    expect(wrapper.find('.overrides__body').exists()).toBe(false)
  })

  it('shows body when toggle is clicked', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')
    expect(wrapper.find('.overrides__body').exists()).toBe(true)
  })

  it('displays hint with base amount', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')
    expect(wrapper.find('.overrides__hint').text()).toContain('$300.00')
  })

  it('shows override count badge when overrides exist', () => {
    const wrapper = mountComponent({
      baseAmount: 300,
      overrides: { '2026-04': 200, '2026-05': 250 },
    })
    expect(wrapper.find('.overrides__count').text()).toBe('2')
  })

  it('does not show count badge when no overrides', () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    expect(wrapper.find('.overrides__count').exists()).toBe(false)
  })

  it('lists existing overrides sorted by month', async () => {
    const wrapper = mountComponent({
      baseAmount: 300,
      overrides: { '2026-05': 250, '2026-03': 280, '2026-04': 200 },
    })
    await wrapper.find('.overrides__toggle').trigger('click')

    const entries = wrapper.findAll('.overrides__entry')
    expect(entries).toHaveLength(3)
    expect(entries[0]!.find('.overrides__month').text()).toContain('March')
    expect(entries[1]!.find('.overrides__month').text()).toContain('April')
    expect(entries[2]!.find('.overrides__month').text()).toContain('May')
  })

  it('displays formatted amounts in override list', async () => {
    const wrapper = mountComponent({
      baseAmount: 300,
      overrides: { '2026-04': 200 },
    })
    await wrapper.find('.overrides__toggle').trigger('click')

    expect(wrapper.find('.overrides__amount').text()).toBe('$200.00')
  })

  it('emits remove-override when remove button is clicked', async () => {
    const wrapper = mountComponent({
      baseAmount: 300,
      overrides: { '2026-04': 200 },
    })
    await wrapper.find('.overrides__toggle').trigger('click')
    await wrapper.find('.btn-remove').trigger('click')

    expect(wrapper.emitted('remove-override')).toEqual([['2026-04']])
  })

  it('shows empty override list when expanded with no overrides', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')
    expect(wrapper.findAll('.overrides__entry')).toHaveLength(0)
    expect(wrapper.find('.overrides__list').exists()).toBe(false)
  })

  it('renders the add form with date and amount fields', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')

    expect(wrapper.find('#override-month').exists()).toBe(true)
    expect(wrapper.find('#override-month').attributes('type')).toBe('date')
    expect(wrapper.find('.btn-fund').exists()).toBe(true)
  })

  it('add button is disabled when fields are empty', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')

    const addBtn = wrapper.find('.btn-fund')
    expect((addBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits set-override with YYYY-MM when date and amount are provided', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')

    // Set date
    await wrapper.find('#override-month').setValue('2026-06-15')
    // Set amount via the CurrencyInput stub — trigger update:modelValue
    const currencyInput = wrapper.findComponent({ name: 'CurrencyInput' })
    currencyInput.vm.$emit('update:modelValue', 150)
    await wrapper.vm.$nextTick()

    await wrapper.find('.btn-fund').trigger('click')
    expect(wrapper.emitted('set-override')).toEqual([['2026-06', 150]])
  })

  it('resets date and amount fields after adding an override', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')

    await wrapper.find('#override-month').setValue('2026-07-01')
    const currencyInput = wrapper.findComponent({ name: 'CurrencyInput' })
    currencyInput.vm.$emit('update:modelValue', 100)
    await wrapper.vm.$nextTick()

    await wrapper.find('.btn-fund').trigger('click')

    // Date input should be cleared
    expect((wrapper.find('#override-month').element as HTMLInputElement).value).toBe('')
  })

  it('does not emit set-override when date is empty', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')

    // Only set amount, leave date empty
    const currencyInput = wrapper.findComponent({ name: 'CurrencyInput' })
    currencyInput.vm.$emit('update:modelValue', 100)
    await wrapper.vm.$nextTick()

    await wrapper.find('.btn-fund').trigger('click')
    expect(wrapper.emitted('set-override')).toBeUndefined()
  })

  it('does not emit set-override when amount is null', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')

    await wrapper.find('#override-month').setValue('2026-08-01')
    // Don't set amount

    await wrapper.find('.btn-fund').trigger('click')
    expect(wrapper.emitted('set-override')).toBeUndefined()
  })

  it('collapses when toggle is clicked again', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')
    expect(wrapper.find('.overrides__body').exists()).toBe(true)
    await wrapper.find('.overrides__toggle').trigger('click')
    expect(wrapper.find('.overrides__body').exists()).toBe(false)
  })

  it('returns empty overrideEntries when overrides prop is undefined', async () => {
    const wrapper = mountComponent({ baseAmount: 300 })
    await wrapper.find('.overrides__toggle').trigger('click')
    expect(wrapper.findAll('.overrides__entry')).toHaveLength(0)
  })

  it('handles malformed month keys in overrides gracefully', async () => {
    const wrapper = mountComponent({
      baseAmount: 300,
      overrides: { '': 100 },
    })
    await wrapper.find('.overrides__toggle').trigger('click')
    const entries = wrapper.findAll('.overrides__entry')
    expect(entries).toHaveLength(1)
    // Should still render without crashing, using fallback values
    expect(entries[0]!.find('.overrides__month').text()).toBeTruthy()
  })
})
