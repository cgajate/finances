<script setup lang="ts">
import type { SortField, SortDirection } from '@/composables/useSortFilter'

defineProps<{
  /** Currently selected draft sort field */
  sortField: SortField
  /** Currently selected draft sort direction */
  sortDirection: SortDirection
}>()

const emit = defineEmits<{
  (e: 'update:sortField', value: SortField): void
  (e: 'update:sortDirection', value: SortDirection): void
  (e: 'clear'): void
  (e: 'submit'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div class="bubble sort-bubble" role="dialog" aria-label="Sort options" @keydown.escape="emit('cancel')">
    <div class="bubble-header">
      <h3>
        <font-awesome-icon :icon="['fas', 'arrow-up-wide-short']" />
        Sort
      </h3>
      <button class="bubble-close" @click="emit('cancel')" aria-label="Close">
        <font-awesome-icon :icon="['fas', 'xmark']" />
      </button>
    </div>

    <div class="bubble-body">
      <div class="panel-section">
        <h4 class="section-title">Sort By</h4>
        <div class="option-grid">
          <button
            class="option-pill"
            :class="{ selected: sortField === 'newest' }"
            @click="emit('update:sortField', 'newest')"
          >
            <font-awesome-icon :icon="['fas', 'clock']" />
            Newest
          </button>
          <button
            class="option-pill"
            :class="{ selected: sortField === 'amount' }"
            @click="emit('update:sortField', 'amount')"
          >
            <font-awesome-icon :icon="['fas', 'dollar-sign']" />
            Amount
          </button>
          <button
            class="option-pill"
            :class="{ selected: sortField === 'alpha' }"
            @click="emit('update:sortField', 'alpha')"
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
            :class="{ selected: sortDirection === 'asc' }"
            @click="emit('update:sortDirection', 'asc')"
          >
            <font-awesome-icon :icon="['fas', 'arrow-up']" />
            Ascending
          </button>
          <button
            class="direction-btn"
            :class="{ selected: sortDirection === 'desc' }"
            @click="emit('update:sortDirection', 'desc')"
          >
            <font-awesome-icon :icon="['fas', 'arrow-down']" />
            Descending
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

