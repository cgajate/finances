import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar.vue'

describe('SearchBar', () => {
  function mountBar(modelValue = '', placeholder?: string) {
    return mount(SearchBar, {
      props: {
        modelValue,
        'onUpdate:modelValue': (v: string) => wrapper.setProps({ modelValue: v }),
        placeholder,
      },
    })
    var wrapper: ReturnType<typeof mount>
  }

  it('renders search input', () => {
    const wrapper = mount(SearchBar, {
      props: { modelValue: '', 'onUpdate:modelValue': () => {} },
    })
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('uses default placeholder', () => {
    const wrapper = mount(SearchBar, {
      props: { modelValue: '', 'onUpdate:modelValue': () => {} },
    })
    expect(wrapper.find('.search-input').attributes('placeholder')).toBe('Search...')
  })

  it('uses custom placeholder', () => {
    const wrapper = mount(SearchBar, {
      props: { modelValue: '', 'onUpdate:modelValue': () => {}, placeholder: 'Find items...' },
    })
    expect(wrapper.find('.search-input').attributes('placeholder')).toBe('Find items...')
  })

  it('does not show clear button when empty', () => {
    const wrapper = mount(SearchBar, {
      props: { modelValue: '', 'onUpdate:modelValue': () => {} },
    })
    expect(wrapper.find('.search-clear').exists()).toBe(false)
  })

  it('shows clear button when has value', () => {
    const wrapper = mount(SearchBar, {
      props: { modelValue: 'test', 'onUpdate:modelValue': () => {} },
    })
    expect(wrapper.find('.search-clear').exists()).toBe(true)
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(SearchBar, {
      props: { modelValue: '', 'onUpdate:modelValue': () => {} },
    })
    await wrapper.find('.search-input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['hello'])
  })

  it('clears value on clear button click', async () => {
    const wrapper = mount(SearchBar, {
      props: { modelValue: 'test', 'onUpdate:modelValue': () => {} },
    })
    await wrapper.find('.search-clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([''])
  })

  it('renders search icon', () => {
    const wrapper = mount(SearchBar, {
      props: { modelValue: '', 'onUpdate:modelValue': () => {} },
    })
    expect(wrapper.find('.search-icon').exists()).toBe(true)
  })
})

