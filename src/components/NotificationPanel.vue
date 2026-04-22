<script setup lang="ts">
import { ref } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

const store = useNotificationsStore()
const open = ref(false)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function dueLabel(days: number | null): string {
  if (days === null) return ''
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}
</script>

<template>
  <div class="notification-wrapper">
    <button class="bell-btn" @click="toggle" aria-label="Notifications">
      <font-awesome-icon :icon="['fas', 'bell']" />
      <span v-if="store.unreadCount > 0" class="badge">{{ store.unreadCount }}</span>
    </button>

    <!-- Backdrop -->
    <div v-if="open" class="backdrop" @click="close"></div>

    <!-- Panel -->
    <Transition name="slide">
      <div v-if="open" class="panel">
        <div class="panel-header">
          <h3>Notifications</h3>
          <button
            v-if="store.allNotifications.length > 0"
            class="dismiss-all"
            @click="store.dismissAll(); close()"
          >
            Dismiss All
          </button>
        </div>

        <div v-if="store.allNotifications.length === 0" class="empty">
          No notifications right now 🎉
        </div>

        <ul v-else class="notification-list">
          <!-- Expense notifications -->
          <li
            v-for="n in store.expenseNotifications"
            :key="n.id"
            class="notification-item expense"
          >
            <div class="notification-icon expense-icon">
              <font-awesome-icon :icon="['fas', 'money-bill-transfer']" />
            </div>
            <div class="notification-body">
              <div class="notification-title">{{ n.description }}</div>
              <div class="notification-detail">
                {{ formatCurrency(n.amount) }}
                <span class="due-label" :class="{ overdue: (n.daysUntilDue ?? 0) < 0 }">
                  {{ dueLabel(n.daysUntilDue) }}
                </span>
              </div>
            </div>
            <button
              class="mute-btn"
              title="Mute until next billing cycle"
              @click="store.muteExpense(n.sourceId)"
            >
              <font-awesome-icon :icon="['fas', 'volume-xmark']" /> Mute
            </button>
          </li>

          <!-- Income notifications -->
          <li
            v-for="n in store.incomeNotifications"
            :key="n.id"
            class="notification-item income"
          >
            <div class="notification-icon income-icon">
              <font-awesome-icon :icon="['fas', 'coins']" />
            </div>
            <div class="notification-body">
              <div class="notification-title">{{ n.description }}</div>
              <div class="notification-detail">
                {{ formatCurrency(n.amount) }}
                <span class="due-label">
                  {{ dueLabel(n.daysUntilDue) }}
                </span>
              </div>
            </div>
            <button
              class="dismiss-btn"
              title="Dismiss"
              @click="store.dismissIncome(n.sourceId)"
            >
              <font-awesome-icon :icon="['fas', 'check']" /> Got it
            </button>
          </li>

          <!-- Budget notifications -->
          <li
            v-for="n in store.budgetNotifications"
            :key="n.id"
            class="notification-item"
            :class="n.kind === 'budget-over' ? 'expense' : 'income'"
          >
            <div class="notification-icon" :class="n.kind === 'budget-over' ? 'budget-over-icon' : 'budget-warn-icon'">
              <font-awesome-icon :icon="['fas', n.kind === 'budget-over' ? 'circle-exclamation' : 'triangle-exclamation']" />
            </div>
            <div class="notification-body">
              <div class="notification-title">{{ n.description }}</div>
              <div class="notification-detail">
                Spent {{ formatCurrency(n.amount) }}
              </div>
            </div>
            <button
              class="dismiss-btn"
              title="Dismiss"
              @click="store.dismissBudget(n.id)"
            >
              <font-awesome-icon :icon="['fas', 'check']" /> Got it
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notification-wrapper { position: relative; }

.bell-btn { background: var(--color-icon-bg); border: none; font-size: 1.15rem; cursor: pointer; position: relative; padding: 0.4rem; line-height: 1; color: var(--color-text-secondary); border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s; backdrop-filter: blur(4px); }
.bell-btn:hover { background: var(--color-primary-light); color: var(--color-primary-text); transform: translateY(-1px); box-shadow: 0 2px 8px var(--color-card-shadow); }
.badge { position: absolute; top: -4px; right: -6px; background: var(--color-btn-delete); color: white; font-size: 0.65rem; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }

.backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 199; }

.panel {
  position: absolute; top: calc(100% + 8px); right: 0; width: 340px; max-height: 420px;
  overflow-y: auto; background: var(--color-surface); border-radius: 12px;
  box-shadow: 0 8px 32px var(--color-card-shadow); z-index: 200; color: var(--color-text);
  border: 1px solid var(--color-border);
}

@media (max-width: 480px) {
  .panel {
    position: fixed;
    top: auto;
    right: 1rem;
    left: 1rem;
    width: auto;
    margin-top: 0.5rem;
  }
}

.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border-light); }
.panel-header h3 { font-size: 1rem; margin: 0; }

.empty { padding: 2rem 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.9rem; }

.notification-list { list-style: none; padding: 0; margin: 0; }
.notification-item { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border-light); }
.notification-item:last-child { border-bottom: none; }
.notification-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 3px; width: 1.4rem; text-align: center; }
.expense-icon { color: var(--color-expense); }
.income-icon { color: var(--color-income); }
.budget-over-icon { color: var(--color-btn-delete); }
.budget-warn-icon { color: var(--color-warning); }
.notification-body { flex: 1; min-width: 0; }
.notification-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.15rem; }
.notification-detail { font-size: 0.8rem; color: var(--color-text-muted); display: flex; gap: 0.5rem; flex-wrap: wrap; }
.due-label { font-weight: 500; color: var(--color-warning); }
.due-label.overdue { color: var(--color-expense); font-weight: 700; }


/* Transition */
.slide-enter-active, .slide-leave-active { transition: opacity 0.15s, transform 0.15s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>

