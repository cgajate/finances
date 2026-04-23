<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCategoriesStore } from '@/stores/categories'
import FilterPanel from '@/components/FilterPanel.vue'
import SortPanel from '@/components/SortPanel.vue'
import type { SortField, SortDirection, SortOption, FrequencyFilter } from '@/composables/useSortFilter'

const props = defineProps<{
  sortBy: SortOption
  sortField: SortField
  sortDirection: SortDirection
  activeFilters: FrequencyFilter[]
  activeCategoryFilters: string[]
  hasFilter: (f: FrequencyFilter) => boolean
  hasCategoryFilter: (cat: string) => boolean
  type?: 'income' | 'expense'
}>()

const emit = defineEmits<{
  (e: 'update:sortBy', value: SortOption): void
  (e: 'update:sortField', value: SortField): void
  (e: 'update:sortDirection', value: SortDirection): void
  (e: 'toggleFilter', value: FrequencyFilter): void
  (e: 'toggleCategoryFilter', value: string): void
  (e: 'clearFilters'): void
}>()

const categoriesStore = useCategoriesStore()
const { activeExpenseCategories, activeIncomeCategories } = storeToRefs(categoriesStore)

const availableCategories = computed(() =>
  props.type === 'income' ? activeIncomeCategories.value : activeExpenseCategories.value,
)

// --- Panel visibility ---
const filterOpen = ref(false)
const sortOpen = ref(false)

// --- Draft state (changes only apply on submit) ---
const draftFrequencies = ref<FrequencyFilter[]>([])
const draftCategories = ref<string[]>([])
const draftSortField = ref<SortField>('newest')
const draftSortDirection = ref<SortDirection>('asc')

function openFilter() {
  draftFrequencies.value = [...props.activeFilters]
  draftCategories.value = [...props.activeCategoryFilters]
  filterOpen.value = true
  sortOpen.value = false
}

function openSort() {
  draftSortField.value = props.sortField
  draftSortDirection.value = props.sortDirection
  sortOpen.value = true
  filterOpen.value = false
}

// --- Filter draft toggles ---
function draftToggleFreq(f: FrequencyFilter) {
  const idx = draftFrequencies.value.indexOf(f)
  if (idx === -1) draftFrequencies.value.push(f)
  else draftFrequencies.value.splice(idx, 1)
}

function draftToggleCat(cat: string) {
  const idx = draftCategories.value.indexOf(cat)
  if (idx === -1) draftCategories.value.push(cat)
  else draftCategories.value.splice(idx, 1)
}

function submitFilter() {
  const currentFreqs = new Set(props.activeFilters)
  const draftFreqs = new Set(draftFrequencies.value)
  for (const f of currentFreqs) {
    if (!draftFreqs.has(f)) emit('toggleFilter', f)
  }
  for (const f of draftFreqs) {
    if (!currentFreqs.has(f)) emit('toggleFilter', f)
  }
  const currentCats = new Set(props.activeCategoryFilters)
  const draftCats = new Set(draftCategories.value)
  for (const c of currentCats) {
    if (!draftCats.has(c)) emit('toggleCategoryFilter', c)
  }
  for (const c of draftCats) {
    if (!currentCats.has(c)) emit('toggleCategoryFilter', c)
  }
  filterOpen.value = false
}

function submitSort() {
  emit('update:sortField', draftSortField.value)
  emit('update:sortDirection', draftSortDirection.value)
  sortOpen.value = false
}

const filterCount = computed(() => props.activeFilters.length + props.activeCategoryFilters.length)
</script>

<template>
  <div class="filter-sort-bar">
    <div class="trigger-row">
      <!-- Filter -->
      <div class="dropdown-wrapper">
        <button
          class="trigger-btn"
          :class="{ active: filterOpen, 'has-count': filterCount > 0 }"
          @click="filterOpen ? (filterOpen = false) : openFilter()"
        >
          <font-awesome-icon :icon="['fas', 'filter']" />
          <span>Filter</span>
          <span v-if="filterCount > 0" class="trigger-badge">{{ filterCount }}</span>
        </button>

        <div v-if="filterOpen" class="bubble-backdrop" @click="filterOpen = false"></div>

        <Transition name="bubble">
          <FilterPanel
            v-if="filterOpen"
            :frequencies="draftFrequencies"
            :categories="draftCategories"
            :available-categories="availableCategories"
            @toggle-frequency="draftToggleFreq"
            @toggle-category="draftToggleCat"
            @clear="draftFrequencies = []; draftCategories = []"
            @submit="submitFilter"
            @cancel="filterOpen = false"
          />
        </Transition>
      </div>

      <!-- Sort -->
      <div class="dropdown-wrapper">
        <button
          class="trigger-btn"
          :class="{ active: sortOpen }"
          @click="sortOpen ? (sortOpen = false) : openSort()"
        >
          <font-awesome-icon :icon="['fas', 'arrow-up-wide-short']" />
          <span>Sort</span>
        </button>

        <div v-if="sortOpen" class="bubble-backdrop" @click="sortOpen = false"></div>

        <Transition name="bubble">
          <SortPanel
            v-if="sortOpen"
            :sort-field="draftSortField"
            :sort-direction="draftSortDirection"
            @update:sort-field="draftSortField = $event"
            @update:sort-direction="draftSortDirection = $event"
            @clear="draftSortField = 'newest'; draftSortDirection = 'asc'"
            @submit="submitSort"
            @cancel="sortOpen = false"
          />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-sort-bar {
  margin-bottom: 1rem;
}

/* ─── Trigger buttons ─── */
.trigger-row {
  display: flex;
  gap: 0.4rem;
}

.dropdown-wrapper {
  position: relative;
}

.trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  border: none;
  background: var(--color-icon-bg);
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
  backdrop-filter: blur(4px);
  position: relative;
}

.trigger-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary-text);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--color-card-shadow);
}

.trigger-btn.active {
  background: var(--color-primary);
  color: #fff;
}

.trigger-badge {
  background: #fff;
  color: var(--color-primary);
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.trigger-btn:not(.active) .trigger-badge {
  background: var(--color-primary);
  color: #fff;
}

/* ─── Backdrop ─── */
.bubble-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 199;
}

@media (max-width: 600px) {
  .bubble-backdrop {
    background: rgba(0, 0, 0, 0.4);
  }
}


/* ─── Transitions ─── */
.bubble-enter-active,
.bubble-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 600px) {
  .bubble-enter-from,
  .bubble-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }
}
</style>

