<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => {
  // Determine tab from route path or query
  if (route.path.includes('/expenses')) return 'expenses'
  if (route.path.includes('/income')) return 'income'
  return (route.query.tab as string) || 'income'
})


function switchTab(tab: 'income' | 'expenses') {
  router.replace({ path: '/finances', query: { tab } })
}
</script>

<template>
  <div class="page">
    <h1>Finances</h1>

    <!-- Tab switcher -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'income' }" @click="switchTab('income')">
        Income
      </button>
      <button :class="{ active: activeTab === 'expenses' }" @click="switchTab('expenses')">
        Expenses
      </button>
    </div>

    <router-view />
  </div>
</template>

<style scoped>
.page { max-width: 600px; margin: 0 auto; }
h1 { margin-bottom: 1.5rem; }

/* Tabs */
.tabs { display: flex; gap: 0; margin-bottom: 1.5rem; }
.tabs button {
  flex: 1; padding: 0.6rem; border: 2px solid var(--color-primary); background: var(--color-surface); color: var(--color-primary);
  font-weight: 600; cursor: pointer; font-size: 0.95rem;
}
.tabs button:first-child { border-radius: 8px 0 0 8px; }
.tabs button:last-child { border-radius: 0 8px 8px 0; }
.tabs button.active { background: var(--color-primary); color: white; }
</style>

