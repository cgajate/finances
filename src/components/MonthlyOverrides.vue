<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatCurrency } from '@/lib/formatCurrency'
import CurrencyInput from '@/components/CurrencyInput.vue'
import type { MonthlyOverrides } from '@/types/finance'

const props = defineProps<{
  /** The base recurring amount */
  baseAmount: number
  /** Existing overrides keyed by YYYY-MM */
  overrides?: MonthlyOverrides
}>()

const emit = defineEmits<{
  (e: 'set-override', month: string, amount: number): void
  (e: 'remove-override', month: string): void
}>()

const expanded = ref(false)
const newDate = ref('')
const newAmount = ref<number | null>(null)

/** Extract YYYY-MM from a date string */
function toMonth(dateStr: string): string {
  return dateStr.substring(0, 7)
}

/** Sorted list of existing overrides */
const overrideEntries = computed(() => {
  if (!props.overrides) return []
  return Object.entries(props.overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }))
})

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-')
  const date = new Date(parseInt(y ?? '2026', 10), parseInt(m ?? '1', 10) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function addOverride() {
  if (!newDate.value || newAmount.value === null) return
  emit('set-override', toMonth(newDate.value), newAmount.value)
  newDate.value = ''
  newAmount.value = null
}

function removeOverride(month: string) {
  emit('remove-override', month)
}
</script>

<template>
  <div class="overrides">
    <button type="button" class="overrides__toggle" @click="expanded = !expanded">
      <font-awesome-icon :icon="['fas', expanded ? 'chevron-up' : 'chevron-down']" aria-hidden="true" />
      Monthly Adjustments
      <span v-if="overrideEntries.length > 0" class="overrides__count">{{ overrideEntries.length }}</span>
    </button>

    <div v-if="expanded" class="overrides__body">
      <p class="overrides__hint">
        Adjust the amount for specific months without changing the base amount of {{ formatCurrency(baseAmount) }}.
      </p>

      <!-- Existing overrides -->
      <ul v-if="overrideEntries.length > 0" class="overrides__list">
        <li v-for="entry in overrideEntries" :key="entry.month" class="overrides__entry">
          <span class="overrides__month">{{ formatMonthLabel(entry.month) }}</span>
          <span class="overrides__amount">{{ formatCurrency(entry.amount) }}</span>
          <button
            type="button"
            class="btn-remove"
            aria-label="Remove adjustment"
            @click="removeOverride(entry.month)"
          >
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>
        </li>
      </ul>

      <!-- Add new override -->
      <div class="overrides__add form-row">
        <div class="field overrides__field">
          <label for="override-month">Month</label>
          <input
            id="override-month"
            v-model="newDate"
            type="date"
          />
        </div>
        <div class="field overrides__field">
          <label for="override-amount">Adjusted Amount</label>
          <CurrencyInput
            id="override-amount"
            v-model="newAmount"
          />
        </div>
        <button
          type="button"
          class="btn-fund"
          :disabled="!newDate || newAmount === null"
          @click="addOverride"
        >
          <font-awesome-icon :icon="['fas', 'plus']" aria-hidden="true" />
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overrides {
  margin-top: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
}

.overrides__toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.65rem 0.75rem;
  background: var(--color-bg-secondary);
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: background 0.15s;
}

.overrides__toggle:hover {
  background: var(--color-primary-light);
}

.overrides__count {
  background: var(--color-warning-bg);
  color: var(--color-warning);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
  min-width: 1.2rem;
  text-align: center;
}

.overrides__body {
  padding: 0.75rem;
}

.overrides__hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.overrides__list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.overrides__entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
}

.overrides__month {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text);
}

.overrides__amount {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-warning);
}

.overrides__field {
  flex: 1;
  min-width: 0;
}

@media (max-width: 480px) {
  .overrides__add {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

