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
      🔔
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
            <div class="notification-icon">💸</div>
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
              🔇 Mute
            </button>
          </li>

          <!-- Income notifications -->
          <li
            v-for="n in store.incomeNotifications"
            :key="n.id"
            class="notification-item income"
          >
            <div class="notification-icon">💰</div>
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
              ✓ Got it
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notification-wrapper { position: relative; }

.bell-btn { background: none; border: none; font-size: 1.3rem; cursor: pointer; position: relative; padding: 0.25rem; line-height: 1; }
.badge { position: absolute; top: -4px; right: -6px; background: var(--color-btn-delete); color: white; font-size: 0.65rem; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }

.backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 199; }

.panel {
  position: absolute; top: calc(100% + 8px); right: 0; width: 340px; max-height: 420px;
  overflow-y: auto; background: var(--color-surface); border-radius: 12px;
  box-shadow: 0 8px 32px var(--color-card-shadow); z-index: 200; color: var(--color-text);
  border: 1px solid var(--color-border);
}

@media (max-width: 400px) { .panel { width: calc(100vw - 2rem); right: -0.5rem; } }

.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border-light); }
.panel-header h3 { font-size: 1rem; margin: 0; }
.dismiss-all { background: none; border: none; color: var(--color-primary); font-size: 0.8rem; cursor: pointer; font-weight: 500; }

.empty { padding: 2rem 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.9rem; }

.notification-list { list-style: none; padding: 0; margin: 0; }
.notification-item { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border-light); }
.notification-item:last-child { border-bottom: none; }
.notification-icon { font-size: 1.3rem; flex-shrink: 0; margin-top: 2px; }
.notification-body { flex: 1; min-width: 0; }
.notification-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.15rem; }
.notification-detail { font-size: 0.8rem; color: var(--color-text-muted); display: flex; gap: 0.5rem; flex-wrap: wrap; }
.due-label { font-weight: 500; color: var(--color-warning); }
.due-label.overdue { color: var(--color-expense); font-weight: 700; }

.mute-btn, .dismiss-btn { flex-shrink: 0; padding: 0.3rem 0.5rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer; border: none; white-space: nowrap; align-self: center; }
.mute-btn { background: var(--color-warning-bg); color: var(--color-warning); }
.mute-btn:hover { background: var(--color-warning-bg); filter: brightness(0.95); }
.dismiss-btn { background: var(--color-income-bg); color: var(--color-income); }
.dismiss-btn:hover { background: var(--color-income-bg); filter: brightness(0.95); }

/* Transition */
.slide-enter-active, .slide-leave-active { transition: opacity 0.15s, transform 0.15s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>

