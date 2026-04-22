<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => {
  if (route.path.includes('/goals/savings')) return 'savings'
  return 'budgets'
})

function switchTab(tab: 'budgets' | 'savings') {
  if (tab === 'savings') {
    router.replace('/goals/savings')
  } else {
    router.replace('/goals')
  }
}
</script>

<template>
  <div class="page">
    <h1>Goals</h1>

    <!-- Tab switcher -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'budgets' }" @click="switchTab('budgets')">
        Budgets
      </button>
      <button :class="{ active: activeTab === 'savings' }" @click="switchTab('savings')">
        Savings
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
