<script setup lang="ts">
import { formatDate, formatDateTime } from '@/lib/formatDate'
import { formatCurrency } from '@/lib/formatCurrency'
import { getNextDueDate } from '@/lib/dateUtils'
import type { Income, Expense } from '@/types/finance'

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
</script>

<template>
  <div class="list-item">
    <!-- Description + Amount -->
    <div class="list-item-main">
      <strong>{{ item.description }}</strong>
      <span :class="kind === 'income' ? 'income-amount' : 'expense-amount'">
        {{ formatCurrency(item.amount) }}
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
      <span
        v-if="kind === 'expense' && (item as Expense).assignedTo"
        class="created-by"
      >
        by {{ (item as Expense).assignedTo }}
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

