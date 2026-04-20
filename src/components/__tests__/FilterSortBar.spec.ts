import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterSortBar from '@/components/FilterSortBar.vue'

function mountBar(overrides = {}) {
  return mount(FilterSortBar, {
    props: {
      sortBy: 'newest',
      activeFilters: [],
      hasFilter: () => false,
      ...overrides,
    },
  })
}

describe('FilterSortBar', () => {
  it('renders sort bubbles', () => {
    const wrapper = mountBar()
    expect(wrapper.text()).toContain('Newest')
    expect(wrapper.text()).toContain('Amount ↓')
    expect(wrapper.text()).toContain('A–Z')
  })

  it('marks active sort bubble', () => {
    const wrapper = mountBar({ sortBy: 'amount-desc' })
    const bubbles = wrapper.findAll('.sort-bubble')
    const active = bubbles.find((b) => b.classes().includes('active'))
    expect(active?.text()).toContain('Amount ↓')
  })

  it('emits update:sortBy when sort bubble clicked', async () => {
    const wrapper = mountBar()
    const bubbles = wrapper.findAll('.sort-bubble')
    await bubbles[1]!.trigger('click')
    expect(wrapper.emitted('update:sortBy')).toBeTruthy()
    expect(wrapper.emitted('update:sortBy')![0]).toEqual(['amount-desc'])
  })

  it('toggles filter panel on Choose click', async () => {
    const wrapper = mountBar()
    expect(wrapper.find('.filter-panel').exists()).toBe(false)
    await wrapper.find('.filter-toggle-btn').trigger('click')
    expect(wrapper.find('.filter-panel').exists()).toBe(true)
    await wrapper.find('.filter-toggle-btn').trigger('click')
    expect(wrapper.find('.filter-panel').exists()).toBe(false)
  })

  it('emits toggleFilter when filter bubble clicked in panel', async () => {
    const wrapper = mountBar()
    await wrapper.find('.filter-toggle-btn').trigger('click')
    const filterBubbles = wrapper.findAll('.filter-bubble')
    await filterBubbles[0]!.trigger('click')
    expect(wrapper.emitted('toggleFilter')).toBeTruthy()
    expect(wrapper.emitted('toggleFilter')![0]).toEqual(['weekly'])
  })

  it('emits clearFilters on Clear All click', async () => {
    const wrapper = mountBar()
    await wrapper.find('.filter-toggle-btn').trigger('click')
    const clearBtn = wrapper.find('.action-btn.clear')
    await clearBtn.trigger('click')
    expect(wrapper.emitted('clearFilters')).toBeTruthy()
  })

  it('closes panel on Apply click', async () => {
    const wrapper = mountBar()
    await wrapper.find('.filter-toggle-btn').trigger('click')
    expect(wrapper.find('.filter-panel').exists()).toBe(true)
    await wrapper.find('.action-btn.apply').trigger('click')
    expect(wrapper.find('.filter-panel').exists()).toBe(false)
  })

  it('shows active filter chips when panel is closed', () => {
    const wrapper = mountBar({
      activeFilters: ['monthly'],
      hasFilter: (f: string) => f === 'monthly',
    })
    const chips = wrapper.findAll('.active-chip')
    expect(chips).toHaveLength(1)
    expect(chips[0]!.text()).toContain('Monthly')
  })

  it('shows filter count badge', () => {
    const wrapper = mountBar({
      activeFilters: ['monthly', 'weekly'],
      hasFilter: (f: string) => ['monthly', 'weekly'].includes(f),
    })
    expect(wrapper.find('.filter-count').text()).toBe('2')
  })

  it('shows Clear All button when filters active and panel closed', () => {
    const wrapper = mountBar({
      activeFilters: ['monthly'],
      hasFilter: (f: string) => f === 'monthly',
    })
    expect(wrapper.find('.clear-btn').exists()).toBe(true)
  })

  it('emits clearFilters from Clear All button outside panel', async () => {
    const wrapper = mountBar({
      activeFilters: ['monthly'],
      hasFilter: (f: string) => f === 'monthly',
    })
    await wrapper.find('.clear-btn').trigger('click')
    expect(wrapper.emitted('clearFilters')).toBeTruthy()
  })

  it('emits toggleFilter when active chip clicked', async () => {
    const wrapper = mountBar({
      activeFilters: ['monthly'],
      hasFilter: (f: string) => f === 'monthly',
    })
    await wrapper.find('.active-chip').trigger('click')
    expect(wrapper.emitted('toggleFilter')![0]).toEqual(['monthly'])
  })

  it('shows check mark on selected filter in panel', async () => {
    const wrapper = mountBar({
      activeFilters: ['weekly'],
      hasFilter: (f: string) => f === 'weekly',
    })
    await wrapper.find('.filter-toggle-btn').trigger('click')
    const selected = wrapper.findAll('.filter-bubble.selected')
    expect(selected).toHaveLength(1)
    expect(wrapper.find('.check').exists()).toBe(true)
  })
})

