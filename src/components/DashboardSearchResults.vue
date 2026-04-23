<script setup lang="ts">
import { formatCurrency } from '@/lib/formatCurrency'
import EmptyState from '@/components/EmptyState.vue'
import type { SearchResult } from '@/composables/useSearch'

defineProps<{
  /** Current search query string */
  query: string
  /** Filtered search results */
  results: SearchResult[]
  /** Total result count */
  count: number
}>()
</script>

<template>
  <div class="search-results">
    <h2>Search Results ({{ count }})</h2>
    <div v-if="results.length" class="search-list">
      <div v-for="r in results" :key="r.id" class="search-item">
        <div class="search-item__main">
          <span class="badge" :class="r.kind === 'income' ? 'badge-income' : 'badge-expense'">{{ r.kind }}</span>
          <strong>{{ r.description }}</strong>
          <span class="search-item__amount" :class="{ 'search-item__amount--expense': r.kind === 'expense' }">
            {{ formatCurrency(r.amount) }}
          </span>
        </div>
        <div class="search-item__meta">
          <span class="badge cat-badge">{{ r.category }}</span>
        </div>
      </div>
    </div>
    <EmptyState v-else :message="`No results for &quot;${query}&quot;.`" />
  </div>
</template>

<style scoped>
.search-results { margin-bottom: 2rem; }
.search-list { display: flex; flex-direction: column; gap: 0.5rem; }
.search-item {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: var(--color-surface);
}
.search-item__main { display: flex; align-items: center; gap: 0.5rem; }
.search-item__main strong { flex: 1; }
.search-item__meta { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.search-item__amount { font-weight: 600; color: var(--color-income); }
.search-item__amount--expense { color: var(--color-expense); }
</style>

