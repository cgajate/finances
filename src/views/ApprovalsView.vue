<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApprovalsStore } from '@/stores/approvals'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import EmptyState from '@/components/EmptyState.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'

const store = useApprovalsStore()
const reviewerId = ref('me')

const tabs = ['pending', 'approved', 'rejected'] as const
type Tab = (typeof tabs)[number]
const activeTab = ref<Tab>('pending')

const filteredRequests = computed(() =>
  store.requests.filter((r) => r.status === activeTab.value),
)

const hasRequests = computed(() => store.requests.length > 0)

const statusIcon: Record<string, string> = {
  pending: 'clock',
  approved: 'circle-check',
  rejected: 'xmark',
}

const statusClass: Record<string, string> = {
  pending: 'badge--warning',
  approved: 'badge--success',
  rejected: 'badge--danger',
}

function handleApprove(id: string) {
  store.approveRequest(id, reviewerId.value)
}

function handleReject(id: string) {
  store.rejectRequest(id, reviewerId.value)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
</script>

<template>
  <div class="approvals">
    <div class="approvals__header">
      <h1>
        <font-awesome-icon :icon="['fas', 'clipboard-check']" aria-hidden="true" />
        Approvals
      </h1>
      <div class="approvals__settings">
        <label class="approvals__toggle">
          <input
            type="checkbox"
            :checked="store.approvalEnabled"
            @change="store.setEnabled(($event.target as HTMLInputElement).checked)"
          />
          <span>Require Approval</span>
        </label>
        <div v-if="store.approvalEnabled" class="approvals__threshold">
          <label for="threshold-input">Threshold</label>
          <CurrencyInput
            id="threshold-input"
            :model-value="store.approvalThreshold"
            @update:model-value="$event != null && store.setThreshold($event)"
          />
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="approvals__tabs" role="tablist" aria-label="Approval status tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        role="tab"
        :aria-selected="activeTab === tab"
        :aria-controls="`panel-${tab}`"
        class="approvals__tab"
        :class="{ 'approvals__tab--active': activeTab === tab }"
        @click="activeTab = tab"
      >
        <font-awesome-icon :icon="['fas', statusIcon[tab] ?? 'circle']" aria-hidden="true" />
        {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        <span v-if="tab === 'pending' && store.pendingCount > 0" class="approvals__count">
          {{ store.pendingCount }}
        </span>
      </button>
    </div>

    <!-- Panel -->
    <div
      :id="`panel-${activeTab}`"
      role="tabpanel"
      :aria-label="`${activeTab} requests`"
    >
      <EmptyState
        v-if="!hasRequests"
        message="No approval requests yet. Expenses above the threshold will appear here for review."
      />
      <EmptyState
        v-else-if="filteredRequests.length === 0"
        :message="`No ${activeTab} requests.`"
      />

      <ul v-else class="approvals__list">
        <li
          v-for="req in filteredRequests"
          :key="req.id"
          class="approvals__item card"
        >
          <div class="approvals__item-main">
            <div class="approvals__item-top">
              <span class="approvals__description">{{ req.description }}</span>
              <span class="approvals__amount">{{ formatCurrency(req.amount) }}</span>
            </div>
            <div class="approvals__item-meta">
              <span class="badge" :class="statusClass[req.status]">
                <font-awesome-icon :icon="['fas', statusIcon[req.status] ?? 'circle']" aria-hidden="true" />
                {{ req.status }}
              </span>
              <span class="approvals__by">by {{ req.requestedBy }}</span>
              <time :datetime="req.createdAt">{{ formatRelativeTime(req.createdAt) }}</time>
              <template v-if="req.resolvedAt">
                <span class="approvals__dot">·</span>
                <span>Reviewed by {{ req.reviewedBy }}</span>
              </template>
            </div>
          </div>
          <div v-if="req.status === 'pending'" class="approvals__actions">
            <button
              class="btn btn--success btn--sm"
              aria-label="Approve request"
              @click="handleApprove(req.id)"
            >
              <font-awesome-icon :icon="['fas', 'check']" aria-hidden="true" />
              Approve
            </button>
            <button
              class="btn btn--danger btn--sm"
              aria-label="Reject request"
              @click="handleReject(req.id)"
            >
              <font-awesome-icon :icon="['fas', 'xmark']" aria-hidden="true" />
              Reject
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.approvals {
  max-width: 750px;
  margin: 0 auto;
}

.approvals__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.approvals__header h1 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.approvals__settings {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.approvals__toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.approvals__threshold {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
}

.approvals__threshold label {
  white-space: nowrap;
  font-weight: 500;
}

/* ─── Tabs ─── */
.approvals__tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 0;
}

.approvals__tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
  min-height: 2.5rem;
}

.approvals__tab:hover {
  color: var(--color-primary-text);
}

.approvals__tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.approvals__count {
  background: var(--color-primary);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
  min-width: 1.2rem;
  text-align: center;
}

/* ─── List ─── */
.approvals__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.approvals__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.approvals__item-main {
  flex: 1;
  min-width: 0;
}

.approvals__item-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}

.approvals__description {
  font-weight: 600;
  font-size: 0.95rem;
}

.approvals__amount {
  font-weight: 700;
  font-size: 1rem;
  white-space: nowrap;
  color: var(--color-expense);
}

.approvals__item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.approvals__by {
  font-weight: 500;
}

.approvals__dot {
  color: var(--color-border);
}

.approvals__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* ─── Badges ─── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.badge--warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.badge--success {
  background: var(--color-income-bg);
  color: var(--color-income);
}

.badge--danger {
  background: var(--color-expense-bg);
  color: var(--color-expense);
}

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .approvals__header {
    flex-direction: column;
  }

  .approvals__item {
    flex-direction: column;
    align-items: flex-start;
  }

  .approvals__actions {
    width: 100%;
  }

  .approvals__actions .btn {
    flex: 1;
  }
}
</style>

