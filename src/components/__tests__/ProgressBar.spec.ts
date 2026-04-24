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

  it('applies primary variant class', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 60, variant: 'primary' } })
    expect(wrapper.find('.fill--primary').exists()).toBe(true)
  })

  it('uses custom height when provided', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 50, height: 20 } })
    // Access internal computeds used by v-bind() in CSS
    const vm = wrapper.vm as any
    expect(vm.barHeight).toBe('20px')
    expect(vm.barRadius).toBe('10px')
  })

  it('defaults height to 10px when not provided', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 50 } })
    const vm = wrapper.vm as any
    expect(vm.barHeight).toBe('10px')
    expect(vm.barRadius).toBe('5px')
  })

  it('sets aria attributes correctly', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 65 } })
    const track = wrapper.find('.progress-track')
    expect(track.attributes('role')).toBe('progressbar')
    expect(track.attributes('aria-valuenow')).toBe('65')
    expect(track.attributes('aria-valuemin')).toBe('0')
    expect(track.attributes('aria-valuemax')).toBe('100')
  })

  it('clamps aria-valuenow to 100 when percent exceeds 100', () => {
    const wrapper = mount(ProgressBar, { props: { percent: 200 } })
    expect(wrapper.find('.progress-track').attributes('aria-valuenow')).toBe('100')
  })
})

