import { useFinancesStore } from '@/stores/finances'
import { useSavingsGoalsStore } from '@/stores/savingsGoals'
import { useSnackbar } from '@/composables/useSnackbar'

/**
 * Provides delete-with-undo helpers for income and expense items.
 * Captures a snapshot before removal and offers an undo callback
 * that re-adds the item via the appropriate store method.
 */
export function useDeleteWithUndo() {
  const store = useFinancesStore()
  const snackbar = useSnackbar()

  function deleteIncome(id: string) {
    const item = store.getIncomeById(id)
    if (!item) return
    const snapshot = { ...item }
    store.removeIncome(id)
    snackbar.show(`Deleted "${snapshot.description}"`, () => {
      if (snapshot.type === 'recurring') {
        store.addRecurringIncome({
          amount: snapshot.amount,
          frequency: snapshot.frequency,
          description: snapshot.description,
          notes: snapshot.notes,
          date: snapshot.date,
          category: snapshot.category,
        })
      } else {
        store.addAdhocIncome({
          amount: snapshot.amount,
          description: snapshot.description,
          date: snapshot.date,
          category: snapshot.category,
        })
      }
    })
  }

  function deleteExpense(id: string) {
    const item = store.getExpenseById(id)
    if (!item) return
    const snapshot = { ...item }
    store.removeExpense(id)
    snackbar.show(`Deleted "${snapshot.description}"`, () => {
      if (snapshot.type === 'recurring') {
        store.addRecurringExpense({
          amount: snapshot.amount,
          frequency: snapshot.frequency,
          description: snapshot.description,
          notes: snapshot.notes,
          dueDate: snapshot.dueDate,
          category: snapshot.category,
          assignedTo: snapshot.assignedTo,
        })
      } else {
        store.addAdhocExpense({
          amount: snapshot.amount,
          description: snapshot.description,
          notes: snapshot.notes,
          dueDate: snapshot.dueDate,
          category: snapshot.category,
          assignedTo: snapshot.assignedTo,
        })
      }
    })
  }

  function deleteSavingsGoal(id: string) {
    const savingsStore = useSavingsGoalsStore()
    const goal = savingsStore.goals.find((g: { id: string }) => g.id === id)
    if (!goal) return
    const snapshot = { ...goal }
    savingsStore.removeGoal(id)
    snackbar.show(`Deleted "${snapshot.name}"`, () => {
      savingsStore.addGoal({
        name: snapshot.name,
        targetAmount: snapshot.targetAmount,
        deadline: snapshot.deadline,
        savedAmount: snapshot.savedAmount,
      })
    })
  }

  return { deleteIncome, deleteExpense, deleteSavingsGoal }
}

