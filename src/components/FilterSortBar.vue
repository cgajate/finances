<script setup lang="ts">
import { ref } from 'vue'
import type { SortOption, FrequencyFilter } from '@/composables/useSortFilter'

const props = defineProps<{
  sortBy: SortOption
  activeFilters: FrequencyFilter[]
  hasFilter: (f: FrequencyFilter) => boolean
}>()

const emit = defineEmits<{
  (e: 'update:sortBy', value: SortOption): void
  (e: 'toggleFilter', value: FrequencyFilter): void
  (e: 'clearFilters'): void
}>()

const filterOpen = ref(false)

const filters: { value: FrequencyFilter; label: string; icon: string }[] = [
  { value: 'weekly', label: 'Weekly', icon: '📅' },
  { value: 'bi-weekly', label: 'Bi-Weekly', icon: '📆' },
  { value: 'monthly', label: 'Monthly', icon: '🗓️' },
  { value: 'quarterly', label: 'Quarterly', icon: '📊' },
  { value: 'yearly', label: 'Yearly', icon: '🎯' },
  { value: 'one-time', label: 'One-time', icon: '⚡' },
]

const sorts: { value: SortOption; label: string; icon: string }[] = [
  { value: 'newest', label: 'Newest', icon: '🕐' },
  { value: 'amount-desc', label: 'Amount ↓', icon: '💲' },
  { value: 'amount-asc', label: 'Amount ↑', icon: '💲' },
  { value: 'alpha-asc', label: 'A–Z', icon: '🔤' },
  { value: 'alpha-desc', label: 'Z–A', icon: '🔤' },
]

function setSort(s: SortOption) {
  emit('update:sortBy', s)
}
</script>

<template>
  <div class="filter-sort-bar">
    <!-- Sort bubbles -->
    <div class="bar-section">
      <span class="bar-label">Sort</span>
      <div class="bubbles">
        <button
          v-for="s in sorts"
          :key="s.value"
          class="bubble sort-bubble"
          :class="{ active: props.sortBy === s.value }"
          @click="setSort(s.value)"
        >
          <span class="bubble-icon">{{ s.icon }}</span>
          <span class="bubble-label">{{ s.label }}</span>
        </button>
      </div>
    </div>

    <!-- Filter section -->
    <div class="bar-section">
      <span class="bar-label">
        Filter
        <span v-if="props.activeFilters.length" class="filter-count">{{ props.activeFilters.length }}</span>
      </span>
      <div class="filter-row">
        <button
          class="bubble filter-toggle-btn"
          :class="{ active: filterOpen }"
          @click="filterOpen = !filterOpen"
        >
          <span class="bubble-icon">🔍</span>
          <span class="bubble-label">{{ filterOpen ? 'Close' : 'Choose' }}</span>
        </button>
        <!-- Active filter chips shown when panel is closed -->
        <template v-if="!filterOpen && props.activeFilters.length > 0">
          <button
            v-for="f in filters.filter(fl => props.hasFilter(fl.value))"
            :key="f.value"
            class="bubble active-chip"
            @click="emit('toggleFilter', f.value)"
          >
            <span class="bubble-icon">{{ f.icon }}</span>
            <span class="bubble-label">{{ f.label }}</span>
            <span class="chip-x">✕</span>
          </button>
        </template>
        <button
          v-if="!filterOpen && props.activeFilters.length > 0"
          class="bubble clear-btn"
          @click="emit('clearFilters')"
        >
          Clear All
        </button>
      </div>
    </div>

    <!-- Filter picker panel -->
    <Transition name="expand">
      <div v-if="filterOpen" class="filter-panel">
        <div class="filter-grid">
          <button
            v-for="f in filters"
            :key="f.value"
            class="bubble filter-bubble"
            :class="{ selected: props.hasFilter(f.value) }"
            @click="emit('toggleFilter', f.value)"
          >
            <span class="bubble-icon">{{ f.icon }}</span>
            <span class="bubble-label">{{ f.label }}</span>
            <span v-if="props.hasFilter(f.value)" class="check">✓</span>
          </button>
        </div>
        <div class="filter-actions">
          <button class="action-btn apply" @click="filterOpen = false">Apply</button>
          <button
            class="action-btn clear"
            @click="emit('clearFilters')"
          >
            Clear All
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.filter-sort-bar {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.bar-section {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.bar-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  min-width: 40px;
  padding-top: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.filter-count {
  background: var(--color-primary);
  color: white;
  font-size: 0.65rem;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.bubbles,
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.bubble {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.65rem;
  border-radius: 20px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  color: var(--color-text-secondary);
}

.bubble:hover {
  border-color: var(--color-text-muted);
  background: var(--color-bg-secondary);
}

.bubble-icon {
  font-size: 0.85rem;
  line-height: 1;
}

.bubble-label {
  font-weight: 500;
}

/* Sort active */
.sort-bubble.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Filter toggle */
.filter-toggle-btn.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Active chip */
.active-chip {
  background: var(--color-income-bg);
  border-color: var(--color-income);
  color: var(--color-income);
}

.chip-x {
  font-size: 0.7rem;
  margin-left: 0.1rem;
  opacity: 0.6;
}

.active-chip:hover {
  background: var(--color-expense-bg);
  border-color: var(--color-btn-delete);
  color: var(--color-expense);
}

.active-chip:hover .chip-x {
  opacity: 1;
}

.clear-btn {
  border-color: var(--color-btn-delete);
  color: var(--color-btn-delete);
  font-weight: 600;
  font-size: 0.75rem;
}

.clear-btn:hover {
  background: var(--color-expense-bg);
}

/* Filter panel */
.filter-panel {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0.75rem;
  margin-left: 40px;
}

.filter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.filter-bubble {
  position: relative;
}

.filter-bubble.selected {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.check {
  font-size: 0.7rem;
  font-weight: 700;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.action-btn.apply {
  background: var(--color-primary);
  color: white;
}

.action-btn.clear {
  background: none;
  color: var(--color-text-muted);
  border: 1px solid var(--color-input-border);
}

.action-btn.clear:hover {
  background: var(--color-bg-secondary);
}

/* Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

