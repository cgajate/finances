import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import EditExpenseView from '@/views/EditExpenseView.vue'
import { useFinancesStore } from '@/stores/finances'

function makeRouter(): Router {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/expenses', component: { template: '<div />' } },
      { path: '/expenses/:id/edit', component: EditExpenseView },
    ],
  })
}

describe('EditExpenseView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  async function mountView(id: string) {
    const router = makeRouter()
    router.push(`/expenses/${id}/edit`)
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
    expect(wrapper.find('.btn-back').exists()).toBe(true)
  })

  it('populates form for recurring expense', async () => {
    const store = useFinancesStore()
    store.addRecurringExpense({ amount: 1500, frequency: 'monthly', description: 'Rent', notes: 'Apt', dueDate: '2026-01-01' })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('h1').text()).toBe('Edit Expense')
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Rent')
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('monthly')
  })

  it('populates form for adhoc expense', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 200, description: 'Fix', notes: 'Plumb', dueDate: '2026-03-15' })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Fix')
    // No frequency select for adhoc
    expect(wrapper.findAll('select')).toHaveLength(0)
  })

  it('shows Save, Cancel, and Delete buttons', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 100, description: 'Test', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('.btn-save').exists()).toBe(true)
    expect(wrapper.find('.btn-cancel').exists()).toBe(true)
    expect(wrapper.find('.btn-delete').exists()).toBe(true)
  })

  it('deletes expense on Delete click', async () => {
    const store = useFinancesStore()
    store.addAdhocExpense({ amount: 100, description: 'Del', notes: '', dueDate: null })
    const id = store.expenses[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('.btn-delete').trigger('click')
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
})

