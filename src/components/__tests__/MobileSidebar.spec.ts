import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MobileSidebar from '@/components/MobileSidebar.vue'

function mountSidebar(open = false) {
  return mount(MobileSidebar, {
    props: { open },
    global: {
      stubs: {
        'font-awesome-icon': true,
        RouterLink: {
          template: '<a><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}

describe('MobileSidebar', () => {
  it('does not render sidebar or backdrop when closed', () => {
    const wrapper = mountSidebar(false)
    expect(wrapper.find('.sidebar-backdrop').exists()).toBe(false)
    expect(wrapper.find('.mobile-sidebar').exists()).toBe(false)
  })

  it('renders sidebar and backdrop when open', () => {
    const wrapper = mountSidebar(true)
    expect(wrapper.find('.sidebar-backdrop').exists()).toBe(true)
    expect(wrapper.find('.mobile-sidebar').exists()).toBe(true)
  })

  it('renders the logo and title in the header', () => {
    const wrapper = mountSidebar(true)
    expect(wrapper.find('.sidebar-logo').attributes('alt')).toBe('Logo')
    expect(wrapper.find('.sidebar-title').text()).toBe('Montajate Financier')
  })

  it('renders all navigation links', () => {
    const wrapper = mountSidebar(true)
    const links = wrapper.findAll('.sidebar-link')
    expect(links).toHaveLength(6)
    expect(links.map((l) => l.text())).toEqual([
      'Dashboard',
      'Finances',
      'Goals',
      'Calendar',
      'Analytics',
      'Approvals',
    ])
  })

  it('emits close when backdrop is clicked', async () => {
    const wrapper = mountSidebar(true)
    await wrapper.find('.sidebar-backdrop').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when a navigation link is clicked', async () => {
    const wrapper = mountSidebar(true)
    const links = wrapper.findAll('.sidebar-link')
    await links[0]!.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close for each link click', async () => {
    const wrapper = mountSidebar(true)
    const links = wrapper.findAll('.sidebar-link')
    for (const link of links) {
      await link.trigger('click')
    }
    expect(wrapper.emitted('close')).toHaveLength(6)
  })
})

