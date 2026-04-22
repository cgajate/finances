<script setup lang="ts">
import { ref } from 'vue'
import type { MonthlyBreakdown } from '@/types/finance'
import { formatCurrency } from '@/lib/formatCurrency'

defineProps<{
  breakdown: MonthlyBreakdown[]
  monthsBefore: number
  monthsAfter: number
}>()

const emit = defineEmits<{
  'update:monthsBefore': [value: number]
  'update:monthsAfter': [value: number]
}>()

const expandedMonth = ref<string | null>(null)

function toggleMonth(month: string) {
  expandedMonth.value = expandedMonth.value === month ? null : month
}

function isCurrentMonth(month: string): boolean {
  const now = new Date()
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return month === current
}

function isPast(month: string): boolean {
  const now = new Date()
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return month < current
}
</script>

<template>
  <div>
    <div class="range-controls">
      <div class="range-field">
        <label>Past months: {{ monthsBefore }}</label>
        <input :value="monthsBefore" type="range" min="0" max="24" @input="emit('update:monthsBefore', Number(($event.target as HTMLInputElement).value))" />
      </div>
      <div class="range-field">
        <label>Future months: {{ monthsAfter }}</label>
        <input :value="monthsAfter" type="range" min="1" max="24" @input="emit('update:monthsAfter', Number(($event.target as HTMLInputElement).value))" />
      </div>
    </div>

    <div class="timeline">
      <div
        v-for="m in breakdown"
        :key="m.month"
        class="month-card"
        :class="{
          current: isCurrentMonth(m.month),
          past: isPast(m.month),
          expanded: expandedMonth === m.month,
        }"
      >
        <div class="month-header" role="button" tabindex="0" @click="toggleMonth(m.month)" @keydown.enter.prevent="toggleMonth(m.month)" @keydown.space.prevent="toggleMonth(m.month)">
          <div class="month-title">
            <span class="month-name">{{ m.label }}</span>
            <span v-if="isCurrentMonth(m.month)" class="current-badge">Current</span>
          </div>
          <div class="month-summary">
            <span class="summary-income">+{{ formatCurrency(m.totalIncome) }}</span>
            <span class="summary-expense">-{{ formatCurrency(m.totalExpenses) }}</span>
            <span class="summary-net" :class="{ negative: m.net < 0 }">
              {{ m.net >= 0 ? '+' : '' }}{{ formatCurrency(m.net) }}
            </span>
          </div>
          <div class="month-cumulative">
            <span class="cumulative-label">Cumulative</span>
            <span class="cumulative-value" :class="{ negative: m.cumulativeSavings < 0 }">
              {{ formatCurrency(m.cumulativeSavings) }}
            </span>
          </div>
          <span class="expand-icon">{{ expandedMonth === m.month ? '▲' : '▼' }}</span>
        </div>

        <!-- Expanded details -->
        <Transition name="slide-down">
          <div v-if="expandedMonth === m.month" class="month-details">
            <div class="detail-section">
              <h4>💰 Income ({{ m.incomeItems.length }})</h4>
              <div v-if="m.incomeItems.length" class="detail-list">
                <div v-for="item in m.incomeItems" :key="item.id" class="detail-item">
                  <span class="detail-desc">{{ item.description }}</span>
                  <span class="detail-amount income-text">{{ formatCurrency(item.amount) }}</span>
                  <span class="detail-badge">{{ item.source === 'recurring' ? item.frequency : 'one-time' }}</span>
                </div>
              </div>
              <p v-else class="detail-empty">No income this month</p>
            </div>

            <div class="detail-section">
              <h4>💸 Expenses ({{ m.expenseItems.length }})</h4>
              <div v-if="m.expenseItems.length" class="detail-list">
                <div v-for="item in m.expenseItems" :key="item.id" class="detail-item">
                  <span class="detail-desc">{{ item.description }}</span>
                  <span class="detail-amount expense-text">{{ formatCurrency(item.amount) }}</span>
                  <span class="detail-badge">{{ item.source === 'recurring' ? item.frequency : 'one-time' }}</span>
                </div>
              </div>
              <p v-else class="detail-empty">No expenses this month</p>
            </div>

            <div class="detail-footer">
              <span>Potential Savings: </span>
              <strong :class="{ 'negative': m.net < 0 }">{{ formatCurrency(m.net) }}</strong>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Range controls */
.range-controls { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.range-field { flex: 1; min-width: 200px; }
.range-field label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 0.3rem; }
.range-field input[type="range"] { width: 100%; }

/* Timeline */
.timeline { display: flex; flex-direction: column; gap: 0.5rem; }

.month-card {
  border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden;
  transition: border-color 0.2s; background: var(--color-surface);
}
.month-card.current { border-color: var(--color-primary); border-width: 2px; }
.month-card.past { opacity: 0.75; }
.month-card.expanded { border-color: var(--color-primary); }

.month-header {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
  cursor: pointer; flex-wrap: wrap;
}
.month-header:hover { background: var(--color-bg-secondary); }

.month-title { display: flex; align-items: center; gap: 0.5rem; min-width: 160px; }
.month-name { font-weight: 600; font-size: 0.95rem; }
.current-badge {
  font-size: 0.65rem; background: var(--color-primary); color: white; padding: 0.1rem 0.4rem;
  border-radius: 4px; font-weight: 600;
}

.month-summary { display: flex; gap: 0.75rem; flex: 1; min-width: 200px; }
.summary-income { color: var(--color-income); font-weight: 600; font-size: 0.85rem; }
.summary-expense { color: var(--color-expense); font-weight: 600; font-size: 0.85rem; }
.summary-net { font-weight: 700; font-size: 0.85rem; color: var(--color-primary-text); }
.summary-net.negative { color: var(--color-warning); }

.month-cumulative { display: flex; flex-direction: column; align-items: flex-end; min-width: 90px; }
.cumulative-label { font-size: 0.65rem; color: var(--color-text-muted); text-transform: uppercase; }
.cumulative-value { font-size: 0.85rem; font-weight: 700; color: var(--color-primary-text); }
.cumulative-value.negative { color: var(--color-warning); }

.expand-icon { font-size: 0.7rem; color: var(--color-text-muted); margin-left: auto; }

/* Details */
.month-details { padding: 0 1rem 1rem; border-top: 1px solid var(--color-border-light); }

.detail-section { margin-top: 0.75rem; }
.detail-section h4 { font-size: 0.9rem; margin-bottom: 0.4rem; }

.detail-list { display: flex; flex-direction: column; gap: 0.3rem; }
.detail-item {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.5rem;
  background: var(--color-bg-secondary); border-radius: 6px; font-size: 0.85rem;
}
.detail-desc { flex: 1; }
.detail-amount { font-weight: 600; }
.income-text { color: var(--color-income); }
.expense-text { color: var(--color-expense); }
.detail-badge {
  font-size: 0.7rem; background: var(--color-badge-bg); padding: 0.1rem 0.4rem;
  border-radius: 4px; text-transform: capitalize; color: var(--color-text-muted);
}
.detail-empty { color: var(--color-text-muted); font-style: italic; font-size: 0.85rem; }

.detail-footer {
  margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--color-border-light);
  font-size: 0.9rem; color: var(--color-text-secondary);
}
.detail-footer .negative { color: var(--color-expense); }

/* Transition */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0; transform: translateY(-10px);
}
</style>

