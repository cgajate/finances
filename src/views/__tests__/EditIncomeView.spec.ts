import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import EditIncomeView from '@/views/EditIncomeView.vue'
import { useFinancesStore } from '@/stores/finances'
import { useSnackbar } from '@/composables/useSnackbar'

function makeRouter(): Router {
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
    useSnackbar().dismissAll()
  })

  async function mountView(id: string) {
    const router = makeRouter()
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
    expect(wrapper.find('.btn-delete--outline').text()).toContain('Delete')
  })

  it('deletes income and navigates on Delete click', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Del', notes: '', date: null })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('.btn-delete--outline').trigger('click')
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

  it('saves recurring income changes on submit', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 1000, frequency: 'monthly', description: 'Salary', notes: '', date: null })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    const vm = wrapper.vm as any
    vm.description = 'Updated Salary'
    vm.amount = 5000
    vm.frequency = 'bi-weekly'
    vm.date = '2026-07-01'
    vm.notes = 'New note'
    vm.category = 'Salary'
    await wrapper.find('form').trigger('submit')
    expect(store.incomes[0]!.description).toBe('Updated Salary')
    expect(store.incomes[0]!.amount).toBe(5000)
  })

  it('saves adhoc income changes on submit', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-03-15' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    const vm = wrapper.vm as any
    vm.description = 'Updated Gift'
    vm.amount = 500
    vm.date = '2026-06-01'
    vm.category = 'Gifts'
    await wrapper.find('form').trigger('submit')
    expect(store.incomes[0]!.description).toBe('Updated Gift')
    expect(store.incomes[0]!.amount).toBe(500)
  })

  it('does not save without description', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-03-15' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    const vm = wrapper.vm as any
    vm.description = ''
    await wrapper.find('form').trigger('submit')
    expect(store.incomes[0]!.description).toBe('Gift')
  })

  it('does not save without amount', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-03-15' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    const vm = wrapper.vm as any
    vm.amount = null
    await wrapper.find('form').trigger('submit')
    expect(store.incomes[0]!.amount).toBe(200)
  })

  it('does not save yearly without date', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'yearly', description: 'Annual', notes: '', date: '2026-04-01' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    const vm = wrapper.vm as any
    vm.date = ''
    await wrapper.find('form').trigger('submit')
    expect(store.incomes[0]!.description).toBe('Annual')
  })

  it('cancel navigates back', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-03-15' })
    const id = store.incomes[0]!.id
    const { wrapper, router } = await mountView(id)
    const pushSpy = vi.spyOn(router, 'push')
    await wrapper.find('.btn-cancel').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/income')
  })

  it('delete with undo restores recurring income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 3000, frequency: 'monthly', description: 'Salary', notes: 'Main', date: '2026-06-01' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('.btn-delete--outline').trigger('click')
    expect(store.incomes).toHaveLength(0)
    const snackbar = useSnackbar()
    snackbar.undo(snackbar.items.value[0]!.id)
    expect(store.incomes).toHaveLength(1)
    expect(store.incomes[0]!.description).toBe('Salary')
  })

  it('delete with undo restores adhoc income', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Freelance', date: '2026-03-15' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('.btn-delete--outline').trigger('click')
    expect(store.incomes).toHaveLength(0)
    const snackbar2 = useSnackbar()
    snackbar2.undo(snackbar2.items.value[0]!.id)
    expect(store.incomes).toHaveLength(1)
  })

  it('delete does nothing for missing item', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-03-15' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    // Remove the item first
    store.removeIncome(id)
    // Now trigger delete on the view - should not crash
    await wrapper.find('.btn-delete--outline').trigger('click')
    expect(store.incomes).toHaveLength(0)
  })
})
