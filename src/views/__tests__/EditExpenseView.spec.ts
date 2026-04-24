import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import EditExpenseView from '@/views/EditExpenseView.vue'
import { useFinancesStore } from '@/stores/finances'
import { useSnackbar } from '@/composables/useSnackbar'

function makeRouter(): Router {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/finances', component: { template: '<div />' } },
      { path: '/finances/expenses/:id/edit', component: EditExpenseView },
    ],
  })
}

describe('EditExpenseView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
    useSnackbar().dismissAll()
  })

  async function mountView(id: string) {
    const router = makeRouter()
    router.push(`/finances/expenses/${id}/edit`)
    await router.isReady()
    const wrapper = mount(EditExpenseView, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    return { wrapper, router }
  }

  it('shows not found for invalid id', async () => {
    const { wrapper } = await mountView('nonexistent')
    expect(wrapper.text()).toContain('Expense entry not found')
    expect(wrapper.findAll('.btn-back').length).toBeGreaterThan(0)
  })

  it('shows a back button in the header', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 100, description: 'Test', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('.page-header .btn-back').exists()).toBe(true)
  })

  it('populates form for recurring expense', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 1500, frequency: 'monthly', description: 'Rent', notes: 'Apt', dueDate: '2026-01-01' })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('h2').text()).toBe('Edit Expense')
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Rent')
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('monthly')
  })

  it('populates form for adhoc expense', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 200, description: 'Fix', notes: 'Plumb', dueDate: '2026-03-15' })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Fix')
    // No frequency select for adhoc, but category select exists
    expect(wrapper.findAll('select')).toHaveLength(1)
  })

  it('shows Save, Cancel, and Delete buttons', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 100, description: 'Test', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('.btn-save').exists()).toBe(true)
    expect(wrapper.find('.btn-delete--filled').exists()).toBe(true)
  })

  it('deletes expense on Delete click', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 100, description: 'Del', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('.btn-delete--filled').trigger('click')
    expect(store.expenses).toHaveLength(0)
  })

  it('shows Due Date * for yearly frequency', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 500, frequency: 'yearly', description: 'Annual', notes: '', dueDate: '2026-12-01' })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.text()).toContain('Due Date *')
  })

  it('shows Due Date (optional) for non-yearly', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 500, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.text()).toContain('Due Date (optional)')
  })

  it('shows Notes field and textarea', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'T', notes: 'Noted', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('shows Assigned To field', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'T', notes: '', dueDate: null, assignedTo: 'Mom' })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.text()).toContain('Assigned To')
  })

  it('saves recurring expense changes on submit', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'Rent', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    const vm = wrapper.vm as any
    vm.description = 'Updated Rent'
    vm.amount = 2000
    vm.frequency = 'weekly'
    vm.dueDate = '2026-07-01'
    vm.notes = 'New note'
    vm.category = 'Housing'
    vm.assignedTo = 'Dad'
    await wrapper.find('form').trigger('submit')
    expect(store.expenses[0]!.description).toBe('Updated Rent')
    expect(store.expenses[0]!.amount).toBe(2000)
  })

  it('saves adhoc expense changes on submit', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Fix', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    const vm = wrapper.vm as any
    vm.description = 'Updated Fix'
    vm.amount = 300
    vm.notes = 'Plumbing'
    vm.category = 'Housing'
    await wrapper.find('form').trigger('submit')
    expect(store.expenses[0]!.description).toBe('Updated Fix')
    expect(store.expenses[0]!.amount).toBe(300)
  })

  it('does not save without description', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Fix', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    const vm = wrapper.vm as any
    vm.description = ''
    await wrapper.find('form').trigger('submit')
    expect(store.expenses[0]!.description).toBe('Fix')
  })

  it('does not save without amount', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Fix', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    const vm = wrapper.vm as any
    vm.amount = null
    await wrapper.find('form').trigger('submit')
    expect(store.expenses[0]!.amount).toBe(50)
  })

  it('does not save yearly without dueDate', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 100, frequency: 'yearly', description: 'Annual', notes: '', dueDate: '2026-12-01' })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    const vm = wrapper.vm as any
    vm.dueDate = ''
    await wrapper.find('form').trigger('submit')
    // Should not have updated since yearly requires dueDate
    expect(store.expenses[0]!.dueDate).toBe('2026-12-01')
  })

  it('has a back link to expenses', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 50, description: 'Fix', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('.btn-back').exists()).toBe(true)
  })

  it('delete with undo restores recurring expense', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 100, frequency: 'monthly', description: 'Internet', notes: 'ISP', dueDate: '2026-05-01', assignedTo: 'Mom' })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('.btn-delete--filled').trigger('click')
    expect(store.expenses).toHaveLength(0)
    const snackbar = useSnackbar()
    snackbar.undo(snackbar.items.value[0]!.id)
    expect(store.expenses).toHaveLength(1)
    expect(store.expenses[0]!.description).toBe('Internet')
  })

  it('delete with undo restores adhoc expense', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 200, description: 'Repair', notes: 'Brakes', dueDate: '2026-05-01', assignedTo: 'Dad' })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('.btn-delete--filled').trigger('click')
    expect(store.expenses).toHaveLength(0)
    const snackbar = useSnackbar()
    snackbar.undo(snackbar.items.value[0]!.id)
    expect(store.expenses).toHaveLength(1)
  })
})
