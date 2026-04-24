import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
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

  it('sets id attribute when provided', () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: null, id: 'amount-field' } })
    expect(wrapper.find('input').attributes('id')).toBe('amount-field')
  })

  // ─── Prop → inner sync (watch on modelValue) ───

  it('updates display when modelValue prop changes to a number', async () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: null } })
    expect(wrapper.find('input').element.value).toBe('')
    await wrapper.setProps({ modelValue: 99.99 })
    await nextTick()
    expect(wrapper.find('input').element.value).toBe('$99.99')
  })

  it('resets display when modelValue prop changes to null', async () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: 50 } })
    expect(wrapper.find('input').element.value).toBe('$50.00')
    await wrapper.setProps({ modelValue: null })
    await nextTick()
    expect(wrapper.find('input').element.value).toBe('')
  })

  it('does not reset when modelValue matches inner value', async () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: null } })
    const input = wrapper.find('input')
    // Type "100" which sets innerValue to 100
    await input.setValue('100')
    await nextTick()
    // Now set prop to same value — the watch fires but guard prevents reset/setFromValue
    await wrapper.setProps({ modelValue: 100 })
    await nextTick()
    // Display should still show what the user typed (with $ prefix from onInput)
    expect(input.element.value).toContain('100')
  })

  // ─── Blur and Focus ───

  it('formats value on blur', async () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: null } })
    const input = wrapper.find('input')
    await input.setValue('1234')
    await input.trigger('blur')
    expect(input.element.value).toBe('$1,234.00')
  })

  it('clears display on blur when value is empty', async () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: null } })
    const input = wrapper.find('input')
    await input.trigger('blur')
    expect(input.element.value).toBe('')
  })

  it('triggers focus handler without error', async () => {
    const wrapper = mount(CurrencyInput, { props: { modelValue: 100 } })
    const input = wrapper.find('input')
    await input.trigger('focus')
    // Focus handler calls setTimeout → select(); just ensure no error
    expect(input.element.value).toBe('$100.00')
  })
})

