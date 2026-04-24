<script setup lang="ts">
import { ref } from 'vue'
import { useNetWorthStore } from '@/stores/netWorth'
import { formatCurrency } from '@/lib/formatCurrency'
import CurrencyInput from '@/components/CurrencyInput.vue'
import type { NetWorthEntryKind } from '@/types/finance'

const store = useNetWorthStore()

const showForm = ref(false)
const formKind = ref<NetWorthEntryKind>('asset')
const formName = ref('')
const formAmount = ref<number | null>(null)

function addEntry() {
  if (!formName.value.trim() || !formAmount.value || formAmount.value <= 0) return
  store.addEntry({
    kind: formKind.value,
    name: formName.value.trim(),
    amount: formAmount.value,
  })
  formName.value = ''
  formAmount.value = null
  showForm.value = false
}

function removeEntry(id: string) {
  store.removeEntry(id)
}
</script>

<template>
  <section class="net-worth-widget">
    <h2><font-awesome-icon :icon="['fas', 'scale-balanced']" /> Net Worth</h2>

    <!-- Summary -->
    <div class="net-worth-widget__summary">
      <div class="net-worth-widget__row">
        <span class="net-worth-widget__label">
          <font-awesome-icon :icon="['fas', 'landmark']" /> Total Assets
        </span>
        <span class="net-worth-widget__value net-worth-widget__value--asset">
          {{ formatCurrency(store.totalAssets) }}
        </span>
      </div>
      <div class="net-worth-widget__row">
        <span class="net-worth-widget__label">
          <font-awesome-icon :icon="['fas', 'credit-card']" /> Total Liabilities
        </span>
        <span class="net-worth-widget__value net-worth-widget__value--liability">
          {{ formatCurrency(store.totalLiabilities) }}
        </span>
      </div>
      <div class="net-worth-widget__divider"></div>
      <div class="net-worth-widget__row net-worth-widget__row--total">
        <span class="net-worth-widget__label">Net Worth</span>
        <span
          class="net-worth-widget__value"
          :class="store.netWorth >= 0 ? 'net-worth-widget__value--positive' : 'net-worth-widget__value--negative'"
        >
          {{ formatCurrency(store.netWorth) }}
        </span>
      </div>
    </div>

    <!-- Savings included note -->
    <p v-if="store.savingsTotal > 0" class="net-worth-widget__note">
      Includes {{ formatCurrency(store.savingsTotal) }} from savings goals.
    </p>

    <!-- Assets list -->
    <div v-if="store.assets.length" class="net-worth-widget__list">
      <h3>Assets</h3>
      <ul>
        <li v-for="entry in store.assets" :key="entry.id">
          <span class="net-worth-widget__entry-name">{{ entry.name }}</span>
          <span class="net-worth-widget__entry-amount net-worth-widget__value--asset">
            {{ formatCurrency(entry.amount) }}
          </span>
          <button
            class="btn-remove"
            :aria-label="`Remove ${entry.name}`"
            @click="removeEntry(entry.id)"
          >
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>
        </li>
      </ul>
    </div>

    <!-- Liabilities list -->
    <div v-if="store.liabilities.length" class="net-worth-widget__list">
      <h3>Liabilities</h3>
      <ul>
        <li v-for="entry in store.liabilities" :key="entry.id">
          <span class="net-worth-widget__entry-name">{{ entry.name }}</span>
          <span class="net-worth-widget__entry-amount net-worth-widget__value--liability">
            {{ formatCurrency(entry.amount) }}
          </span>
          <button
            class="btn-remove"
            :aria-label="`Remove ${entry.name}`"
            @click="removeEntry(entry.id)"
          >
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>
        </li>
      </ul>
    </div>

    <!-- Add entry -->
    <button
      v-if="!showForm"
      class="btn net-worth-widget__add-btn"
      @click="showForm = true"
    >
      <font-awesome-icon :icon="['fas', 'plus']" /> Add Asset or Liability
    </button>

    <div v-if="showForm" class="net-worth-widget__form form-row">
      <div class="field net-worth-widget__field">
        <label for="nw-kind">Type</label>
        <select id="nw-kind" v-model="formKind">
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
        </select>
      </div>
      <div class="field net-worth-widget__field">
        <label for="nw-name">Name</label>
        <input
          id="nw-name"
          v-model="formName"
          type="text"
          placeholder="e.g. Home equity, Car loan"
        />
      </div>
      <div class="field net-worth-widget__field">
        <label for="nw-amount">Amount</label>
        <CurrencyInput
          id="nw-amount"
          v-model="formAmount"
        />
      </div>
      <button
        type="button"
        class="btn-fund"
        :disabled="!formName.trim() || !formAmount || formAmount <= 0"
        @click="addEntry"
      >
        <font-awesome-icon :icon="['fas', 'plus']" aria-hidden="true" />
        Add
      </button>
    </div>
    <button
      v-if="showForm"
      type="button"
      class="btn-cancel-sm net-worth-widget__cancel"
      @click="showForm = false"
    >
      Cancel
    </button>
  </section>
</template>

<style scoped>
.net-worth-widget {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: var(--color-bg-secondary);
}

.net-worth-widget h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.net-worth-widget h3 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.net-worth-widget__summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.net-worth-widget__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.net-worth-widget__row--total {
  font-weight: 700;
  font-size: 1.1rem;
}

.net-worth-widget__label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text);
}

.net-worth-widget__value {
  font-weight: 600;
}

.net-worth-widget__value--asset {
  color: var(--color-income);
}

.net-worth-widget__value--liability {
  color: var(--color-expense);
}

.net-worth-widget__value--positive {
  color: var(--color-income);
}

.net-worth-widget__value--negative {
  color: var(--color-expense);
}

.net-worth-widget__divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.25rem 0;
}

.net-worth-widget__note {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 0 0 1rem;
}

.net-worth-widget__list {
  margin-bottom: 1rem;
}

.net-worth-widget__list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.net-worth-widget__list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  border-bottom: none;
}

.net-worth-widget__entry-name {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text);
}

.net-worth-widget__entry-amount {
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}

.net-worth-widget__add-btn {
  margin-top: 0.5rem;
}

.net-worth-widget__field {
  flex: 1;
  min-width: 0;
}

.net-worth-widget__cancel {
  margin-top: 0.25rem;
}

@media (max-width: 480px) {
  .net-worth-widget__form {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

