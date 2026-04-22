import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '@/components/EmptyState.vue'

describe('EmptyState', () => {
  it('renders the message', () => {
    const wrapper = mount(EmptyState, { props: { message: 'No items yet.' } })
    expect(wrapper.text()).toBe('No items yet.')
  })

  it('has the empty class', () => {
    const wrapper = mount(EmptyState, { props: { message: 'Nothing here' } })
    expect(wrapper.find('.empty').exists()).toBe(true)
  })

  it('renders as a paragraph element', () => {
    const wrapper = mount(EmptyState, { props: { message: 'Test' } })
    expect(wrapper.find('p').exists()).toBe(true)
  })
})

