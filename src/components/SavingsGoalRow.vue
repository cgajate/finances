<script setup lang="ts">
import { formatCurrency } from '@/lib/formatCurrency'
import ProgressBar from '@/components/ProgressBar.vue'
import type { SavingsGoal } from '@/types/finance'

const props = defineProps<{
  /** Savings goal data */
  goal: SavingsGoal
  /**
   * Display mode:
   * - `'compact'` — name + amounts + bar only (dashboard)
   * - `'full'` — includes deadline, meter label, and actions slot
   */
  mode?: 'compact' | 'full'
}>()

defineSlots<{
  /** Extra content rendered after the progress bar (e.g. actions) */
  default?: () => unknown
}>()

function percentComplete(): number {
  if (props.goal.targetAmount <= 0) return 0
  return Math.min(Math.round((props.goal.savedAmount / props.goal.targetAmount) * 100), 100)
}

function meterVariant(): 'ok' | 'warning' | 'over' | 'primary' {
  const pct = percentComplete()
  if (pct >= 100) return 'ok'
  if (pct >= 60) return 'primary'
  if (pct >= 30) return 'warning'
  return 'over'
}

function daysUntilDeadline(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(props.goal.deadline + 'T00:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
const isCompleted = props.goal.savedAmount >= props.goal.targetAmount
</script>

<template>
  <div
    class="savings-goal-row"
    :class="[
      `savings-goal-row--${mode ?? 'compact'}`,
      { 'savings-goal-row--completed': isCompleted },
    ]"
  >
    <div class="savings-goal-row__header">
      <span class="savings-goal-row__name">{{ goal.name }}</span>
      <!-- Full mode: deadline -->
      <span
        v-if="mode === 'full'"
        class="savings-goal-row__deadline"
        :class="{ 'savings-goal-row__deadline--overdue': daysUntilDeadline() < 0 }"
      >
        <template v-if="daysUntilDeadline() < 0">
          {{ Math.abs(daysUntilDeadline()) }} days overdue
        </template>
        <template v-else-if="daysUntilDeadline() === 0">Due today</template>
        <template v-else>{{ daysUntilDeadline() }} days left</template>
      </span>
      <!-- Compact mode: amounts inline -->
      <span v-else class="savings-goal-row__amt">
        {{ formatCurrency(goal.savedAmount) }} / {{ formatCurrency(goal.targetAmount) }}
      </span>
    </div>

    <!-- Full mode: amounts on own line -->
    <div v-if="mode === 'full'" class="savings-goal-row__amounts">
      <span class="savings-goal-row__saved">{{ formatCurrency(goal.savedAmount) }}</span>
      <span class="savings-goal-row__of">of</span>
      <span class="savings-goal-row__target">{{ formatCurrency(goal.targetAmount) }}</span>
    </div>

    <ProgressBar
      :percent="percentComplete()"
      :variant="meterVariant()"
      :height="mode === 'full' ? 12 : 8"
    />

    <div v-if="mode === 'full'" class="savings-goal-row__meter-label">
      {{ percentComplete() }}% complete
    </div>

    <slot />
  </div>
</template>

<style scoped>
.savings-goal-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.savings-goal-row--full {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  gap: 0.5rem;
}

.savings-goal-row--completed.savings-goal-row--full {
  background: var(--color-income-bg);
  border-color: var(--color-income);
}

.savings-goal-row__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.savings-goal-row__name {
  font-weight: 500;
  font-size: 0.9rem;
}

.savings-goal-row--full .savings-goal-row__name {
  font-weight: 700;
  font-size: 1.05rem;
}

.savings-goal-row__amt {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary);
}

.savings-goal-row__deadline {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.savings-goal-row__deadline--overdue {
  color: var(--color-expense);
  font-weight: 600;
}

.savings-goal-row__amounts {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.savings-goal-row__saved {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
}

.savings-goal-row__of {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.savings-goal-row__target {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.savings-goal-row__meter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}
</style>

