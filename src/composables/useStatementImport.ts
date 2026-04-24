import { ref, computed } from 'vue'
import { parseCsv, type CsvRow } from '@/lib/csvParser'
import { autoCategorize } from '@/lib/autoCategorize'
import { useCategoriesStore } from '@/stores/categories'
import { useFinancesStore } from '@/stores/finances'
import { useAuth } from '@/composables/useAuth'
import type { ExpenseCategory, IncomeCategory } from '@/types/finance'

/** A parsed transaction ready for preview and import */
export interface ImportTransaction {
  /** Unique index for keying */
  index: number
  date: string
  description: string
  amount: number
  /** Whether this is an expense (amount < 0) or income */
  isExpense: boolean
  /** Auto-detected or user-overridden category */
  category: string
  /** Whether the user has selected this for import */
  selected: boolean
}

/**
 * Composable for handling bank statement CSV import.
 * Orchestrates parsing, auto-categorization, preview, and import.
 */
export function useStatementImport() {
  const categoriesStore = useCategoriesStore()
  const financesStore = useFinancesStore()
  const { userId } = useAuth()

  const transactions = ref<ImportTransaction[]>([])
  const parseErrors = ref<string[]>([])
  const fileName = ref('')
  const imported = ref(false)

  /** Parse a CSV file text and populate the transactions list */
  function loadCsv(text: string, name: string) {
    imported.value = false
    fileName.value = name
    const { rows, errors } = parseCsv(text)
    parseErrors.value = errors

    transactions.value = rows.map((row, i) => {
      const isExpense = row.amount < 0
      const category = autoCategorize(
        row.description,
        isExpense,
        categoriesStore.activeExpenseCategories,
        categoriesStore.activeIncomeCategories,
      )
      return {
        index: i,
        date: row.date,
        description: row.description,
        amount: Math.abs(row.amount),
        isExpense,
        category,
        selected: true,
      }
    })
  }

  /** Toggle selection of a single transaction */
  function toggleTransaction(index: number) {
    const tx = transactions.value.find((t) => t.index === index)
    if (tx) tx.selected = !tx.selected
  }

  /** Select or deselect all transactions */
  function toggleAll(selected: boolean) {
    for (const tx of transactions.value) {
      tx.selected = selected
    }
  }

  /** Update the category for a specific transaction */
  function setCategory(index: number, category: string) {
    const tx = transactions.value.find((t) => t.index === index)
    if (tx) tx.category = category
  }

  /** Transactions selected for import */
  const selectedTransactions = computed(() =>
    transactions.value.filter((t) => t.selected),
  )

  const selectedCount = computed(() => selectedTransactions.value.length)
  const totalCount = computed(() => transactions.value.length)

  const allSelected = computed(() =>
    transactions.value.length > 0 && transactions.value.every((t) => t.selected),
  )

  /** Import all selected transactions into the finances store */
  function importSelected(): { incomeCount: number; expenseCount: number } {
    let incomeCount = 0
    let expenseCount = 0
    const uid = userId.value || 'anonymous'

    for (const tx of selectedTransactions.value) {
      if (tx.isExpense) {
        financesStore.addAdhocExpense({
          amount: tx.amount,
          description: tx.description,
          notes: `Imported from ${fileName.value}`,
          dueDate: tx.date,
          category: tx.category as ExpenseCategory,
        }, uid)
        expenseCount++
      } else {
        financesStore.addAdhocIncome({
          amount: tx.amount,
          description: tx.description,
          date: tx.date,
          category: tx.category as IncomeCategory,
        }, uid)
        incomeCount++
      }
    }

    imported.value = true
    return { incomeCount, expenseCount }
  }

  /** Clear all state and start over */
  function reset() {
    transactions.value = []
    parseErrors.value = []
    fileName.value = ''
    imported.value = false
  }

  return {
    transactions,
    parseErrors,
    fileName,
    imported,
    loadCsv,
    toggleTransaction,
    toggleAll,
    setCategory,
    selectedTransactions,
    selectedCount,
    totalCount,
    allSelected,
    importSelected,
    reset,
  }
}

