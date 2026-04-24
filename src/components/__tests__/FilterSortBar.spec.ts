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

  it('opening sort closes filter', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    expect(wrapper.text()).toContain('Frequency')
    await wrapper.findAll('.trigger-btn')[1]!.trigger('click')
    expect(wrapper.text()).toContain('Sort By')
    expect(wrapper.text()).not.toContain('Frequency')
  })

  it('closes filter panel when clicking filter trigger while open', async () => {
    const wrapper = mountBar()
    const filterBtn = wrapper.findAll('.trigger-btn')[0]!
    await filterBtn.trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(true)
    await filterBtn.trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(false)
  })

  it('closes sort panel when clicking sort trigger while open', async () => {
    const wrapper = mountBar()
    const sortBtn = wrapper.findAll('.trigger-btn')[1]!
    await sortBtn.trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(true)
    await sortBtn.trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(false)
  })

  it('uses income categories when type is income', async () => {
    const wrapper = mountBar({ type: 'income' })
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    // Should open filter panel using income categories
    expect(wrapper.find('.bubble').exists()).toBe(true)
    expect(wrapper.text()).toContain('Category')
  })

  it('emits toggleFilter to remove previously active filters on submit', async () => {
    const wrapper = mountBar({ activeFilters: ['weekly', 'monthly'] })
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    // Draft starts with ['weekly', 'monthly']; remove 'monthly' by toggling it
    const pills = wrapper.findAll('.option-pill')
    // Find and click the 'monthly' pill to deselect it
    const monthlyPill = pills.find((p) => p.text().toLowerCase().includes('month'))
    expect(monthlyPill).toBeTruthy()
    await monthlyPill!.trigger('click')
    await wrapper.find('.footer-btn.submit').trigger('click')
    const toggleEvents = wrapper.emitted('toggleFilter') as string[][]
    expect(toggleEvents).toBeTruthy()
    expect(toggleEvents.some((ev) => ev[0] === 'monthly')).toBe(true)
  })

  it('emits toggleCategoryFilter to remove previously active category on submit', async () => {
    const wrapper = mountBar({ activeCategoryFilters: ['Food'] })
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    // Draft starts with ['Food']; find and deselect it
    const pills = wrapper.findAll('.option-pill')
    const foodPill = pills.find((p) => p.text() === 'Food')
    if (foodPill) {
      await foodPill.trigger('click')
    }
    await wrapper.find('.footer-btn.submit').trigger('click')
    const catEvents = wrapper.emitted('toggleCategoryFilter') as string[][]
    expect(catEvents).toBeTruthy()
    expect(catEvents.some((ev) => ev[0] === 'Food')).toBe(true)
  })

  it('toggles category pill on and off in filter draft', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    const allPills = wrapper.findAll('.option-pill')
    // Category pills appear after the 5 frequency pills
    const catPill = allPills[5]
    expect(catPill).toBeTruthy()
    // Select category
    await catPill!.trigger('click')
    expect(catPill!.classes()).toContain('selected')
    // Deselect category (exercises draftToggleCat removal branch)
    await catPill!.trigger('click')
    expect(catPill!.classes()).not.toContain('selected')
  })

  it('adds new category filter and removes old one on submit', async () => {
    // Start with 'Housing' active, switch to 'Food'
    const wrapper = mountBar({ activeCategoryFilters: ['Housing'] })
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    const allPills = wrapper.findAll('.option-pill')
    // Find Housing pill (should be selected) and Food pill
    const housingPill = allPills.find((p) => p.text() === 'Housing')
    const foodPill = allPills.find((p) => p.text() === 'Food')
    expect(housingPill).toBeTruthy()
    expect(foodPill).toBeTruthy()
    // Deselect Housing, select Food
    await housingPill!.trigger('click')
    await foodPill!.trigger('click')
    await wrapper.find('.footer-btn.submit').trigger('click')
    const catEvents = wrapper.emitted('toggleCategoryFilter') as string[][]
    expect(catEvents).toBeTruthy()
    // Should have emitted for both Housing (remove) and Food (add)
    expect(catEvents.some((ev) => ev[0] === 'Housing')).toBe(true)
    expect(catEvents.some((ev) => ev[0] === 'Food')).toBe(true)
  })

  it('closes filter on backdrop click', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(true)
    await wrapper.find('.bubble-backdrop').trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(false)
  })

  it('does not show badge when no filters active', () => {
    const wrapper = mountBar()
    expect(wrapper.find('.trigger-badge').exists()).toBe(false)
  })

  it('closes sort panel on cancel', async () => {
    const wrapper = mountBar()
    await wrapper.findAll('.trigger-btn')[1]!.trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(true)
    await wrapper.find('.footer-btn.cancel').trigger('click')
    expect(wrapper.find('.bubble').exists()).toBe(false)
  })

  it('applies has-count class to filter trigger when filters are active', () => {
    const wrapper = mountBar({ activeFilters: ['weekly'] })
    const filterBtn = wrapper.findAll('.trigger-btn')[0]!
    expect(filterBtn.classes()).toContain('has-count')
  })

  it('emits toggleCategoryFilter for removed categories in submitFilter', async () => {
    // Start with 'Food' active, then submit with empty draft (clearing it)
    const wrapper = mountBar({ activeCategoryFilters: ['Food'] })
    await wrapper.findAll('.trigger-btn')[0]!.trigger('click')
    // Draft starts with ['Food']. Clear all draft selections.
    await wrapper.find('.footer-btn.clear').trigger('click')
    // Submit with empty draft — should emit toggleCategoryFilter('Food') to remove it
    await wrapper.find('.footer-btn.submit').trigger('click')
    const catEvents = wrapper.emitted('toggleCategoryFilter') as string[][]
    expect(catEvents).toBeTruthy()
    expect(catEvents[0]).toEqual(['Food'])
  })
})
