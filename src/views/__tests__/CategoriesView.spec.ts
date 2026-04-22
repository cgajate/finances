import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CategoriesView from '@/views/CategoriesView.vue'
import { useCategoriesStore } from '@/stores/categories'

vi.mock('@/composables/useSnackbar', () => ({
  useSnackbar: () => ({ show: vi.fn() }),
}))

describe('CategoriesView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  function mountView() {
    const pinia = createPinia()
    setActivePinia(pinia)
    return mount(CategoriesView, { global: { plugins: [pinia] } })
  }

  it('renders title', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Manage Categories')
  })

  it('shows Expense and Income tabs', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Expense')
    expect(wrapper.text()).toContain('Income')
  })

  it('shows add form', () => {
    const wrapper = mountView()
    expect(wrapper.find('.add-form').exists()).toBe(true)
    expect(wrapper.find('.add-input').exists()).toBe(true)
  })

  it('shows active categories', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Active Categories')
    // Default seeded categories should appear
    expect(wrapper.text()).toContain('Food')
  })

  it('adds a new category', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia] } })
    await wrapper.find('.add-input').setValue('Pets')
    await wrapper.find('.add-form').trigger('submit')
    expect(wrapper.text()).toContain('Pets')
  })

  it('does not add empty category', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCategoriesStore()
    const before = store.categories.length
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia] } })
    await wrapper.find('.add-form').trigger('submit')
    expect(store.categories.length).toBe(before)
  })

  it('switches to income tab', async () => {
    const wrapper = mountView()
    const tabs = wrapper.findAll('.tab-bar button')
    await tabs[1]!.trigger('click')
    expect(wrapper.text()).toContain('Salary')
  })

  it('starts edit on click', async () => {
    const wrapper = mountView()
    const editBtns = wrapper.findAll('.action-btn.edit')
    if (editBtns.length > 0) {
      await editBtns[0]!.trigger('click')
      expect(wrapper.find('.edit-input').exists()).toBe(true)
    }
  })

  it('saves edit', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCategoriesStore()
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia] } })
    const editBtns = wrapper.findAll('.action-btn.edit')
    if (editBtns.length > 0) {
      await editBtns[0]!.trigger('click')
      const input = wrapper.find('.edit-input')
      await input.setValue('Renamed')
      await wrapper.find('.action-btn.save').trigger('click')
      expect(wrapper.text()).toContain('Renamed')
    }
  })

  it('cancels edit', async () => {
    const wrapper = mountView()
    const editBtns = wrapper.findAll('.action-btn.edit')
    if (editBtns.length > 0) {
      await editBtns[0]!.trigger('click')
      expect(wrapper.find('.edit-input').exists()).toBe(true)
      await wrapper.find('.action-btn.cancel').trigger('click')
      expect(wrapper.find('.edit-input').exists()).toBe(false)
    }
  })

  it('soft-deletes a category', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCategoriesStore()
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia] } })
    const deleteBtns = wrapper.findAll('.action-btn.delete')
    const catCount = store.activeExpenseCategories.length
    if (deleteBtns.length > 0) {
      await deleteBtns[0]!.trigger('click')
      expect(store.activeExpenseCategories.length).toBe(catCount - 1)
    }
  })

  it('shows deleted section toggle', () => {
    const wrapper = mountView()
    expect(wrapper.find('.toggle-deleted').exists()).toBe(true)
    expect(wrapper.text()).toContain('Show')
    expect(wrapper.text()).toContain('Removed Categories')
  })

  it('toggles deleted section', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCategoriesStore()
    // Delete one
    const cat = store.categories.find((c) => c.type === 'expense' && !c.deleted)!
    store.deleteCategory(cat.id)
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia] } })
    await wrapper.find('.toggle-deleted').trigger('click')
    expect(wrapper.find('.deleted-list').exists()).toBe(true)
  })

  it('restores a deleted category', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCategoriesStore()
    const cat = store.categories.find((c) => c.type === 'expense' && !c.deleted)!
    const name = cat.name
    store.deleteCategory(cat.id)
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia] } })
    await wrapper.find('.toggle-deleted').trigger('click')
    await wrapper.find('.action-btn.restore').trigger('click')
    expect(store.activeExpenseCategories).toContain(name)
  })

  it('shows no-removed message when none deleted', async () => {
    const wrapper = mountView()
    await wrapper.find('.toggle-deleted').trigger('click')
    expect(wrapper.text()).toContain('No removed categories')
  })

  it('shows empty message when all categories deleted', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCategoriesStore()
    const expCats = store.categories.filter((c) => c.type === 'expense' && !c.deleted)
    for (const c of expCats) {
      store.deleteCategory(c.id)
    }
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toContain('No active categories')
  })

  it('add-btn is disabled when input empty', () => {
    const wrapper = mountView()
    const addBtn = wrapper.find('.add-btn')
    expect(addBtn.attributes('disabled')).toBeDefined()
  })

  it('save edit ignores empty name', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCategoriesStore()
    const cat = store.categories.find((c) => c.type === 'expense' && !c.deleted)!
    const originalName = cat.name
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia] } })
    const editBtns = wrapper.findAll('.action-btn.edit')
    if (editBtns.length > 0) {
      await editBtns[0]!.trigger('click')
      await wrapper.find('.edit-input').setValue('')
      await wrapper.find('.action-btn.save').trigger('click')
      // Name should not change
      expect(store.categories.find((c) => c.id === cat.id)!.name).toBe(originalName)
    }
  })

  it('sends edit via enter key', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia] } })
    const editBtns = wrapper.findAll('.action-btn.edit')
    if (editBtns.length > 0) {
      await editBtns[0]!.trigger('click')
      const input = wrapper.find('.edit-input')
      await input.setValue('ViaEnter')
      await input.trigger('keyup.enter')
      expect(wrapper.text()).toContain('ViaEnter')
    }
  })

  it('cancels edit via escape key', async () => {
    const wrapper = mountView()
    const editBtns = wrapper.findAll('.action-btn.edit')
    if (editBtns.length > 0) {
      await editBtns[0]!.trigger('click')
      expect(wrapper.find('.edit-input').exists()).toBe(true)
      await wrapper.find('.edit-input').trigger('keyup.escape')
      expect(wrapper.find('.edit-input').exists()).toBe(false)
    }
  })

  it('deleted count shows correct number', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useCategoriesStore()
    const cat = store.categories.find((c) => c.type === 'expense' && !c.deleted)!
    store.deleteCategory(cat.id)
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia] } })
    expect(wrapper.find('.deleted-count').text()).toContain('1')
  })
})

