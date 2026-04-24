<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, formatDateTime } from '@/lib/formatDate'
import { formatCurrency } from '@/lib/formatCurrency'
import { getNextDueDate } from '@/lib/dateUtils'
import type { Income, Expense, RecurringIncome, RecurringExpense } from '@/types/finance'

const props = defineProps<{
  /** The finance item to render */
  item: Income | Expense
  /** Controls color scheme: income (green) or expense (red) */
  kind: 'income' | 'expense'
}>()

defineEmits<{
  /** Emitted when the user clicks the remove button */
  (e: 'delete', id: string): void
}>()


/** Approval status for this expense, if any */
const approvalStatus = computed(() => {
  if (props.kind !== 'expense') return undefined
  return (props.item as Expense).approvalStatus
})

/** Get the date field — income uses `date`, expense uses `dueDate` */
function getDateValue(): string | null {
  if (props.kind === 'income') {
    const inc = props.item as Income
    return inc.date ?? null
  }
  return (props.item as Expense).dueDate ?? null
}

/** Get the edit route for this item */
function editRoute(): string {
  return props.kind === 'income'
    ? `/finances/income/${props.item.id}/edit`
    : `/finances/expenses/${props.item.id}/edit`
}

/** Current month in YYYY-MM format */
const currentMonth = new Date().toISOString().slice(0, 7)

/** Current-month override amount, if any */
const currentOverride = computed(() => {
  if (props.item.type !== 'recurring') return undefined
  const rec = props.item as RecurringIncome | RecurringExpense
  return rec.overrides?.[currentMonth]
})

/** Number of active overrides on this item */
const overrideCount = computed(() => {
  if (props.item.type !== 'recurring') return 0
  const rec = props.item as RecurringIncome | RecurringExpense
  return rec.overrides ? Object.keys(rec.overrides).length : 0
})
</script>

<template>
  <div class="list-item">
    <!-- Description + Amount -->
    <div class="list-item-main">
      <strong>{{ item.description }}</strong>
      <span :class="kind === 'income' ? 'income-amount' : 'expense-amount'">
        <template v-if="currentOverride !== undefined">
          <span class="override-amount">{{ formatCurrency(currentOverride) }}</span>
          <span class="override-base">({{ formatCurrency(item.amount) }})</span>
        </template>
        <template v-else>
          {{ formatCurrency(item.amount) }}
        </template>
      </span>
    </div>

    <!-- Badges row -->
    <div class="list-item-meta">
      <span
        class="badge"
        :class="kind === 'income' ? 'income-badge' : 'expense-badge'"
      >
        {{ item.type === 'recurring' ? item.frequency : 'one-time' }}
      </span>
      <span class="badge cat-badge">{{ item.category ?? 'Other' }}</span>
      <span
        v-if="approvalStatus === 'pending'"
        class="badge approval-badge approval-badge--pending"
      >
        <font-awesome-icon :icon="['fas', 'clock']" /> Pending Approval
      </span>
      <span
        v-else-if="approvalStatus === 'approved'"
        class="badge approval-badge approval-badge--approved"
      >
        <font-awesome-icon :icon="['fas', 'circle-check']" /> Approved
      </span>
      <span
        v-else-if="approvalStatus === 'rejected'"
        class="badge approval-badge approval-badge--rejected"
      >
        <font-awesome-icon :icon="['fas', 'circle-xmark']" /> Rejected
      </span>
      <span v-if="overrideCount > 0" class="badge override-badge" :title="`${overrideCount} month adjustment${overrideCount > 1 ? 's' : ''}`">
        <font-awesome-icon :icon="['fas', 'pen']" /> {{ overrideCount }} adj.
      </span>
      <span
        v-if="kind === 'expense' && (item as Expense).assignedTo"
        class="badge assigned-badge"
      >
        <font-awesome-icon :icon="['fas', 'user']" /> {{ (item as Expense).assignedTo }}
      </span>
      <span v-if="item.type === 'recurring' && (item as any).notes" class="meta">
        <font-awesome-icon :icon="['fas', 'note-sticky']" /> {{ (item as any).notes }}
      </span>
      <span v-else-if="kind === 'expense' && (item as Expense).notes" class="meta">
        <font-awesome-icon :icon="['fas', 'note-sticky']" /> {{ (item as Expense).notes }}
      </span>
    </div>

    <!-- Date row -->
    <div v-if="item.type === 'recurring' && getDateValue()" class="list-item-date">
      <font-awesome-icon
        :icon="['fas', 'calendar-day']"
        :class="kind === 'income' ? 'income-date-icon' : 'expense-date-icon'"
      />
      {{ kind === 'income' ? 'Next:' : 'Next due:' }}
      {{ formatDate(getNextDueDate(getDateValue()!, item.frequency)) }}
    </div>
    <div v-else-if="getDateValue()" class="list-item-date">
      <font-awesome-icon
        :icon="['fas', 'calendar']"
        :class="kind === 'income' ? 'income-date-icon' : 'expense-date-icon'"
      />
      {{ kind === 'expense' ? 'Due: ' : '' }}{{ formatDate(getDateValue()!) }}
    </div>

    <!-- Created timestamp -->
    <div class="list-item-created">
      Created {{ formatDateTime(item.createdAt) }}
      <span class="created-by">
        by
        <img
          v-if="item.createdByPhoto"
          :src="item.createdByPhoto"
          alt=""
          class="created-by__avatar"
          referrerpolicy="no-referrer"
          crossorigin="anonymous"
        />
        {{ item.createdBy ?? 'Anonymous' }}
      </span>
    </div>

    <!-- Actions -->
    <div class="list-item-actions">
      <RouterLink
        :to="editRoute()"
        class="btn-edit"
        :aria-label="`Edit ${item.description}`"
      >
        Edit
      </RouterLink>
      <button
        class="btn-delete"
        :aria-label="`Remove ${item.description}`"
        @click="$emit('delete', item.id)"
      >
        Remove
      </button>
    </div>
  </div>
</template>

<style scoped>
.created-by {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.created-by__avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  vertical-align: middle;
}

.override-amount {
  font-weight: 700;
}

.override-base {
  font-size: 0.8em;
  text-decoration: line-through;
  opacity: 0.6;
  margin-left: 0.25rem;
}

.override-badge {
  background: var(--color-warning-bg);
  color: var(--color-warning);
  font-size: 0.75rem;
}

.approval-badge {
  font-size: 0.75rem;
  font-weight: 600;
}

.approval-badge--pending {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.approval-badge--approved {
  background: var(--color-income-bg);
  color: var(--color-income);
}

.approval-badge--rejected {
  background: var(--color-expense-bg);
  color: var(--color-expense);
}
</style>
