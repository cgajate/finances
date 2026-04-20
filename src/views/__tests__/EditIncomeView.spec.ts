import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import EditIncomeView from '@/views/EditIncomeView.vue'
import { useFinancesStore } from '@/stores/finances'

function makeRouter(id: string): Router {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/income', component: { template: '<div />' } },
      { path: '/income/:id/edit', component: EditIncomeView },
    ],
  })
}

describe('EditIncomeView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  async function mountView(id: string) {
    const router = makeRouter(id)
    router.push(`/income/${id}/edit`)
    await router.isReady()
    const wrapper = mount(EditIncomeView, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    return { wrapper, router }
  }

  it('shows not found for invalid id', async () => {
    const { wrapper } = await mountView('nonexistent')
    expect(wrapper.text()).toContain('Income entry not found')
    expect(wrapper.find('.btn-back').exists()).toBe(true)
  })

  it('populates form for recurring income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 3000, frequency: 'bi-weekly', description: 'Pay', notes: 'Main', date: '2026-06-01' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('h1').text()).toBe('Edit Income')
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Pay')
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('bi-weekly')
  })

  it('populates form for adhoc income', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-03-15' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Gift')
    // No frequency select for adhoc, but category select exists
    expect(wrapper.findAll('select')).toHaveLength(1)
  })

  it('shows Save, Cancel, and Delete buttons', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Test', notes: '', date: null })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('.btn-save').text()).toContain('Save')
    expect(wrapper.find('.btn-cancel').text()).toContain('Cancel')
    expect(wrapper.find('.btn-delete').text()).toContain('Delete')
  })

  it('deletes income and navigates on Delete click', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Del', notes: '', date: null })
    const id = store.incomes[0]!.id
    const { wrapper, router } = await mountView(id)
    await wrapper.find('.btn-delete').trigger('click')
    expect(store.incomes).toHaveLength(0)
  })

  it('shows Date * label for yearly frequency', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'yearly', description: 'Annual', notes: '', date: '2026-04-01' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.text()).toContain('Date *')
  })

  it('shows Date * label for adhoc income', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 100, description: 'Adhoc', date: '2026-04-01' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.text()).toContain('Date *')
  })

  it('shows Notes field for recurring income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Test', notes: 'MyNote', date: null })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('hides Notes field for adhoc income', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 100, description: 'Adhoc', date: '2026-04-01' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('textarea').exists()).toBe(false)
  })
})

