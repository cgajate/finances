<script setup lang="ts">
import type { FrequencyFilter } from '@/composables/useSortFilter'

const props = defineProps<{
  /** Currently selected draft frequency filters */
  frequencies: FrequencyFilter[]
  /** Currently selected draft category filters */
  categories: string[]
  /** Available category names to display */
  availableCategories: string[]
}>()

const emit = defineEmits<{
  (e: 'toggle-frequency', value: FrequencyFilter): void
  (e: 'toggle-category', value: string): void
  (e: 'clear'): void
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

const frequencyOptions: { value: FrequencyFilter; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one-time', label: 'One-time' },
]
</script>

<template>
  <div class="bubble filter-bubble" role="dialog" aria-label="Filter options" @keydown.escape="emit('cancel')">
    <div class="bubble-header">
      <h3>
        <font-awesome-icon :icon="['fas', 'filter']" />
        Filters
      </h3>
      <button class="bubble-close" @click="emit('cancel')" aria-label="Close">
        <font-awesome-icon :icon="['fas', 'xmark']" />
      </button>
    </div>

    <div class="bubble-body">
      <div class="panel-section">
        <h4 class="section-title">Frequency</h4>
        <div class="option-grid">
          <button
            v-for="f in frequencyOptions"
            :key="f.value"
            class="option-pill"
            :class="{ selected: frequencies.includes(f.value) }"
            @click="emit('toggle-frequency', f.value)"
          >
            {{ f.label }}
            <font-awesome-icon
              v-if="frequencies.includes(f.value)"
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
            v-for="cat in availableCategories"
            :key="cat"
            class="option-pill"
            :class="{ selected: categories.includes(cat) }"
            @click="emit('toggle-category', cat)"
          >
            {{ cat }}
            <font-awesome-icon
              v-if="categories.includes(cat)"
              :icon="['fas', 'check']"
              class="pill-check"
            />
          </button>
        </div>
      </div>
    </div>

    <div class="bubble-footer">
      <button class="footer-btn clear" @click="emit('clear')">
        <font-awesome-icon :icon="['fas', 'rotate-left']" />
        Clear
      </button>
      <div class="footer-right">
        <button class="footer-btn cancel" @click="emit('cancel')">Cancel</button>
        <button class="footer-btn submit" @click="emit('submit')">
          <font-awesome-icon :icon="['fas', 'check']" />
          Apply
        </button>
      </div>
    </div>
  </div>
</template>

