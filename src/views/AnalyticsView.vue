<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useForecasting } from '@/composables/useForecasting'

const store = useFinancesStore()

const monthsBefore = ref(6)
const monthsAfter = ref(12)

const { breakdown, currentMonthIndex, yearProjection } = useForecasting(
  store.incomes,
  store.expenses,
  monthsBefore,
  monthsAfter,
)

const expandedMonth = ref<string | null>(null)
const activeTab = ref<'timeline' | 'projection'>('timeline')

function toggleMonth(month: string) {
  expandedMonth.value = expandedMonth.value === month ? null : month
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
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

const monthlySavingsAvg = computed(() => {
  const proj = yearProjection.value
  if (proj.months.length === 0) return 0
  return Math.round((proj.netSavings / proj.months.length) * 100) / 100
})
</script>

<template>
  <div class="page">
    <h1>📊 Analytics & Forecasting</h1>

    <!-- Tab switcher -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'timeline' }" @click="activeTab = 'timeline'">
        Month-by-Month
      </button>
      <button :class="{ active: activeTab === 'projection' }" @click="activeTab = 'projection'">
        12-Month Projection
      </button>
    </div>

    <!-- 12-Month Projection Tab -->
    <div v-if="activeTab === 'projection'" class="projection">
      <div class="projection-cards">
        <div class="proj-card income">
          <span class="proj-label">Projected Income (12 mo)</span>
          <span class="proj-value">{{ formatCurrency(yearProjection.totalIncome) }}</span>
        </div>
        <div class="proj-card expense">
          <span class="proj-label">Projected Expenses (12 mo)</span>
          <span class="proj-value">{{ formatCurrency(yearProjection.totalExpenses) }}</span>
        </div>
        <div class="proj-card savings" :class="{ negative: yearProjection.netSavings < 0 }">
          <span class="proj-label">Projected Savings (12 mo)</span>
          <span class="proj-value">{{ formatCurrency(yearProjection.netSavings) }}</span>
        </div>
        <div class="proj-card avg" :class="{ negative: monthlySavingsAvg < 0 }">
          <span class="proj-label">Avg Monthly Savings</span>
          <span class="proj-value">{{ formatCurrency(monthlySavingsAvg) }}</span>
        </div>
      </div>

      <h2>Monthly Breakdown (Next 12 Months)</h2>
      <div class="mini-timeline">
        <div
          v-for="m in yearProjection.months"
          :key="m.month"
          class="mini-bar"
          :class="{ current: isCurrentMonth(m.month) }"
        >
          <div class="mini-label">{{ m.label.split(' ')[0]?.substring(0, 3) }}</div>
          <div class="bar-stack">
            <div
              class="bar income-bar"
              :style="{ height: Math.min(m.totalIncome / Math.max(yearProjection.totalIncome / 12, 1) * 40, 80) + 'px' }"
            ></div>
            <div
              class="bar expense-bar"
              :style="{ height: Math.min(m.totalExpenses / Math.max(yearProjection.totalExpenses / 12, 1) * 40, 80) + 'px' }"
            ></div>
          </div>
          <div class="mini-net" :class="{ negative: m.net < 0 }">
            {{ m.net >= 0 ? '+' : '' }}{{ formatCurrency(m.net) }}
          </div>
        </div>
      </div>

      <div class="legend">
        <span class="legend-item"><span class="dot income-dot"></span> Income</span>
        <span class="legend-item"><span class="dot expense-dot"></span> Expenses</span>
      </div>
    </div>

    <!-- Month-by-Month Timeline Tab -->
    <div v-if="activeTab === 'timeline'">
      <div class="range-controls">
        <div class="range-field">
          <label>Past months: {{ monthsBefore }}</label>
          <input v-model.number="monthsBefore" type="range" min="0" max="24" />
        </div>
        <div class="range-field">
          <label>Future months: {{ monthsAfter }}</label>
          <input v-model.number="monthsAfter" type="range" min="1" max="24" />
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
          <div class="month-header" @click="toggleMonth(m.month)">
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
  </div>
</template>

<style scoped>
.page { max-width: 800px; margin: 0 auto; }
h1 { margin-bottom: 1.5rem; }
h2 { margin: 1.5rem 0 1rem; font-size: 1.1rem; }

/* Tabs */
.tabs { display: flex; gap: 0; margin-bottom: 1.5rem; }
.tabs button {
  flex: 1; padding: 0.6rem; border: 2px solid #1976d2; background: white; color: #1976d2;
  font-weight: 600; cursor: pointer; font-size: 0.95rem;
}
.tabs button:first-child { border-radius: 8px 0 0 8px; }
.tabs button:last-child { border-radius: 0 8px 8px 0; }
.tabs button.active { background: #1976d2; color: white; }

/* Projection cards */
.projection-cards {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem; margin-bottom: 1.5rem;
}
.proj-card {
  padding: 1rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.3rem;
}
.proj-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.8; }
.proj-value { font-size: 1.3rem; font-weight: 700; }
.proj-card.income { background: #e8f5e9; color: #2e7d32; }
.proj-card.expense { background: #fce4ec; color: #c62828; }
.proj-card.savings { background: #e3f2fd; color: #1565c0; }
.proj-card.savings.negative { background: #fff3e0; color: #e65100; }
.proj-card.avg { background: #f3e5f5; color: #7b1fa2; }
.proj-card.avg.negative { background: #fff3e0; color: #e65100; }

/* Mini bar chart */
.mini-timeline {
  display: flex; gap: 0.25rem; overflow-x: auto; padding: 0.5rem 0 1rem;
}
.mini-bar {
  display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
  min-width: 52px; flex-shrink: 0;
}
.mini-bar.current { background: #e3f2fd; border-radius: 8px; padding: 0.25rem; }
.mini-label { font-size: 0.7rem; font-weight: 600; color: #777; }
.bar-stack { display: flex; gap: 2px; align-items: flex-end; height: 80px; }
.bar { width: 18px; border-radius: 3px 3px 0 0; min-height: 4px; }
.income-bar { background: #4caf50; }
.expense-bar { background: #ef5350; }
.mini-net { font-size: 0.65rem; font-weight: 600; color: #2e7d32; white-space: nowrap; }
.mini-net.negative { color: #c62828; }

.legend { display: flex; gap: 1rem; margin-top: 0.5rem; }
.legend-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: #666; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.income-dot { background: #4caf50; }
.expense-dot { background: #ef5350; }

/* Range controls */
.range-controls { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.range-field { flex: 1; min-width: 200px; }
.range-field label { display: block; font-size: 0.85rem; font-weight: 600; color: #555; margin-bottom: 0.3rem; }
.range-field input[type="range"] { width: 100%; }

/* Timeline */
.timeline { display: flex; flex-direction: column; gap: 0.5rem; }

.month-card {
  border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;
  transition: border-color 0.2s;
}
.month-card.current { border-color: #1976d2; border-width: 2px; }
.month-card.past { opacity: 0.75; }
.month-card.expanded { border-color: #1976d2; }

.month-header {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
  cursor: pointer; flex-wrap: wrap;
}
.month-header:hover { background: #fafafa; }

.month-title { display: flex; align-items: center; gap: 0.5rem; min-width: 160px; }
.month-name { font-weight: 600; font-size: 0.95rem; }
.current-badge {
  font-size: 0.65rem; background: #1976d2; color: white; padding: 0.1rem 0.4rem;
  border-radius: 4px; font-weight: 600;
}

.month-summary { display: flex; gap: 0.75rem; flex: 1; min-width: 200px; }
.summary-income { color: #2e7d32; font-weight: 600; font-size: 0.85rem; }
.summary-expense { color: #c62828; font-weight: 600; font-size: 0.85rem; }
.summary-net { font-weight: 700; font-size: 0.85rem; color: #1565c0; }
.summary-net.negative { color: #e65100; }

.month-cumulative { display: flex; flex-direction: column; align-items: flex-end; min-width: 90px; }
.cumulative-label { font-size: 0.65rem; color: #999; text-transform: uppercase; }
.cumulative-value { font-size: 0.85rem; font-weight: 700; color: #1565c0; }
.cumulative-value.negative { color: #e65100; }

.expand-icon { font-size: 0.7rem; color: #999; margin-left: auto; }

/* Details */
.month-details { padding: 0 1rem 1rem; border-top: 1px solid #eee; }

.detail-section { margin-top: 0.75rem; }
.detail-section h4 { font-size: 0.9rem; margin-bottom: 0.4rem; }

.detail-list { display: flex; flex-direction: column; gap: 0.3rem; }
.detail-item {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.5rem;
  background: #fafafa; border-radius: 6px; font-size: 0.85rem;
}
.detail-desc { flex: 1; }
.detail-amount { font-weight: 600; }
.income-text { color: #2e7d32; }
.expense-text { color: #c62828; }
.detail-badge {
  font-size: 0.7rem; background: #f0f0f0; padding: 0.1rem 0.4rem;
  border-radius: 4px; text-transform: capitalize; color: #777;
}
.detail-empty { color: #bbb; font-style: italic; font-size: 0.85rem; }

.detail-footer {
  margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #eee;
  font-size: 0.9rem; color: #555;
}
.detail-footer .negative { color: #c62828; }

/* Transition */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0; transform: translateY(-10px);
}
</style>

