<script setup lang="ts">
import { ref } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import { useBillCalendar, type CalendarDay } from '@/composables/useBillCalendar'

const store = useFinancesStore()
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())

const { calendar } = useBillCalendar(store.incomes, store.expenses, year, month)

const selectedDay = ref<CalendarDay | null>(null)

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function prevMonth() {
  if (month.value === 0) {
    month.value = 11
    year.value--
  } else {
    month.value--
  }
  selectedDay.value = null
}

function nextMonth() {
  if (month.value === 11) {
    month.value = 0
    year.value++
  } else {
    month.value++
  }
  selectedDay.value = null
}

function goToday() {
  const today = new Date()
  year.value = today.getFullYear()
  month.value = today.getMonth()
  selectedDay.value = null
}

function selectDay(day: CalendarDay) {
  selectedDay.value = selectedDay.value?.date === day.date ? null : day
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}
</script>

<template>
  <div class="page">
    <h1>📅 Bill Calendar</h1>

    <!-- Month navigation -->
    <div class="nav-row">
      <button class="nav-btn" @click="prevMonth">← Prev</button>
      <div class="nav-center">
        <span class="nav-label">{{ calendar.label }}</span>
        <button class="today-btn" @click="goToday">Today</button>
      </div>
      <button class="nav-btn" @click="nextMonth">Next →</button>
    </div>

    <!-- Month summary -->
    <div class="month-summary">
      <span class="summary-income">+{{ formatCurrency(calendar.totalIncome) }}</span>
      <span class="summary-expense">-{{ formatCurrency(calendar.totalExpenses) }}</span>
      <span class="summary-net" :class="{ negative: calendar.totalIncome - calendar.totalExpenses < 0 }">
        Net: {{ formatCurrency(calendar.totalIncome - calendar.totalExpenses) }}
      </span>
    </div>

    <!-- Calendar grid -->
    <div class="calendar-grid">
      <div class="weekday-header">
        <div v-for="wd in weekdays" :key="wd" class="weekday">{{ wd }}</div>
      </div>
      <div v-for="(week, wi) in calendar.weeks" :key="wi" class="week-row">
        <div
          v-for="day in week"
          :key="day.date"
          class="day-cell"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'has-events': day.events.length > 0,
            'selected': selectedDay?.date === day.date,
          }"
          @click="selectDay(day)"
        >
          <span class="day-number">{{ day.dayOfMonth }}</span>
          <div v-if="day.events.length && day.isCurrentMonth" class="day-dots">
            <span
              v-for="(ev, ei) in day.events.slice(0, 3)"
              :key="ei"
              class="dot"
              :class="ev.kind === 'income' ? 'dot-income' : 'dot-expense'"
            ></span>
            <span v-if="day.events.length > 3" class="dot-more">+{{ day.events.length - 3 }}</span>
          </div>
          <div v-if="day.totalIncome > 0 && day.isCurrentMonth" class="day-amount income-amount">
            +{{ formatCurrency(day.totalIncome) }}
          </div>
          <div v-if="day.totalExpenses > 0 && day.isCurrentMonth" class="day-amount expense-amount">
            -{{ formatCurrency(day.totalExpenses) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Selected day detail -->
    <Transition name="slide-down">
      <div v-if="selectedDay && selectedDay.events.length" class="day-detail">
        <h3>{{ new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}</h3>
        <div v-for="ev in selectedDay.events" :key="ev.id" class="detail-event" :class="ev.kind">
          <span class="detail-desc">{{ ev.description }}</span>
          <span class="detail-amount" :class="ev.kind">
            {{ ev.kind === 'income' ? '+' : '-' }}{{ formatCurrency(ev.amount) }}
          </span>
          <span class="detail-badge">{{ ev.frequency }}</span>
          <span v-if="ev.category" class="detail-cat">{{ ev.category }}</span>
        </div>
      </div>
    </Transition>

    <!-- Legend -->
    <div class="legend">
      <span class="legend-item"><span class="dot dot-income"></span> Income</span>
      <span class="legend-item"><span class="dot dot-expense"></span> Expense</span>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 800px; margin: 0 auto; }
h1 { margin-bottom: 1rem; }
h3 { margin: 0 0 0.5rem; font-size: 1rem; }

.nav-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.nav-btn {
  padding: 0.4rem 0.8rem; background: none; border: 1px solid var(--color-primary);
  color: var(--color-primary); border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem;
}
.nav-btn:hover { background: var(--color-primary-light); }
.nav-center { display: flex; align-items: center; gap: 0.5rem; }
.nav-label { font-size: 1.15rem; font-weight: 700; }
.today-btn {
  padding: 0.2rem 0.5rem; background: var(--color-primary); color: white; border: none;
  border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer;
}

.month-summary { display: flex; gap: 1rem; justify-content: center; margin-bottom: 1rem; flex-wrap: wrap; }
.summary-income { color: var(--color-income); font-weight: 700; }
.summary-expense { color: var(--color-expense); font-weight: 700; }
.summary-net { font-weight: 700; color: var(--color-primary-text); }
.summary-net.negative { color: var(--color-warning); }

.calendar-grid { border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
.weekday-header { display: grid; grid-template-columns: repeat(7, 1fr); background: var(--color-header-bg); color: var(--color-header-text); }
.weekday { text-align: center; padding: 0.4rem; font-size: 0.8rem; font-weight: 600; }
.week-row { display: grid; grid-template-columns: repeat(7, 1fr); border-top: 1px solid var(--color-border-light); }

.day-cell {
  min-height: 70px; padding: 0.3rem; border-right: 1px solid var(--color-border-light);
  cursor: pointer; transition: background 0.15s; position: relative;
  display: flex; flex-direction: column; gap: 0.15rem;
}
.day-cell:last-child { border-right: none; }
.day-cell:hover { background: var(--color-bg-secondary); }
.day-cell.other-month { opacity: 0.35; }
.day-cell.today { background: var(--color-primary-light); }
.day-cell.today .day-number { color: var(--color-primary); font-weight: 700; }
.day-cell.has-events { background: var(--color-bg-secondary); }
.day-cell.selected { background: var(--color-primary-light); outline: 2px solid var(--color-primary); outline-offset: -2px; }

.day-number { font-size: 0.8rem; font-weight: 500; color: var(--color-text-secondary); }
.day-dots { display: flex; gap: 2px; flex-wrap: wrap; }
.dot { width: 6px; height: 6px; border-radius: 50%; }
.dot-income { background: var(--color-progress-fill); }
.dot-expense { background: var(--color-btn-delete); }
.dot-more { font-size: 0.55rem; color: var(--color-text-muted); }

.day-amount { font-size: 0.6rem; font-weight: 600; white-space: nowrap; }
.income-amount { color: var(--color-income); }
.expense-amount { color: var(--color-expense); }

.day-detail {
  margin-top: 1rem; padding: 1rem; background: var(--color-bg-secondary);
  border: 1px solid var(--color-border); border-radius: 10px;
}
.detail-event {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.5rem;
  border-radius: 6px; margin-bottom: 0.3rem; flex-wrap: wrap;
}
.detail-event.income { background: var(--color-income-bg); }
.detail-event.expense { background: var(--color-expense-bg); }
.detail-desc { flex: 1; font-weight: 600; font-size: 0.9rem; min-width: 100px; }
.detail-amount { font-weight: 700; font-size: 0.9rem; }
.detail-amount.income { color: var(--color-income); }
.detail-amount.expense { color: var(--color-expense); }
.detail-badge {
  font-size: 0.7rem; background: var(--color-badge-bg); padding: 0.1rem 0.4rem;
  border-radius: 4px; text-transform: capitalize; color: var(--color-text-muted);
}
.detail-cat {
  font-size: 0.7rem; background: var(--color-cat-bg); padding: 0.1rem 0.4rem;
  border-radius: 4px; color: var(--color-cat-text);
}

.legend { display: flex; gap: 1rem; margin-top: 1rem; justify-content: center; }
.legend-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: var(--color-text-muted); }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 600px) {
  .day-cell { min-height: 50px; padding: 0.2rem; }
  .day-amount { display: none; }
}
</style>

