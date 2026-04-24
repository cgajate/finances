import { describe, it, expect } from 'vitest'
import router from '@/router/index'

describe('router', () => {
  it('has a dashboard route at /', () => {
    const route = router.resolve('/')
    expect(route.name).toBe('dashboard')
  })

  it('has a finances route at /finances', () => {
    const route = router.resolve('/finances')
    expect(route.name).toBe('finances')
  })

  it('has an add-income route at /finances/income/add', () => {
    const route = router.resolve('/finances/income/add')
    expect(route.name).toBe('add-income')
  })

  it('has an edit-income route at /finances/income/:id/edit', () => {
    const route = router.resolve('/finances/income/abc123/edit')
    expect(route.name).toBe('edit-income')
    expect(route.params.id).toBe('abc123')
  })

  it('has an add-expense route at /finances/expenses/add', () => {
    const route = router.resolve('/finances/expenses/add')
    expect(route.name).toBe('add-expense')
  })

  it('has an edit-expense route at /finances/expenses/:id/edit', () => {
    const route = router.resolve('/finances/expenses/xyz789/edit')
    expect(route.name).toBe('edit-expense')
    expect(route.params.id).toBe('xyz789')
  })

  it('has a redirect from /income to /finances', () => {
    const routes = router.getRoutes()
    const incomeRedirect = routes.find(r => r.path === '/income')
    expect(incomeRedirect).toBeDefined()
    expect(incomeRedirect!.redirect).toBe('/finances?tab=income')
  })

  it('has a redirect from /expenses to /finances', () => {
    const routes = router.getRoutes()
    const expensesRedirect = routes.find(r => r.path === '/expenses')
    expect(expensesRedirect).toBeDefined()
    expect(expensesRedirect!.redirect).toBe('/finances?tab=expenses')
  })

  it('has a redirect from /income/add to /finances/income/add', () => {
    const routes = router.getRoutes()
    const addIncomeRedirect = routes.find(r => r.path === '/income/add')
    expect(addIncomeRedirect).toBeDefined()
    expect(addIncomeRedirect!.redirect).toBe('/finances/income/add')
  })

  it('has a redirect from /expenses/add to /finances/expenses/add', () => {
    const routes = router.getRoutes()
    const addExpenseRedirect = routes.find(r => r.path === '/expenses/add')
    expect(addExpenseRedirect).toBeDefined()
    expect(addExpenseRedirect!.redirect).toBe('/finances/expenses/add')
  })

  it('has an analytics route at /analytics', () => {
    const route = router.resolve('/analytics')
    expect(route.name).toBe('analytics')
  })

  it('has a budgets route at /goals', () => {
    const route = router.resolve('/goals')
    expect(route.name).toBe('budgets')
  })

  it('has a savings route at /goals/savings', () => {
    const route = router.resolve('/goals/savings')
    expect(route.name).toBe('savings')
  })

  it('has a redirect from /budgets to /goals', () => {
    const routes = router.getRoutes()
    const budgetsRedirect = routes.find(r => r.path === '/budgets')
    expect(budgetsRedirect).toBeDefined()
    expect(budgetsRedirect!.redirect).toBe('/goals')
  })

  it('has a redirect from /savings to /goals/savings', () => {
    const routes = router.getRoutes()
    const savingsRedirect = routes.find(r => r.path === '/savings')
    expect(savingsRedirect).toBeDefined()
    expect(savingsRedirect!.redirect).toBe('/goals/savings')
  })

  it('has a calendar route at /calendar', () => {
    const route = router.resolve('/calendar')
    expect(route.name).toBe('calendar')
  })

  it('has an activity route at /activity', () => {
    const route = router.resolve('/activity')
    expect(route.name).toBe('activity')
  })

  it('has a categories route at /categories', () => {
    const route = router.resolve('/categories')
    expect(route.name).toBe('categories')
  })

  it('has 21 routes total', () => {
    expect(router.getRoutes()).toHaveLength(21)
  })
})
