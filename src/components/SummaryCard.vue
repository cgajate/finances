<script setup lang="ts">
import { formatCurrency } from '@/lib/formatCurrency'

defineProps<{
  /** Display label above the value */
  label: string
  /** Numeric value to format as currency */
  value: number
  /** Visual variant controlling background/text color */
  variant: 'income' | 'expense' | 'net'
  /** Whether to show net card in negative/warning style */
  negative?: boolean
}>()
</script>

<template>
  <div
    class="card summary-card"
    :class="[
      `summary-card--${variant}`,
      { 'summary-card--negative': negative },
    ]"
  >
    <span class="card-label">{{ label }}</span>
    <span class="card-value">{{ formatCurrency(value) }}</span>
  </div>
</template>

<style scoped>
.summary-card--income { background: var(--color-income-bg); color: var(--color-income); }
.summary-card--expense { background: var(--color-expense-bg); color: var(--color-expense); }
.summary-card--net { background: var(--color-primary-light); color: var(--color-primary-text); }
.summary-card--negative { background: var(--color-warning-bg); color: var(--color-warning); }
</style>

