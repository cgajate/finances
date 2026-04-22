<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBar from '@/components/TabBar.vue'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => {
  if (route.path.includes('/goals/savings')) return 'savings'
  return 'budgets'
})

const tabs = [
  { value: 'budgets', label: 'Budgets' },
  { value: 'savings', label: 'Savings' },
]

function switchTab(tab: string) {
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

    <TabBar :tabs="tabs" :model-value="activeTab" @update:model-value="switchTab" />

    <router-view />
  </div>
</template>

<style scoped>
h1 { margin-bottom: 1.5rem; }
</style>
