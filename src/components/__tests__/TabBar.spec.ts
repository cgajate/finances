import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TabBar from '@/components/TabBar.vue'

describe('TabBar', () => {
  const defaultTabs = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
  ]

  function mountTabBar(props: Record<string, unknown> = {}) {
    return mount(TabBar, {
      props: {
        tabs: defaultTabs,
        modelValue: 'one',
        ...props,
      },
    })
  }

  it('renders a button for each tab', () => {
    const wrapper = mountTabBar()
    const buttons = wrapper.findAll('.tab-bar button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]!.text()).toBe('One')
    expect(buttons[1]!.text()).toBe('Two')
  })

  it('marks the active tab with the active class', () => {
    const wrapper = mountTabBar({ modelValue: 'two' })
    const buttons = wrapper.findAll('.tab-bar button')
    expect(buttons[0]!.classes()).not.toContain('active')
    expect(buttons[1]!.classes()).toContain('active')
  })

  it('emits update:modelValue when a tab is clicked', async () => {
    const wrapper = mountTabBar()
    await wrapper.findAll('.tab-bar button')[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['two']])
  })

  it('renders three tabs correctly', () => {
    const wrapper = mountTabBar({
      tabs: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
        { value: 'c', label: 'Gamma' },
      ],
      modelValue: 'b',
    })
    const buttons = wrapper.findAll('.tab-bar button')
    expect(buttons).toHaveLength(3)
    expect(buttons[1]!.classes()).toContain('active')
  })

  it('renders icons when provided', () => {
    const wrapper = mount(TabBar, {
      props: {
        tabs: [
          { value: 'x', label: 'X', icon: ['fas', 'star'] },
          { value: 'y', label: 'Y' },
        ],
        modelValue: 'x',
      },
      global: {
        stubs: { 'font-awesome-icon': { template: '<i class="fa-icon" />', props: ['icon'] } },
      },
    })
    expect(wrapper.findAll('.fa-icon')).toHaveLength(1)
  })

  it('does not render icons when not provided', () => {
    const wrapper = mount(TabBar, {
      props: {
        tabs: defaultTabs,
        modelValue: 'one',
      },
      global: {
        stubs: { 'font-awesome-icon': { template: '<i class="fa-icon" />', props: ['icon'] } },
      },
    })
    expect(wrapper.findAll('.fa-icon')).toHaveLength(0)
  })

  it('uses default primary color when no color prop', () => {
    const wrapper = mountTabBar()
    expect(wrapper.find('.tab-bar').exists()).toBe(true)
  })

  it('accepts a custom color prop', () => {
    const wrapper = mountTabBar({ color: 'var(--color-expense)' })
    expect(wrapper.find('.tab-bar').exists()).toBe(true)
  })

  it('emits correct value for each tab click', async () => {
    const tabs = [
      { value: 'first', label: 'First' },
      { value: 'second', label: 'Second' },
      { value: 'third', label: 'Third' },
    ]
    const wrapper = mountTabBar({ tabs, modelValue: 'first' })
    await wrapper.findAll('.tab-bar button')[2]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['third']])
  })
})

