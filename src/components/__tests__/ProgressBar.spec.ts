import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from '@/components/ProgressBar.vue'

describe('ProgressBar', () => {
  it('renders the progress track and fill', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 50 } })
    expect(wrapper.find('.progress-track').exists()).toBe(true)
    expect(wrapper.find('.progress-fill').exists()).toBe(true)
  })

  it('clamps width to 100%', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 150 } })
    expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 100%')
  })

  it('sets width based on percent', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 75 } })
    expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 75%')
  })

  it('defaults to ok variant', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 50 } })
    expect(wrapper.find('.fill--ok').exists()).toBe(true)
  })

  it('applies warning variant class', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 80, variant: 'warning' } })
    expect(wrapper.find('.fill--warning').exists()).toBe(true)
  })

  it('applies over variant class', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 100, variant: 'over' } })
    expect(wrapper.find('.fill--over').exists()).toBe(true)
  })

  it('renders at 0%', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 0 } })
    expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 0%')
  })
})

