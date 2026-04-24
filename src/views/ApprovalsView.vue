<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApprovalsStore } from '@/stores/approvals'
import { useAuth } from '@/composables/useAuth'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import EmptyState from '@/components/EmptyState.vue'
import CurrencyInput from '@/components/CurrencyInput.vue'

const store = useApprovalsStore()
const { userId } = useAuth()

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

function handleApprove(id: string) {
  store.approveRequest(id, userId.value || 'me')
}

function handleReject(id: string) {
  store.rejectRequest(id, userId.value || 'me')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="approvals">
    <div class="approvals__header">
      <h1>Approvals</h1>
      <div class="approvals__settings">
        <label class="approvals__toggle">
          <input
            type="checkbox"
            :checked="store.approvalEnabled"
            @change="store.setEnabled(($event.target as HTMLInputElement).checked)"
          />
          <span>Require Approval</span>
        </label>
        <div v-if="store.approvalEnabled" class="field approvals__threshold-field">
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

      <!-- Table layout -->
      <div v-else class="approvals__table-wrap">
        <table class="approvals__table">
          <thead>
            <tr>
              <th>Expense</th>
              <th>Amount</th>
              <th>Submitted by</th>
              <th>Date &amp; Time</th>
              <template v-if="activeTab === 'pending'">
                <th class="approvals__th-actions">Actions</th>
              </template>
              <template v-else>
                <th>{{ activeTab === 'approved' ? 'Approved' : 'Rejected' }} by</th>
                <th>Resolved</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in filteredRequests" :key="req.id">
              <td class="approvals__cell-desc">{{ req.description }}</td>
              <td class="approvals__cell-amount">{{ formatCurrency(req.amount) }}</td>
              <td>{{ req.requestedBy }}</td>
              <td>
                <time :datetime="req.createdAt">{{ formatTimestamp(req.createdAt) }}</time>
              </td>
              <template v-if="activeTab === 'pending'">
                <td class="approvals__cell-actions">
                  <button
                    class="approvals__action-btn approvals__action-btn--approve"
                    aria-label="Approve request"
                    @click="handleApprove(req.id)"
                  >
                    <font-awesome-icon :icon="['fas', 'circle-check']" />
                  </button>
                  <button
                    class="approvals__action-btn approvals__action-btn--reject"
                    aria-label="Reject request"
                    @click="handleReject(req.id)"
                  >
                    <font-awesome-icon :icon="['fas', 'circle-xmark']" />
                  </button>
                </td>
              </template>
              <template v-else>
                <td>{{ req.reviewedBy ?? '—' }}</td>
                <td>
                  <time v-if="req.resolvedAt" :datetime="req.resolvedAt">{{ formatTimestamp(req.resolvedAt) }}</time>
                  <span v-else>—</span>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.approvals {
  max-width: 900px;
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

.approvals__threshold-field {
  min-width: 8rem;
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

/* ─── Table ─── */
.approvals__table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: color-mix(in srgb, var(--color-surface) 70%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.approvals__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.approvals__table th {
  text-align: left;
  padding: 0.6rem 0.75rem;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
  background: color-mix(in srgb, var(--color-surface) 85%, var(--color-text));
}

.approvals__table th:first-child {
  border-radius: 12px 0 0 0;
}

.approvals__table th:last-child {
  border-radius: 0 12px 0 0;
}

.approvals__table td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
  color: var(--color-text);
}

.approvals__table tbody tr:last-child td {
  border-bottom: none;
}

.approvals__table tbody tr:hover {
  background: var(--color-icon-bg);
}

.approvals__cell-desc {
  font-weight: 600;
}

.approvals__cell-amount {
  font-weight: 700;
  color: var(--color-expense);
  white-space: nowrap;
}

.approvals__table th.approvals__th-actions {
  text-align: right;
}

.approvals__cell-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  text-align: right;
}

.approvals__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  transition: transform 0.1s, filter 0.15s;
  background: none;
}

.approvals__action-btn:hover {
  transform: scale(1.15);
}

.approvals__action-btn--approve {
  color: var(--color-income);
}

.approvals__action-btn--approve:hover {
  filter: brightness(0.85);
}

.approvals__action-btn--reject {
  color: var(--color-expense);
}

.approvals__action-btn--reject:hover {
  filter: brightness(0.85);
}

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .approvals__header {
    flex-direction: column;
  }

  .approvals__table {
    font-size: 0.82rem;
  }

  .approvals__table th,
  .approvals__table td {
    padding: 0.5rem 0.5rem;
  }
}
</style>

