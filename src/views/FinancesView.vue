<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBar from '@/components/TabBar.vue'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => {
  // Determine tab from route path or query
  if (route.path.includes('/expenses')) return 'expenses'
  if (route.path.includes('/income')) return 'income'
  return (route.query.tab as string) || 'income'
})

const tabs = [
  { value: 'income', label: 'Income' },
  { value: 'expenses', label: 'Expenses' },
]

function switchTab(tab: string) {
  router.replace({ path: '/finances', query: { tab } })
}
</script>

<template>
  <div class="page">
    <h1>Finances</h1>

    <TabBar :tabs="tabs" :model-value="activeTab" @update:model-value="switchTab" />

    <router-view />
  </div>
</template>

<style scoped>
h1 { margin-bottom: 1.5rem; }
</style>
