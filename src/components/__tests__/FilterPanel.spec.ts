import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterPanel from '@/components/FilterPanel.vue'
import type { FrequencyFilter } from '@/composables/useSortFilter'

const defaultProps = {
  frequencies: [] as FrequencyFilter[],
  categories: [] as string[],
  availableCategories: ['Food', 'Rent', 'Transport'],
}

function mountPanel(overrides: Record<string, unknown> = {}) {
  return mount(FilterPanel, {
    props: { ...defaultProps, ...overrides },
    global: { stubs: { 'font-awesome-icon': true } },
  })
}

describe('FilterPanel', () => {
  it('renders the Filters heading', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.bubble-header h3').text()).toContain('Filters')
  })

  it('renders all frequency options', () => {
    const wrapper = mountPanel()
    const section = wrapper.findAll('.panel-section')[0]!
    const pills = section.findAll('.option-pill')
    expect(pills).toHaveLength(6)
    expect(pills.map((p) => p.text())).toEqual([
      'Weekly',
      'Bi-Weekly',
      'Monthly',
      'Quarterly',
      'Yearly',
      'One-time',
    ])
  })

  it('renders available categories', () => {
    const wrapper = mountPanel()
    const section = wrapper.findAll('.panel-section')[1]!
    const pills = section.findAll('.option-pill')
    expect(pills).toHaveLength(3)
    expect(pills.map((p) => p.text())).toEqual(['Food', 'Rent', 'Transport'])
  })

  it('marks selected frequencies with the selected class', () => {
    const wrapper = mountPanel({ frequencies: ['weekly', 'monthly'] })
    const section = wrapper.findAll('.panel-section')[0]!
    const pills = section.findAll('.option-pill')
    expect(pills[0]!.classes()).toContain('selected')
    expect(pills[1]!.classes()).not.toContain('selected')
    expect(pills[2]!.classes()).toContain('selected')
  })

  it('marks selected categories with the selected class', () => {
    const wrapper = mountPanel({ categories: ['Rent'] })
    const section = wrapper.findAll('.panel-section')[1]!
    const pills = section.findAll('.option-pill')
    expect(pills[0]!.classes()).not.toContain('selected')
    expect(pills[1]!.classes()).toContain('selected')
  })

  it('shows check icon only for selected frequencies', () => {
    const wrapper = mountPanel({ frequencies: ['yearly'] })
    const section = wrapper.findAll('.panel-section')[0]!
    const pills = section.findAll('.option-pill')
    // 'Yearly' is index 4
    expect(pills[4]!.find('font-awesome-icon-stub').exists()).toBe(true)
    expect(pills[0]!.find('font-awesome-icon-stub').exists()).toBe(false)
  })

  it('shows check icon only for selected categories', () => {
    const wrapper = mountPanel({ categories: ['Food'] })
    const section = wrapper.findAll('.panel-section')[1]!
    const pills = section.findAll('.option-pill')
    expect(pills[0]!.find('font-awesome-icon-stub').exists()).toBe(true)
    expect(pills[1]!.find('font-awesome-icon-stub').exists()).toBe(false)
  })

  it('emits toggle-frequency when a frequency pill is clicked', async () => {
    const wrapper = mountPanel()
    const section = wrapper.findAll('.panel-section')[0]!
    await section.findAll('.option-pill')[0]!.trigger('click')
    expect(wrapper.emitted('toggle-frequency')).toEqual([['weekly']])
  })

  it('emits toggle-category when a category pill is clicked', async () => {
    const wrapper = mountPanel()
    const section = wrapper.findAll('.panel-section')[1]!
    await section.findAll('.option-pill')[2]!.trigger('click')
    expect(wrapper.emitted('toggle-category')).toEqual([['Transport']])
  })

  it('emits clear when clear button is clicked', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.footer-btn.clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.footer-btn.cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('emits submit when apply button is clicked', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.footer-btn.submit').trigger('click')
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('emits cancel when close button is clicked', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.bubble-close').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('emits cancel on Escape keydown', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.filter-bubble').trigger('keydown.escape')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('has proper aria-label on the dialog', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('Filter options')
  })

  it('has proper aria-label on the close button', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.bubble-close').attributes('aria-label')).toBe('Close')
  })

  it('renders with empty availableCategories', () => {
    const wrapper = mountPanel({ availableCategories: [] })
    const section = wrapper.findAll('.panel-section')[1]!
    expect(section.findAll('.option-pill')).toHaveLength(0)
  })
})

