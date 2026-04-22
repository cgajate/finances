<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useForecasting } from '@/composables/useForecasting'
import { useSpendingTrends } from '@/composables/useSpendingTrends'
import { useYearReview } from '@/composables/useYearReview'
import TabBar from '@/components/TabBar.vue'

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
const activeTab = ref<'timeline' | 'projection' | 'trends' | 'year-review'>('timeline')

const analyticsTabs = [
  { value: 'timeline', label: 'Month-by-Month' },
  { value: 'projection', label: '12-Month Projection' },
  { value: 'trends', label: 'Spending Trends' },
  { value: 'year-review', label: 'Year Review' },
]

// Spending trends
const trendMonths = ref(6)
const { trends } = useSpendingTrends(store.expenses, trendMonths)
const expandedCategory = ref<string | null>(null)

// Year Review
const selectedYear = ref(new Date().getFullYear())
const { review, availableYears } = useYearReview(store.incomes, store.expenses, selectedYear)

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
    <h1>Analytics & Forecasting</h1>

    <TabBar :tabs="analyticsTabs" v-model="activeTab" />

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

    <!-- Spending Trends Tab -->
    <div v-if="activeTab === 'trends'" class="trends-tab">
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
          @click="expandedCategory = expandedCategory === cat.category ? null : cat.category"
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
      <p v-else class="empty">No expense data to show trends.</p>
    </div>

    <!-- Year Review Tab -->
    <div v-if="activeTab === 'year-review'" class="year-review-tab">
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
      <p v-else class="empty">No expense data for {{ selectedYear }}.</p>

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
  </div>
</template>

<style scoped>
.page { max-width: 800px; margin: 0 auto; }
h1 { margin-bottom: 1.5rem; }
h2 { margin: 1.5rem 0 1rem; font-size: 1.1rem; }


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
.proj-card.income { background: var(--color-income-bg); color: var(--color-income); }
.proj-card.expense { background: var(--color-expense-bg); color: var(--color-expense); }
.proj-card.savings { background: var(--color-primary-light); color: var(--color-primary-text); }
.proj-card.savings.negative { background: var(--color-warning-bg); color: var(--color-warning); }
.proj-card.avg { background: var(--color-assigned-bg); color: var(--color-assigned-text); }
.proj-card.avg.negative { background: var(--color-warning-bg); color: var(--color-warning); }

/* Mini bar chart */
.mini-timeline {
  display: flex; gap: 0.25rem; overflow-x: auto; padding: 0.5rem 0 1rem;
}
.mini-bar {
  display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
  min-width: 52px; flex-shrink: 0;
}
.mini-bar.current { background: var(--color-primary-light); border-radius: 8px; padding: 0.25rem; }
.mini-label { font-size: 0.7rem; font-weight: 600; color: var(--color-text-muted); }
.bar-stack { display: flex; gap: 2px; align-items: flex-end; height: 80px; }
.bar { width: 18px; border-radius: 3px 3px 0 0; min-height: 4px; }
.income-bar { background: var(--color-progress-fill); }
.expense-bar { background: var(--color-btn-delete); }
.mini-net { font-size: 0.65rem; font-weight: 600; color: var(--color-income); white-space: nowrap; }
.mini-net.negative { color: var(--color-expense); }

.legend { display: flex; gap: 1rem; margin-top: 0.5rem; }
.legend-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: var(--color-text-muted); }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.income-dot { background: var(--color-progress-fill); }
.expense-dot { background: var(--color-btn-delete); }

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

.empty { color: var(--color-text-muted); font-style: italic; }

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
.yr-month-label { font-size: 0.7rem; font-weight: 600; color: var(--color-text-muted); }
.yr-month-net { font-size: 0.6rem; font-weight: 600; color: var(--color-income); white-space: nowrap; }
.yr-month-net.negative { color: var(--color-expense); }
</style>

