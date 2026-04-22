<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCategoriesStore } from '@/stores/categories'
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

const categories = computed(() =>
  props.type === 'income' ? activeIncomeCategories.value : activeExpenseCategories.value,
)

// --- Panel state ---
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

function closeFilter() {
  filterOpen.value = false
}

function closeSort() {
  sortOpen.value = false
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
  // Sync frequency filters
  const currentFreqs = new Set(props.activeFilters)
  const draftFreqs = new Set(draftFrequencies.value)
  for (const f of currentFreqs) {
    if (!draftFreqs.has(f)) emit('toggleFilter', f)
  }
  for (const f of draftFreqs) {
    if (!currentFreqs.has(f)) emit('toggleFilter', f)
  }
  // Sync category filters
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

function clearFilter() {
  draftFrequencies.value = []
  draftCategories.value = []
}

// --- Sort draft ---
function submitSort() {
  emit('update:sortField', draftSortField.value)
  emit('update:sortDirection', draftSortDirection.value)
  sortOpen.value = false
}

function clearSort() {
  draftSortField.value = 'newest'
  draftSortDirection.value = 'asc'
}

// --- Counts for badges ---
const filterCount = computed(() => props.activeFilters.length + props.activeCategoryFilters.length)

const frequencies: { value: FrequencyFilter; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one-time', label: 'One-time' },
]
</script>

<template>
  <div class="filter-sort-bar">
    <!-- Trigger buttons -->
    <div class="trigger-row">
      <!-- Filter wrapper -->
      <div class="dropdown-wrapper">
        <button
          class="trigger-btn"
          :class="{ active: filterOpen, 'has-count': filterCount > 0 }"
          @click="filterOpen ? closeFilter() : openFilter()"
        >
          <font-awesome-icon :icon="['fas', 'filter']" />
          <span>Filter</span>
          <span v-if="filterCount > 0" class="trigger-badge">{{ filterCount }}</span>
        </button>

        <!-- Filter backdrop -->
        <div v-if="filterOpen" class="bubble-backdrop" @click="closeFilter"></div>

        <Transition name="bubble">
          <div v-if="filterOpen" class="bubble filter-bubble">
            <div class="bubble-header">
              <h3>
                <font-awesome-icon :icon="['fas', 'filter']" />
                Filters
              </h3>
              <button class="bubble-close" @click="closeFilter" aria-label="Close">
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
            </div>

            <div class="bubble-body">
              <div class="panel-section">
                <h4 class="section-title">Frequency</h4>
                <div class="option-grid">
                  <button
                    v-for="f in frequencies"
                    :key="f.value"
                    class="option-pill"
                    :class="{ selected: draftFrequencies.includes(f.value) }"
                    @click="draftToggleFreq(f.value)"
                  >
                    {{ f.label }}
                    <font-awesome-icon
                      v-if="draftFrequencies.includes(f.value)"
                      :icon="['fas', 'check']"
                      class="pill-check"
                    />
                  </button>
                </div>
              </div>

              <hr class="panel-divider" />

              <div class="panel-section">
                <h4 class="section-title">Category</h4>
                <div class="option-grid">
                  <button
                    v-for="cat in categories"
                    :key="cat"
                    class="option-pill"
                    :class="{ selected: draftCategories.includes(cat) }"
                    @click="draftToggleCat(cat)"
                  >
                    {{ cat }}
                    <font-awesome-icon
                      v-if="draftCategories.includes(cat)"
                      :icon="['fas', 'check']"
                      class="pill-check"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div class="bubble-footer">
              <button class="footer-btn clear" @click="clearFilter">
                <font-awesome-icon :icon="['fas', 'rotate-left']" />
                Clear
              </button>
              <div class="footer-right">
                <button class="footer-btn cancel" @click="closeFilter">Cancel</button>
                <button class="footer-btn submit" @click="submitFilter">
                  <font-awesome-icon :icon="['fas', 'check']" />
                  Apply
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Sort wrapper -->
      <div class="dropdown-wrapper">
        <button
          class="trigger-btn"
          :class="{ active: sortOpen }"
          @click="sortOpen ? closeSort() : openSort()"
        >
          <font-awesome-icon :icon="['fas', 'arrow-up-wide-short']" />
          <span>Sort</span>
        </button>

        <div v-if="sortOpen" class="bubble-backdrop" @click="closeSort"></div>

        <Transition name="bubble">
          <div v-if="sortOpen" class="bubble sort-bubble">
            <div class="bubble-header">
              <h3>
                <font-awesome-icon :icon="['fas', 'arrow-up-wide-short']" />
                Sort
              </h3>
              <button class="bubble-close" @click="closeSort" aria-label="Close">
                <font-awesome-icon :icon="['fas', 'xmark']" />
              </button>
            </div>

            <div class="bubble-body">
              <div class="panel-section">
                <h4 class="section-title">Sort By</h4>
                <div class="option-grid">
                  <button
                    class="option-pill"
                    :class="{ selected: draftSortField === 'newest' }"
                    @click="draftSortField = 'newest'"
                  >
                    <font-awesome-icon :icon="['fas', 'clock']" />
                    Newest
                  </button>
                  <button
                    class="option-pill"
                    :class="{ selected: draftSortField === 'amount' }"
                    @click="draftSortField = 'amount'"
                  >
                    <font-awesome-icon :icon="['fas', 'dollar-sign']" />
                    Amount
                  </button>
                  <button
                    class="option-pill"
                    :class="{ selected: draftSortField === 'alpha' }"
                    @click="draftSortField = 'alpha'"
                  >
                    <font-awesome-icon :icon="['fas', 'arrow-down-a-z']" />
                    Alphabetical
                  </button>
                </div>
              </div>

              <div class="panel-section">
                <h4 class="section-title">Direction</h4>
                <div class="direction-row">
                  <button
                    class="direction-btn"
                    :class="{ selected: draftSortDirection === 'asc' }"
                    @click="draftSortDirection = 'asc'"
                  >
                    <font-awesome-icon :icon="['fas', 'arrow-up']" />
                    Ascending
                  </button>
                  <button
                    class="direction-btn"
                    :class="{ selected: draftSortDirection === 'desc' }"
                    @click="draftSortDirection = 'desc'"
                  >
                    <font-awesome-icon :icon="['fas', 'arrow-down']" />
                    Descending
                  </button>
                </div>
              </div>
            </div>

            <div class="bubble-footer">
              <button class="footer-btn clear" @click="clearSort">
                <font-awesome-icon :icon="['fas', 'rotate-left']" />
                Clear
              </button>
              <div class="footer-right">
                <button class="footer-btn cancel" @click="closeSort">Cancel</button>
                <button class="footer-btn submit" @click="submitSort">
                  <font-awesome-icon :icon="['fas', 'check']" />
                  Apply
                </button>
              </div>
            </div>
          </div>
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

/* ─── Bubble (dropdown) ─── */
.bubble {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 340px;
  max-height: 420px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px var(--color-card-shadow);
  z-index: 200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Mobile: fullscreen override */
@media (max-width: 600px) {
  .bubble {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-height: 100%;
    border-radius: 0;
    border: none;
  }

  .bubble-backdrop {
    background: rgba(0, 0, 0, 0.4);
  }
}

.bubble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.bubble-header h3 {
  font-size: 1rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
}

.bubble-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}

.bubble-close:hover {
  background: var(--color-badge-bg);
  color: var(--color-text);
}

.bubble-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
}

.bubble-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

/* ─── Sections ─── */
.panel-section {
  margin-bottom: 0.6rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.4rem;
}

.panel-divider {
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: 0.6rem 0;
}

/* ─── Option pills ─── */
.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.option-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.option-pill:hover {
  border-color: var(--color-primary);
  color: var(--color-primary-text);
  background: var(--color-primary-light);
}

.option-pill.selected {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.pill-check {
  font-size: 0.6rem;
}

/* ─── Direction buttons ─── */
.direction-row {
  display: flex;
  gap: 0.3rem;
}

.direction-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.4rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.direction-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary-text);
  background: var(--color-primary-light);
}

.direction-btn.selected {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

/* ─── Footer ─── */
.footer-right {
  display: flex;
  gap: 0.35rem;
}

.footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s, opacity 0.15s;
}

.footer-btn.submit {
  background: var(--color-primary);
  color: #fff;
}

.footer-btn.submit:hover {
  opacity: 0.9;
}

.footer-btn.cancel {
  background: var(--color-badge-bg);
  color: var(--color-text-secondary);
}

.footer-btn.cancel:hover {
  background: var(--color-border);
}

.footer-btn.clear {
  background: none;
  color: var(--color-text-muted);
}

.footer-btn.clear:hover {
  color: var(--color-text-secondary);
  background: var(--color-badge-bg);
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

