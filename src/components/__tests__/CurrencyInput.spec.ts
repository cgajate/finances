import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CurrencyInput from '@/components/CurrencyInput.vue'

describe('CurrencyInput', () => {
  it('renders an input with placeholder', () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: null } })
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('$0.00')
    expect(input.attributes('inputmode')).toBe('decimal')
  })

  it('displays formatted value when modelValue is set', () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: 1234.56 } })
    expect(wrapper.find('input').element.value).toBe('$1,234.56')
  })

  it('displays empty when modelValue is null', () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: null } })
    expect(wrapper.find('input').element.value).toBe('')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: null } })
    const input = wrapper.find('input')
    await input.setValue('50')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('sets required attribute when prop is true', () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: null, required: true } })
    expect(wrapper.find('input').attributes('required')).toBeDefined()
  })

  it('does not set required by default', () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: null } })
    expect(wrapper.find('input').attributes('required')).toBeUndefined()
  })
})

