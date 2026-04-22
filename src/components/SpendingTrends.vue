<script setup lang="ts">
import { ref } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useSpendingTrends } from '@/composables/useSpendingTrends'
import { formatCurrency } from '@/lib/formatCurrency'
import EmptyState from '@/components/EmptyState.vue'

const store = useFinancesStore()
const trendMonths = ref(6)
const { trends } = useSpendingTrends(store.expenses, trendMonths)
const expandedCategory = ref<string | null>(null)
</script>

<template>
  <div class="trends-tab">
    <div class="range-controls">
      <div class="range-field">
        <label>Months to compare: {{ trendMonths }}</label>
        <input v-model.number="trendMonths" type="range" min="3" max="12" />
      </div>
    </div>

    <!-- Total spending bar chart -->
    <h2>Total Monthly Spending</h2>
    <div class="trend-chart">
      <div
        v-for="m in trends.totalByMonth"
        :key="m.month"
        class="trend-bar-col"
      >
        <div class="trend-bar-value">{{ formatCurrency(m.amount) }}</div>
        <div class="trend-bar-track">
          <div
            class="trend-bar-fill"
            :style="{ height: (m.amount / trends.maxMonthlyTotal) * 100 + '%' }"
          ></div>
        </div>
        <div class="trend-bar-label">{{ m.label }}</div>
      </div>
    </div>

    <!-- Category breakdown -->
    <h2>By Category</h2>
    <div v-if="trends.categories.length" class="trend-categories">
      <div
        v-for="cat in trends.categories"
        :key="cat.category"
        class="trend-cat-card"
        role="button"
        tabindex="0"
        @click="expandedCategory = expandedCategory === cat.category ? null : cat.category"
        @keydown.enter.prevent="expandedCategory = expandedCategory === cat.category ? null : cat.category"
        @keydown.space.prevent="expandedCategory = expandedCategory === cat.category ? null : cat.category"
      >
        <div class="trend-cat-header">
          <div class="trend-cat-info">
            <span class="trend-cat-name">{{ cat.category }}</span>
            <span class="trend-cat-avg">{{ formatCurrency(cat.average) }}/mo avg</span>
          </div>
          <div class="trend-cat-right">
            <span
              class="trend-arrow"
              :class="{
                'trend-up': cat.direction === 'up',
                'trend-down': cat.direction === 'down',
                'trend-flat': cat.direction === 'flat',
              }"
            >
              <template v-if="cat.direction === 'up'">↑ +{{ cat.trend }}%</template>
              <template v-else-if="cat.direction === 'down'">↓ {{ cat.trend }}%</template>
              <template v-else>→ flat</template>
            </span>
            <span class="trend-cat-total">{{ formatCurrency(cat.total) }}</span>
          </div>
        </div>

        <!-- Mini sparkline bars -->
        <div class="sparkline">
          <div
            v-for="md in cat.months"
            :key="md.month"
            class="spark-bar"
            :class="{ 'spark-high': md.amount > cat.average * 1.2 }"
            :style="{
              height: cat.total > 0
                ? Math.max((md.amount / Math.max(...cat.months.map(m => m.amount), 1)) * 32, 2) + 'px'
                : '2px',
            }"
            :title="`${md.label}: ${formatCurrency(md.amount)}`"
          ></div>
        </div>

        <!-- Expanded month-by-month detail -->
        <Transition name="slide-down">
          <div v-if="expandedCategory === cat.category" class="trend-cat-detail">
            <div
              v-for="md in cat.months"
              :key="md.month"
              class="trend-detail-row"
            >
              <span class="trend-detail-month">{{ md.label }}</span>
              <div class="trend-detail-bar-track">
                <div
                  class="trend-detail-bar-fill"
                  :style="{
                    width: cat.total > 0
                      ? (md.amount / Math.max(...cat.months.map(m => m.amount), 1)) * 100 + '%'
                      : '0%',
                  }"
                ></div>
              </div>
              <span class="trend-detail-amount">{{ formatCurrency(md.amount) }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </div>
    <EmptyState v-else message="No expense data to show trends." />
  </div>
</template>

<style scoped>
h2 { margin: 1.5rem 0 1rem; font-size: 1.1rem; }

/* Range controls */
.range-controls { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.range-field { flex: 1; min-width: 200px; }
.range-field label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 0.3rem; }
.range-field input[type="range"] { width: 100%; }

/* Spending Trends */
.trend-chart {
  display: flex; gap: 0.25rem; overflow-x: auto; padding: 0.5rem 0 1rem;
  align-items: flex-end;
}
.trend-bar-col {
  display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
  min-width: 52px; flex: 1;
}
.trend-bar-value { font-size: 0.6rem; font-weight: 600; color: var(--color-text-secondary); white-space: nowrap; }
.trend-bar-track { width: 100%; height: 100px; display: flex; align-items: flex-end; justify-content: center; }
.trend-bar-fill {
  width: 70%; max-width: 40px; background: linear-gradient(180deg, var(--color-btn-delete), var(--color-expense));
  border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.3s ease;
}
.trend-bar-label { font-size: 0.7rem; font-weight: 600; color: var(--color-text-muted); }

.trend-categories { display: flex; flex-direction: column; gap: 0.75rem; }
.trend-cat-card {
  border: 1px solid var(--color-border); border-radius: 10px; padding: 0.75rem 1rem;
  cursor: pointer; transition: border-color 0.2s; background: var(--color-surface);
}
.trend-cat-card:hover { border-color: var(--color-primary); }

.trend-cat-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
.trend-cat-info { display: flex; flex-direction: column; gap: 0.1rem; }
.trend-cat-name { font-weight: 700; font-size: 1rem; }
.trend-cat-avg { font-size: 0.8rem; color: var(--color-text-muted); }
.trend-cat-right { display: flex; align-items: center; gap: 0.75rem; }
.trend-cat-total { font-weight: 700; font-size: 0.95rem; color: var(--color-expense); }

.trend-arrow { font-weight: 700; font-size: 0.85rem; padding: 0.15rem 0.5rem; border-radius: 6px; }
.trend-up { background: var(--color-expense-bg); color: var(--color-expense); }
.trend-down { background: var(--color-income-bg); color: var(--color-income); }
.trend-flat { background: var(--color-badge-bg); color: var(--color-text-muted); }

.sparkline { display: flex; gap: 2px; align-items: flex-end; margin-top: 0.5rem; height: 32px; }
.spark-bar {
  flex: 1; background: var(--color-expense-bg); border-radius: 2px 2px 0 0; min-height: 2px;
  transition: height 0.3s ease;
}
.spark-bar.spark-high { background: var(--color-btn-delete); }

.trend-cat-detail { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--color-border-light); }
.trend-detail-row {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0;
}
.trend-detail-month { font-size: 0.8rem; color: var(--color-text-muted); min-width: 55px; }
.trend-detail-bar-track {
  flex: 1; height: 8px; background: var(--color-badge-bg); border-radius: 4px; overflow: hidden;
}
.trend-detail-bar-fill {
  height: 100%; background: var(--color-btn-delete); border-radius: 4px; transition: width 0.3s ease;
}
.trend-detail-amount { font-size: 0.8rem; font-weight: 600; color: var(--color-expense); min-width: 65px; text-align: right; }

/* Transition */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0; transform: translateY(-10px);
}
</style>

