import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '@/components/PageHeader.vue'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('PageHeader', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

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

  it('navigates to backTo route when back button is clicked', async () => {
    const wrapper = mountHeader({ backTo: '/finances' })
    await wrapper.find('.btn-back').trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/finances')
  })

  it('back button has accessible label', () => {
    const wrapper = mountHeader()
    expect(wrapper.find('.btn-back').attributes('aria-label')).toBe('Go back')
  })
})
