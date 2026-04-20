import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/income', name: 'income', component: () => import('@/views/IncomeView.vue') },
    { path: '/income/:id/edit', name: 'edit-income', component: () => import('@/views/EditIncomeView.vue') },
    { path: '/expenses', name: 'expenses', component: () => import('@/views/ExpensesView.vue') },
    { path: '/expenses/:id/edit', name: 'edit-expense', component: () => import('@/views/EditExpenseView.vue') },
    { path: '/analytics', name: 'analytics', component: () => import('@/views/AnalyticsView.vue') },
    { path: '/budgets', name: 'budgets', component: () => import('@/views/BudgetView.vue') },
  ],
})

export default router
