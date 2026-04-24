import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SortPanel from '@/components/SortPanel.vue'
import type { SortField, SortDirection } from '@/composables/useSortFilter'

function mountPanel(overrides: { sortField?: SortField; sortDirection?: SortDirection } = {}) {
  return mount(SortPanel, {
    props: {
      sortField: overrides.sortField ?? 'newest',
      sortDirection: overrides.sortDirection ?? 'asc',
    },
    global: {
      stubs: { 'font-awesome-icon': true },
    },
  })
}

describe('SortPanel', () => {
  it('renders the Sort heading', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.bubble-header h3').text()).toContain('Sort')
  })

  it('has dialog role with aria-label', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('Sort options')
  })

  it('renders three sort field options', () => {
    const wrapper = mountPanel()
    const pills = wrapper.findAll('.option-pill')
    expect(pills).toHaveLength(3)
    expect(pills.map((p) => p.text())).toEqual(['Newest', 'Amount', 'Alphabetical'])
  })

  it('marks the active sort field as selected', () => {
    const wrapper = mountPanel({ sortField: 'amount' })
    const pills = wrapper.findAll('.option-pill')
    expect(pills[0]!.classes()).not.toContain('selected')
    expect(pills[1]!.classes()).toContain('selected')
    expect(pills[2]!.classes()).not.toContain('selected')
  })

  it('marks newest as selected by default', () => {
    const wrapper = mountPanel()
    expect(wrapper.findAll('.option-pill')[0]!.classes()).toContain('selected')
  })

  it('marks alpha as selected', () => {
    const wrapper = mountPanel({ sortField: 'alpha' })
    expect(wrapper.findAll('.option-pill')[2]!.classes()).toContain('selected')
  })

  it('emits update:sortField when a sort pill is clicked', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.option-pill')[1]!.trigger('click')
    expect(wrapper.emitted('update:sortField')).toEqual([['amount']])
  })

  it('emits update:sortField for alpha', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.option-pill')[2]!.trigger('click')
    expect(wrapper.emitted('update:sortField')).toEqual([['alpha']])
  })

  it('emits update:sortField for newest', async () => {
    const wrapper = mountPanel({ sortField: 'amount' })
    await wrapper.findAll('.option-pill')[0]!.trigger('click')
    expect(wrapper.emitted('update:sortField')).toEqual([['newest']])
  })

  it('renders two direction buttons', () => {
    const wrapper = mountPanel()
    const btns = wrapper.findAll('.direction-btn')
    expect(btns).toHaveLength(2)
    expect(btns[0]!.text()).toContain('Ascending')
    expect(btns[1]!.text()).toContain('Descending')
  })

  it('marks active direction as selected', () => {
    const wrapper = mountPanel({ sortDirection: 'desc' })
    const btns = wrapper.findAll('.direction-btn')
    expect(btns[0]!.classes()).not.toContain('selected')
    expect(btns[1]!.classes()).toContain('selected')
  })

  it('emits update:sortDirection when asc is clicked', async () => {
    const wrapper = mountPanel({ sortDirection: 'desc' })
    await wrapper.findAll('.direction-btn')[0]!.trigger('click')
    expect(wrapper.emitted('update:sortDirection')).toEqual([['asc']])
  })

  it('emits update:sortDirection when desc is clicked', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.direction-btn')[1]!.trigger('click')
    expect(wrapper.emitted('update:sortDirection')).toEqual([['desc']])
  })

  it('emits clear when Clear button is clicked', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.footer-btn.clear').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('emits cancel when Cancel button is clicked', async () => {
    const wrapper = mountPanel()
    await wrapper.find('.footer-btn.cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('emits submit when Apply button is clicked', async () => {
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
    await wrapper.find('.sort-bubble').trigger('keydown.escape')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('close button has accessible label', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.bubble-close').attributes('aria-label')).toBe('Close')
  })
})

