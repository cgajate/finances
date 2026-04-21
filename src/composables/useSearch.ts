import { ref, computed } from 'vue'
import { useFinancesStore } from '@/stores/finances'
import type { Income, Expense } from '@/types/finance'

export type SearchResultKind = 'income' | 'expense'

export interface SearchResult {
  kind: SearchResultKind
  id: string
  description: string
  amount: number
  category: string
  /** The original item */
  item: Income | Expense
}

function matchesQuery(query: string, ...fields: (string | number | null | undefined)[]): boolean {
  const q = query.toLowerCase()
  return fields.some((f) => {
    if (f == null) return false
    return String(f).toLowerCase().includes(q)
  })
}

export function useSearch() {
  const query = ref('')

  const financesStore = useFinancesStore()

  const results = computed<SearchResult[]>(() => {
    const q = query.value.trim()
    if (!q) return []

    const out: SearchResult[] = []

    for (const income of financesStore.incomes) {
      const notes = income.type === 'recurring' ? income.notes : ''
      const freq = income.type === 'recurring' ? income.frequency : 'one-time'
      const date = income.type === 'recurring' ? income.date : income.date
      if (
        matchesQuery(
          q,
          income.description,
          String(income.amount),
          income.category,
          income.type,
          notes,
          freq,
          date,
        )
      ) {
        out.push({
          kind: 'income',
          id: income.id,
          description: income.description,
          amount: income.amount,
          category: income.category ?? 'Other',
          item: income,
        })
      }
    }

    for (const expense of financesStore.expenses) {
      const notes = expense.notes
      const freq = expense.type === 'recurring' ? expense.frequency : 'one-time'
      if (
        matchesQuery(
          q,
          expense.description,
          String(expense.amount),
          expense.category,
          expense.type,
          notes,
          freq,
          expense.dueDate,
          expense.assignedTo,
        )
      ) {
        out.push({
          kind: 'expense',
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category ?? 'Other',
          item: expense,
        })
      }
    }

    return out
  })

  const resultCount = computed(() => results.value.length)

  function clearSearch() {
    query.value = ''
  }

  return { query, results, resultCount, clearSearch }
}

