import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import GoalsView from '@/views/GoalsView.vue'
import { createRouter, createWebHistory } from 'vue-router'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/goals',
        component: GoalsView,
        children: [
          { path: '', name: 'budgets', component: { template: '<div>Budgets</div>' } },
          { path: 'savings', name: 'savings', component: { template: '<div>Savings</div>' } },
        ],
      },
    ],
  })
}

describe('GoalsView', () => {
  async function mountView(path = '/goals') {
    const router = makeRouter()
    router.push(path)
    await router.isReady()
    return mount(GoalsView, { global: { plugins: [router] } })
  }

  it('renders the title', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('h1').text()).toBe('Goals')
  })

  it('shows budgets tab active by default', async () => {
    const wrapper = await mountView()
    const tabs = wrapper.findAll('.tab-bar button')
    expect(tabs[0]!.classes()).toContain('active')
  })

  it('shows savings tab active at /goals/savings', async () => {
    const wrapper = await mountView('/goals/savings')
    const tabs = wrapper.findAll('.tab-bar button')
    expect(tabs[1]!.classes()).toContain('active')
  })

  it('switches to savings tab on click', async () => {
    const wrapper = await mountView()
    const tabs = wrapper.findAll('.tab-bar button')
    await tabs[1]!.trigger('click')
    await flushPromises()
    expect(tabs[1]!.classes()).toContain('active')
  })

  it('switches to budgets tab on click', async () => {
    const wrapper = await mountView('/goals/savings')
    const tabs = wrapper.findAll('.tab-bar button')
    await tabs[0]!.trigger('click')
    await flushPromises()
    expect(tabs[0]!.classes()).toContain('active')
  })
})

