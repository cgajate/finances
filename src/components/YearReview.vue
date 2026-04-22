<script setup lang="ts">
import { ref } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useYearReview } from '@/composables/useYearReview'
import { formatCurrency } from '@/lib/formatCurrency'
import EmptyState from '@/components/EmptyState.vue'

const store = useFinancesStore()
const selectedYear = ref(new Date().getFullYear())
const { review, availableYears } = useYearReview(store.incomes, store.expenses, selectedYear)
</script>

<template>
  <div class="year-review-tab">
    <div class="year-header">
      <select v-model="selectedYear" class="year-select">
        <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <!-- Summary cards -->
    <div class="yr-summary-cards">
      <div class="yr-card earned">
        <span class="yr-card-label">Total Earned</span>
        <span class="yr-card-value">{{ formatCurrency(review.totalIncome) }}</span>
      </div>
      <div class="yr-card spent">
        <span class="yr-card-label">Total Spent</span>
        <span class="yr-card-value">{{ formatCurrency(review.totalExpenses) }}</span>
      </div>
      <div class="yr-card net" :class="{ negative: review.netSavings < 0 }">
        <span class="yr-card-label">Net Savings</span>
        <span class="yr-card-value">{{ formatCurrency(review.netSavings) }}</span>
      </div>
      <div class="yr-card rate" :class="{ negative: review.savingsRate < 0 }">
        <span class="yr-card-label">Savings Rate</span>
        <span class="yr-card-value">{{ review.savingsRate }}%</span>
      </div>
    </div>

    <!-- Best / Worst months -->
    <div v-if="review.bestMonth || review.worstMonth" class="highlights">
      <div v-if="review.bestMonth" class="highlight best">
        <span class="highlight-label">🏆 Best Month</span>
        <span class="highlight-month">{{ review.bestMonth.label }}</span>
        <span class="highlight-value positive">{{ formatCurrency(review.bestMonth.net) }}</span>
      </div>
      <div v-if="review.worstMonth" class="highlight worst">
        <span class="highlight-label">📉 Tightest Month</span>
        <span class="highlight-month">{{ review.worstMonth.label }}</span>
        <span class="highlight-value" :class="{ negative: review.worstMonth.net < 0 }">
          {{ formatCurrency(review.worstMonth.net) }}
        </span>
      </div>
    </div>

    <!-- Top expense categories -->
    <h2>Biggest Expense Categories</h2>
    <div v-if="review.topCategories.length" class="categories">
      <div v-for="(cat, i) in review.topCategories" :key="cat.category" class="cat-row">
        <span class="cat-rank">#{{ i + 1 }}</span>
        <span class="cat-name">{{ cat.category }}</span>
        <div class="cat-bar-track">
          <div
            class="cat-bar-fill"
            :style="{ width: cat.percent + '%' }"
          ></div>
        </div>
        <span class="cat-amount">{{ formatCurrency(cat.total) }}</span>
        <span class="cat-percent">{{ cat.percent }}%</span>
      </div>
    </div>
    <EmptyState v-else :message="`No expense data for ${selectedYear}.`" />

    <!-- Monthly breakdown -->
    <h2>Monthly Breakdown</h2>
    <div class="yr-month-chart">
      <div v-for="m in review.months" :key="m.month" class="yr-month-col">
        <div class="yr-month-bars">
          <div
            class="yr-month-bar income-bar"
            :style="{
              height: review.totalIncome > 0
                ? Math.max((m.income / (review.totalIncome / 12)) * 40, 2) + 'px'
                : '2px',
            }"
            :title="'Income: ' + formatCurrency(m.income)"
          ></div>
          <div
            class="yr-month-bar expense-bar"
            :style="{
              height: review.totalExpenses > 0
                ? Math.max((m.expenses / (review.totalExpenses / 12)) * 40, 2) + 'px'
                : '2px',
            }"
            :title="'Expenses: ' + formatCurrency(m.expenses)"
          ></div>
        </div>
        <div class="yr-month-label">{{ m.label }}</div>
        <div class="yr-month-net" :class="{ negative: m.net < 0 }">
          {{ m.net >= 0 ? '+' : '' }}{{ formatCurrency(m.net) }}
        </div>
      </div>
    </div>
    <div class="legend">
      <span class="legend-item"><span class="dot income-dot"></span> Income</span>
      <span class="legend-item"><span class="dot expense-dot"></span> Expenses</span>
    </div>
  </div>
</template>

<style scoped>
h2 { margin: 1.5rem 0 1rem; font-size: 1.1rem; }

/* Year Review */
.year-header { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
.year-select {
  padding: 0.5rem 1rem; border: 2px solid var(--color-primary); border-radius: 8px;
  font-size: 1rem; font-weight: 600; color: var(--color-primary); background: var(--color-surface); cursor: pointer;
}

.yr-summary-cards {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem;
}
.yr-card { padding: 1rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.3rem; }
.yr-card-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.8; }
.yr-card-value { font-size: 1.3rem; font-weight: 700; }
.yr-card.earned { background: var(--color-income-bg); color: var(--color-income); }
.yr-card.spent { background: var(--color-expense-bg); color: var(--color-expense); }
.yr-card.net { background: var(--color-primary-light); color: var(--color-primary-text); }
.yr-card.net.negative { background: var(--color-warning-bg); color: var(--color-warning); }
.yr-card.rate { background: var(--color-assigned-bg); color: var(--color-assigned-text); }
.yr-card.rate.negative { background: var(--color-warning-bg); color: var(--color-warning); }

.highlights { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem; }
.highlight { padding: 0.75rem 1rem; border-radius: 10px; display: flex; flex-direction: column; gap: 0.2rem; }
.highlight.best { background: var(--color-income-bg); }
.highlight.worst { background: var(--color-warning-bg); }
.highlight-label { font-size: 0.8rem; font-weight: 600; }
.highlight-month { font-size: 1.1rem; font-weight: 700; }
.highlight-value { font-weight: 700; font-size: 0.95rem; }
.highlight-value.positive { color: var(--color-income); }
.highlight-value.negative { color: var(--color-expense); }

.categories { display: flex; flex-direction: column; gap: 0.5rem; }
.cat-row {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem; background: var(--color-bg-secondary); border-radius: 8px;
}
.cat-rank { font-weight: 700; font-size: 0.85rem; color: var(--color-text-muted); min-width: 24px; }
.cat-name { font-weight: 600; min-width: 100px; }
.cat-bar-track { flex: 1; height: 8px; background: var(--color-progress-track); border-radius: 4px; overflow: hidden; }
.cat-bar-fill { height: 100%; background: var(--color-btn-delete); border-radius: 4px; transition: width 0.3s; }
.cat-amount { font-weight: 700; color: var(--color-expense); min-width: 80px; text-align: right; font-size: 0.9rem; }
.cat-percent { font-size: 0.8rem; color: var(--color-text-muted); min-width: 40px; text-align: right; }

.yr-month-chart {
  display: flex; gap: 0.25rem; overflow-x: auto; padding: 0.5rem 0 0.5rem; align-items: flex-end;
}
.yr-month-col { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; min-width: 48px; flex: 1; }
.yr-month-bars { display: flex; gap: 2px; align-items: flex-end; height: 80px; }
.yr-month-bar { width: 16px; border-radius: 3px 3px 0 0; min-height: 2px; }
.income-bar { background: var(--color-progress-fill); }
.expense-bar { background: var(--color-btn-delete); }
.yr-month-label { font-size: 0.7rem; font-weight: 600; color: var(--color-text-muted); }
.yr-month-net { font-size: 0.6rem; font-weight: 600; color: var(--color-income); white-space: nowrap; }
.yr-month-net.negative { color: var(--color-expense); }

.legend { display: flex; gap: 1rem; margin-top: 0.5rem; }
.legend-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: var(--color-text-muted); }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.income-dot { background: var(--color-progress-fill); }
.expense-dot { background: var(--color-btn-delete); }
</style>

