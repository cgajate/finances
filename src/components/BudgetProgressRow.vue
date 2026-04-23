<script setup lang="ts">
import { formatCurrency } from '@/lib/formatCurrency'
import ProgressBar from '@/components/ProgressBar.vue'
import type { BudgetStatus } from '@/stores/budgets'

const props = defineProps<{
  /** Budget status data for one category */
  status: BudgetStatus
  /**
   * Display mode:
   * - `'compact'` — name + amount + bar only (dashboard)
   * - `'full'` — includes percent, status label, and actions slot
   */
  mode?: 'compact' | 'full'
}>()

defineSlots<{
  /** Extra content rendered after the progress bar (e.g. footer/actions) */
  default?: () => unknown
}>()

const barHeight = props.mode === 'full' ? 10 : 8
</script>

<template>
  <div class="budget-progress-row" :class="`budget-progress-row--${mode ?? 'compact'}`">
    <div class="budget-progress-row__info">
      <span class="budget-progress-row__category">{{ status.category }}</span>
      <span
        class="budget-progress-row__amount"
        :class="`status-${status.status}`"
      >
        {{ formatCurrency(status.spent) }} / {{ formatCurrency(status.limit) }}
      </span>
    </div>
    <ProgressBar
      :percent="status.percent"
      :variant="status.status as 'ok' | 'warning' | 'over'"
      :height="barHeight"
    />
    <slot />
  </div>
</template>

<style scoped>
.budget-progress-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.budget-progress-row--full {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  gap: 0.5rem;
}

.budget-progress-row__info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-progress-row__category {
  font-weight: 500;
  font-size: 0.9rem;
}

.budget-progress-row--full .budget-progress-row__category {
  font-weight: 700;
  font-size: 1rem;
}

.budget-progress-row__amount {
  font-size: 0.85rem;
  font-weight: 600;
}
</style>

