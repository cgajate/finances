<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/lib/formatCurrency'

const props = defineProps<{
  yearProjection: {
    totalIncome: number
    totalExpenses: number
    netSavings: number
    months: {
      month: string
      label: string
      totalIncome: number
      totalExpenses: number
      net: number
    }[]
  }
}>()

function isCurrentMonth(month: string): boolean {
  const now = new Date()
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return month === current
}

const monthlySavingsAvg = computed(() => {
  const proj = props.yearProjection
  if (proj.months.length === 0) return 0
  return Math.round((proj.netSavings / proj.months.length) * 100) / 100
})
</script>

<template>
  <div class="projection">
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
</template>

<style scoped>
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
</style>

