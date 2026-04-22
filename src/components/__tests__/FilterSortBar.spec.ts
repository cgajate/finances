import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FilterSortBar from '@/components/FilterSortBar.vue'

function mountBar(overrides = {}) {
  return mount(FilterSortBar, {
    props: {
      sortBy: 'newest',
      sortField: 'newest',
      sortDirection: 'asc',
      activeFilters: [],
      activeCategoryFilters: [],
      hasFilter: () => false,
      hasCategoryFilter: () => false,
      type: 'expense',
      ...overrides,
    },
    global: { plugins: [createPinia()] },
  })
}

describe('FilterSortBar', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders filter and sort trigger buttons', () => {
    const wrapper = mountBar()
    const triggers = wrapper.findAll('.trigger-btn')
    expect(triggers).toHaveLength(2)
    expect(wrapper.text()).toContain('Filter')
    expect(wrapper.text()).toContain('Sort')
  })

  it('opens filter bubble on click', async () => {
    const wrapper = mountBar()
    expect(wrapper.find('.filter-bubble').exists()).toBe(false)
    const filterBtn = wrapper.findAll('.trigger-btn')[0]!
    await filterBtn.trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(true)
    expect(wrapper.text()).toContain('Frequency')
    expect(wrapper.text()).toContain('Category')
  })

  it('opens sort bubble on click', async () => {
    const wrapper = mountBar()
    const sortBtn = wrapper.findAll('.trigger-btn')[1]!
    await sortBtn.trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(true)
    expect(wrapper.text()).toContain('Sort By')
    expect(wrapper.text()).toContain('Ascending')
    expect(wrapper.text()).toContain('Descending')
  })

  it('closes filter bubble on close button', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(true)
    await wrapper.find('.bubble-close').trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(false)
  })

  it('closes filter bubble on cancel', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    await wrapper.find('.footer-btn.cancel').trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(false)
  })

  it('toggles frequency pills in filter draft', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    const pills = wrapper.findAll('.option-pill')
    // Click "Weekly" pill
    await pills[0]!.trigger('click')
    expect(pills[0]!.classes()).toContain('selected')
  })

  it('emits filter changes on apply', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    // Select weekly
    const pills = wrapper.findAll('.option-pill')
    await pills[0]!.trigger('click')
    await wrapper.find('.footer-btn.submit').trigger('click')
    expect(wrapper.emitted('toggleFilter')).toBeTruthy()
    expect(wrapper.emitted('toggleFilter')![0]).toEqual(['weekly'])
  })

  it('clears draft on clear button', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    const pills = wrapper.findAll('.option-pill')
    await pills[0]!.trigger('click')
    expect(pills[0]!.classes()).toContain('selected')
    await wrapper.find('.footer-btn.clear').trigger('click')
    // After clear, no pills should be selected
    const updatedPills = wrapper.findAll('.option-pill.selected')
    expect(updatedPills).toHaveLength(0)
  })

  it('emits sort changes on apply', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[1]!.trigger('click')
    // Click "Amount"
    const pills = wrapper.findAll('.option-pill')
    await pills[1]!.trigger('click')
    await wrapper.find('.footer-btn.submit').trigger('click')
    expect(wrapper.emitted('update:sortField')).toBeTruthy()
    expect(wrapper.emitted('update:sortField')![0]).toEqual(['amount'])
  })

  it('toggles sort direction', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[1]!.trigger('click')
    const dirBtns = wrapper.findAll('.direction-btn')
    await dirBtns[1]!.trigger('click') // Descending
    await wrapper.find('.footer-btn.submit').trigger('click')
    expect(wrapper.emitted('update:sortDirection')![0]).toEqual(['desc'])
  })

  it('shows filter count badge when filters active', () => {
    const wrapper = mountBar({
      activeFilters: ['monthly', 'weekly'],
      activeCategoryFilters: ['Food'],
    })
    expect(wrapper.find('.trigger-badge').text()).toBe('3')
  })

  it('marks filter trigger as active when open', async () => {
    const wrapper = mountBar()
    const filterBtn = wrapper.findAll('.trigger-btn')[0]!
    await filterBtn.trigger('click')
    expect(filterBtn.classes()).toContain('active')
  })

  it('closes sort on backdrop click', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[1]!.trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(true)
    await wrapper.find('.bubble-backdrop').trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(false)
  })

  it('clear sort resets to defaults', async () => {
    const wrapper = mountBar({ sortField: 'amount', sortDirection: 'desc' })
    await wrapper.findAll('.trigger-btn')[1]!.trigger('click')
    await wrapper.find('.footer-btn.clear').trigger('click')
    // After clear, newest and asc should be selected
    const selected = wrapper.findAll('.option-pill.selected')
    expect(selected.length).toBeGreaterThan(0)
    expect(selected[0]!.text()).toContain('Newest')
  })

  it('opening filter closes sort', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[1]!.trigger('click')
    expect(wrapper.findAll('.bubble')).toHaveLength(1)
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    // Only filter bubble should be open
    expect(wrapper.text()).toContain('Frequency')
  })
})
