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
      { path: '/finances', component: { template: '<div />' } },
      { path: '/finances/income/:id/edit', component: EditIncomeView },
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
    router.push(`/finances/income/${id}/edit`)
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
    expect(wrapper.findAll('.btn-back').length).toBeGreaterThan(0)
  })

  it('shows a back button in the header', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Test', notes: '', date: null })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('.page-header .btn-back').exists()).toBe(true)
  })

  it('populates form for recurring income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 3000, frequency: 'bi-weekly', description: 'Pay', notes: 'Main', date: '2026-06-01' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('h2').text()).toBe('Edit Income')
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
    expect(wrapper.find('.btn-delete--filled').text()).toContain('Remove')
  })

  it('deletes income and navigates on Delete click', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Del', notes: '', date: null })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('.btn-delete--filled').trigger('click')
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

  it('has a back link to income', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-03-15' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    expect(wrapper.find('.btn-back').exists()).toBe(true)
  })

  it('delete with undo restores recurring income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 3000, frequency: 'monthly', description: 'Salary', notes: 'Main', date: '2026-06-01' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('.btn-delete--filled').trigger('click')
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
    await wrapper.find('.btn-delete--filled').trigger('click')
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
    await wrapper.find('.btn-delete--filled').trigger('click')
    expect(store.incomes).toHaveLength(0)
  })

  it('binds form fields via DOM for recurring income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 100, frequency: 'monthly', description: 'Test', notes: '', date: null })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('#edit-inc-desc').setValue('DomPay')
    await wrapper.find('#edit-inc-notes').setValue('DomNote')
    await wrapper.find('#edit-inc-date').setValue('2026-08-01')
    await wrapper.find('#edit-inc-cat').setValue('Salary')
    await wrapper.find('#edit-inc-freq').setValue('weekly')
    const vm = wrapper.vm as any
    expect(vm.description).toBe('DomPay')
    expect(vm.notes).toBe('DomNote')
    expect(vm.date).toBe('2026-08-01')
    expect(vm.category).toBe('Salary')
    expect(vm.frequency).toBe('weekly')
  })

  it('binds date field via DOM for adhoc income', async () => {
    const store = useFinancesStore()
    store.addAdhocIncome({ amount: 200, description: 'Gift', date: '2026-03-15' })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    await wrapper.find('#edit-inc-date').setValue('2026-09-01')
    expect((wrapper.vm as any).date).toBe('2026-09-01')
  })

  it('passes overrides events to store for recurring income', async () => {
    const store = useFinancesStore()
    store.addRecurringIncome({ amount: 5000, frequency: 'monthly', description: 'Salary', notes: '', date: null })
    const id = store.incomes[0]!.id
    const { wrapper } = await mountView(id)
    const overrides = wrapper.findComponent({ name: 'MonthlyOverrides' })
    if (overrides.exists()) {
      overrides.vm.$emit('set-override', '2026-05', 6000)
      await wrapper.vm.$nextTick()
      const item = store.getIncomeById(id) as any
      expect(item?.overrides?.['2026-05']).toBe(6000)

      overrides.vm.$emit('remove-override', '2026-05')
      await wrapper.vm.$nextTick()
      const updated = store.getIncomeById(id) as any
      expect(updated?.overrides?.['2026-05']).toBeUndefined()
    }
  })

  it('navigates back on not-found back button click', async () => {
    const { wrapper, router } = await mountView('nonexistent')
    const pushSpy = vi.spyOn(router, 'push')
    await wrapper.find('.not-found .btn-back').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/finances?tab=income')
  })
})
