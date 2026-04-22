import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    {
      path: '/finances',
      component: () => import('@/views/FinancesView.vue'),
      children: [
        { path: '', name: 'finances', component: () => import('@/views/FinancesListView.vue') },
        { path: 'income/add', name: 'add-income', component: () => import('@/views/AddIncomeView.vue') },
        { path: 'income/:id/edit', name: 'edit-income', component: () => import('@/views/EditIncomeView.vue') },
        { path: 'expenses/add', name: 'add-expense', component: () => import('@/views/AddExpenseView.vue') },
        { path: 'expenses/:id/edit', name: 'edit-expense', component: () => import('@/views/EditExpenseView.vue') },
      ],
    },
    { path: '/income', redirect: '/finances?tab=income' },
    { path: '/expenses', redirect: '/finances?tab=expenses' },
    { path: '/income/add', redirect: '/finances/income/add' },
    { path: '/expenses/add', redirect: '/finances/expenses/add' },
    { path: '/analytics', name: 'analytics', component: () => import('@/views/AnalyticsView.vue') },
    {
      path: '/goals',
      component: () => import('@/views/GoalsView.vue'),
      children: [
        { path: '', name: 'budgets', component: () => import('@/views/BudgetView.vue') },
        { path: 'savings', name: 'savings', component: () => import('@/views/SavingsGoalsView.vue') },
      ],
    },
    { path: '/budgets', redirect: '/goals' },
    { path: '/savings', redirect: '/goals/savings' },
    { path: '/calendar', name: 'calendar', component: () => import('@/views/BillCalendarView.vue') },
    { path: '/activity', name: 'activity', component: () => import('@/views/ActivityFeedView.vue') },
    { path: '/categories', name: 'categories', component: () => import('@/views/CategoriesView.vue') },
  ],
})

export default router
