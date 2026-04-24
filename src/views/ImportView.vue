<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useStatementImport } from '@/composables/useStatementImport'
import { useCategoriesStore } from '@/stores/categories'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatCurrency } from '@/lib/formatCurrency'
import PageHeader from '@/components/PageHeader.vue'

const {
  transactions,
  parseErrors,
  fileName,
  imported,
  loadCsv,
  toggleTransaction,
  toggleAll,
  setCategory,
  selectedCount,
  totalCount,
  allSelected,
  importSelected,
  reset,
} = useStatementImport()

const categoriesStore = useCategoriesStore()
const { activeExpenseCategories, activeIncomeCategories } = storeToRefs(categoriesStore)
const snackbar = useSnackbar()

const fileInputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)

function handleFile(file: File) {
  if (!file.name.endsWith('.csv')) {
    snackbar.show('Please upload a CSV file.', { duration: 5000 })
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text) loadCsv(text, file.name)
  }
  reader.readAsText(file)
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleFile(file)
  // Reset so the same file can be re-uploaded
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function doImport() {
  const { incomeCount, expenseCount } = importSelected()
  const parts: string[] = []
  if (incomeCount > 0) parts.push(`${incomeCount} income`)
  if (expenseCount > 0) parts.push(`${expenseCount} expense`)
  snackbar.show(`Imported ${parts.join(' and ')} entries.`, { duration: 8000 })
}
</script>

<template>
  <div class="import">
    <PageHeader title="Import Statement" back-to="/finances" />

    <!-- Upload area -->
    <div v-if="!transactions.length && !imported" class="import__upload-area">
      <div
        class="import__dropzone"
        :class="{ 'import__dropzone--active': dragOver }"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDrop"
        @click="fileInputRef?.click()"
        role="button"
        tabindex="0"
        aria-label="Upload CSV file"
        @keydown.enter="fileInputRef?.click()"
        @keydown.space.prevent="fileInputRef?.click()"
      >
        <font-awesome-icon :icon="['fas', 'file-csv']" class="import__dropzone-icon" />
        <p class="import__dropzone-text">
          Drag &amp; drop a CSV file or <strong>click to browse</strong>
        </p>
        <p class="import__dropzone-hint">
          Supports most bank and credit card statement formats
        </p>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept=".csv"
        class="import__file-input"
        @change="onFileInput"
      />
    </div>

    <!-- Parse errors -->
    <div v-if="parseErrors.length" class="import__errors">
      <h3><font-awesome-icon :icon="['fas', 'triangle-exclamation']" /> Warnings</h3>
      <ul>
        <li v-for="(err, i) in parseErrors" :key="i">{{ err }}</li>
      </ul>
    </div>

    <!-- Import complete -->
    <div v-if="imported" class="import__done">
      <font-awesome-icon :icon="['fas', 'circle-check']" class="import__done-icon" />
      <h2>Import Complete</h2>
      <p>Your transactions from <strong>{{ fileName }}</strong> have been imported.</p>
      <div class="import__done-actions">
        <button class="btn" @click="reset">Import Another</button>
        <RouterLink to="/finances?tab=expenses" class="btn-toggle">View Finances</RouterLink>
      </div>
    </div>

    <!-- Preview table -->
    <div v-if="transactions.length && !imported" class="import__preview">
      <div class="import__preview-header">
        <h2>
          Preview — {{ fileName }}
          <span class="import__count">{{ selectedCount }} / {{ totalCount }} selected</span>
        </h2>
        <div class="import__preview-actions">
          <button class="btn-toggle" @click="reset">
            <font-awesome-icon :icon="['fas', 'xmark']" /> Clear
          </button>
          <button
            class="btn"
            :disabled="selectedCount === 0"
            @click="doImport"
          >
            <font-awesome-icon :icon="['fas', 'file-import']" /> Import {{ selectedCount }} entries
          </button>
        </div>
      </div>

      <div class="import__table-wrap">
        <table class="import__table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  :checked="allSelected"
                  aria-label="Select all"
                  @change="toggleAll(!allSelected)"
                />
              </th>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tx in transactions"
              :key="tx.index"
              :class="{ 'import__row--deselected': !tx.selected }"
            >
              <td>
                <input
                  type="checkbox"
                  :checked="tx.selected"
                  :aria-label="`Select ${tx.description}`"
                  @change="toggleTransaction(tx.index)"
                />
              </td>
              <td>{{ tx.date }}</td>
              <td class="import__cell-desc">{{ tx.description }}</td>
              <td>
                <span
                  class="badge"
                  :class="tx.isExpense ? 'expense-badge' : 'income-badge'"
                >
                  {{ tx.isExpense ? 'Expense' : 'Income' }}
                </span>
              </td>
              <td :class="tx.isExpense ? 'import__cell-expense' : 'import__cell-income'">
                {{ tx.isExpense ? '-' : '+' }}{{ formatCurrency(tx.amount) }}
              </td>
              <td>
                <select
                  class="import__category-select"
                  :value="tx.category"
                  :aria-label="`Category for ${tx.description}`"
                  @change="setCategory(tx.index, ($event.target as HTMLSelectElement).value)"
                >
                  <template v-if="tx.isExpense">
                    <option v-for="cat in activeExpenseCategories" :key="cat" :value="cat">{{ cat }}</option>
                  </template>
                  <template v-else>
                    <option v-for="cat in activeIncomeCategories" :key="cat" :value="cat">{{ cat }}</option>
                  </template>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import {
  max-width: 960px;
  margin: 0 auto;
}

/* ─── Upload area ─── */
.import__upload-area {
  margin-top: 1rem;
}

.import__file-input {
  display: none;
}

.import__dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 2rem;
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.import__dropzone:hover,
.import__dropzone--active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.import__dropzone-icon {
  font-size: 2.5rem;
  color: var(--color-primary);
}

.import__dropzone-text {
  font-size: 1rem;
  color: var(--color-text);
  text-align: center;
}

.import__dropzone-hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-align: center;
}

/* ─── Errors ─── */
.import__errors {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-warning-bg);
  border-radius: 8px;
  color: var(--color-warning);
}

.import__errors h3 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.import__errors ul {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0;
  font-size: 0.85rem;
}

/* ─── Done ─── */
.import__done {
  text-align: center;
  padding: 3rem 1rem;
}

.import__done-icon {
  font-size: 3rem;
  color: var(--color-income);
  margin-bottom: 1rem;
}

.import__done h2 {
  margin-bottom: 0.5rem;
}

.import__done p {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.import__done-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* ─── Preview ─── */
.import__preview {
  margin-top: 1rem;
}

.import__preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.import__preview-header h2 {
  font-size: 1.1rem;
  margin: 0;
}

.import__count {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--color-text-muted);
  margin-left: 0.5rem;
}

.import__preview-actions {
  display: flex;
  gap: 0.5rem;
}

.import__table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: color-mix(in srgb, var(--color-surface) 70%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.import__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.import__table th {
  text-align: left;
  padding: 0.6rem 0.75rem;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
  background: color-mix(in srgb, var(--color-surface) 85%, var(--color-text));
}

.import__table th:first-child {
  border-radius: 12px 0 0 0;
}

.import__table th:last-child {
  border-radius: 0 12px 0 0;
}

.import__table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
  color: var(--color-text);
}

.import__table tbody tr:last-child td {
  border-bottom: none;
}

.import__table tbody tr:hover {
  background: var(--color-icon-bg);
}

.import__row--deselected {
  opacity: 0.45;
}

.import__cell-desc {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.import__cell-expense {
  color: var(--color-expense);
  font-weight: 600;
  white-space: nowrap;
}

.import__cell-income {
  color: var(--color-income);
  font-weight: 600;
  white-space: nowrap;
}

.import__category-select {
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--color-input-bg);
  color: var(--color-input-text);
  min-width: 100px;
}

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .import__preview-header {
    flex-direction: column;
  }

  .import__table {
    font-size: 0.82rem;
  }

  .import__table th,
  .import__table td {
    padding: 0.4rem 0.5rem;
  }

  .import__cell-desc {
    max-width: 150px;
  }
}
</style>

