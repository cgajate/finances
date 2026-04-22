import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '@/components/PageHeader.vue'

describe('PageHeader', () => {
  function mountHeader(props = {}) {
    return mount(PageHeader, {
      props: { title: 'Test Title', backTo: '/test', ...props },
      global: {
        stubs: { 'font-awesome-icon': { template: '<i />', props: ['icon'] } },
      },
    })
  }

  it('renders the title', () => {
    const wrapper = mountHeader()
    expect(wrapper.find('h2').text()).toBe('Test Title')
  })

  it('renders a back button', () => {
    const wrapper = mountHeader()
    expect(wrapper.find('.btn-back').exists()).toBe(true)
  })

  it('has the page-header class', () => {
    const wrapper = mountHeader()
    expect(wrapper.find('.page-header').exists()).toBe(true)
  })

  it('renders with different title', () => {
    const wrapper = mountHeader({ title: 'Edit Expense' })
    expect(wrapper.find('h2').text()).toBe('Edit Expense')
  })
})

