import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStatementImport } from '@/composables/useStatementImport'
import { useFinancesStore } from '@/stores/finances'

const SAMPLE_CSV = `Date,Description,Amount
04/15/2026,STARBUCKS COFFEE,-5.95
04/15/2026,PAYROLL DIRECT DEPOSIT,3000.00
04/16/2026,NETFLIX.COM,-15.99
04/16/2026,SHELL GAS,-45.00
04/17/2026,UNKNOWN VENDOR,-20.00`

describe('useStatementImport', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with empty state', () => {
    const { transactions, parseErrors, fileName, imported } = useStatementImport()
    expect(transactions.value).toEqual([])
    expect(parseErrors.value).toEqual([])
    expect(fileName.value).toBe('')
    expect(imported.value).toBe(false)
  })

  it('loadCsv parses transactions', () => {
    const { loadCsv, transactions } = useStatementImport()
    loadCsv(SAMPLE_CSV, 'statement.csv')
    expect(transactions.value).toHaveLength(5)
    expect(transactions.value[0]!.description).toBe('STARBUCKS COFFEE')
    expect(transactions.value[0]!.amount).toBe(5.95)
    expect(transactions.value[0]!.isExpense).toBe(true)
    expect(transactions.value[1]!.isExpense).toBe(false)
    expect(transactions.value[1]!.amount).toBe(3000)
  })

  it('loadCsv sets fileName', () => {
    const { loadCsv, fileName } = useStatementImport()
    loadCsv(SAMPLE_CSV, 'bank.csv')
    expect(fileName.value).toBe('bank.csv')
  })

  it('auto-categorizes known transactions', () => {
    const { loadCsv, transactions } = useStatementImport()
    loadCsv(SAMPLE_CSV, 'test.csv')
    // Starbucks → Food
    expect(transactions.value[0]!.category).toBe('Food')
    // Payroll → Salary
    expect(transactions.value[1]!.category).toBe('Salary')
    // Netflix → Entertainment
    expect(transactions.value[2]!.category).toBe('Entertainment')
    // Shell Gas → Transport
    expect(transactions.value[3]!.category).toBe('Transport')
    // Unknown → Other
    expect(transactions.value[4]!.category).toBe('Other')
  })

  it('all transactions are selected by default', () => {
    const { loadCsv, transactions, allSelected, selectedCount, totalCount } = useStatementImport()
    loadCsv(SAMPLE_CSV, 'test.csv')
    expect(allSelected.value).toBe(true)
    expect(selectedCount.value).toBe(5)
    expect(totalCount.value).toBe(5)
  })

  it('toggleTransaction deselects and reselects', () => {
    const { loadCsv, transactions, toggleTransaction, selectedCount } = useStatementImport()
    loadCsv(SAMPLE_CSV, 'test.csv')
    toggleTransaction(0)
    expect(transactions.value[0]!.selected).toBe(false)
    expect(selectedCount.value).toBe(4)
    toggleTransaction(0)
    expect(transactions.value[0]!.selected).toBe(true)
    expect(selectedCount.value).toBe(5)
  })

  it('toggleAll selects/deselects all', () => {
    const { loadCsv, toggleAll, allSelected, selectedCount } = useStatementImport()
    loadCsv(SAMPLE_CSV, 'test.csv')
    toggleAll(false)
    expect(allSelected.value).toBe(false)
    expect(selectedCount.value).toBe(0)
    toggleAll(true)
    expect(allSelected.value).toBe(true)
    expect(selectedCount.value).toBe(5)
  })

  it('setCategory overrides auto-categorization', () => {
    const { loadCsv, transactions, setCategory } = useStatementImport()
    loadCsv(SAMPLE_CSV, 'test.csv')
    expect(transactions.value[4]!.category).toBe('Other')
    setCategory(4, 'Entertainment')
    expect(transactions.value[4]!.category).toBe('Entertainment')
  })

  it('importSelected creates income and expense entries', () => {
    const { loadCsv, importSelected, imported } = useStatementImport()
    const financesStore = useFinancesStore()
    loadCsv(SAMPLE_CSV, 'test.csv')

    const { incomeCount, expenseCount } = importSelected()
    expect(incomeCount).toBe(1) // payroll
    expect(expenseCount).toBe(4) // starbucks, netflix, shell, unknown
    expect(imported.value).toBe(true)
    expect(financesStore.incomes).toHaveLength(1)
    expect(financesStore.expenses).toHaveLength(4)
  })

  it('importSelected only imports selected transactions', () => {
    const { loadCsv, toggleTransaction, importSelected } = useStatementImport()
    const financesStore = useFinancesStore()
    loadCsv(SAMPLE_CSV, 'test.csv')
    toggleTransaction(0) // deselect starbucks
    toggleTransaction(1) // deselect payroll

    const { incomeCount, expenseCount } = importSelected()
    expect(incomeCount).toBe(0)
    expect(expenseCount).toBe(3)
    expect(financesStore.incomes).toHaveLength(0)
    expect(financesStore.expenses).toHaveLength(3)
  })

  it('imported expenses have correct data', () => {
    const { loadCsv, importSelected } = useStatementImport()
    const financesStore = useFinancesStore()
    loadCsv(SAMPLE_CSV, 'test.csv')
    importSelected()

    const exp = financesStore.expenses[0]!
    expect(exp.type).toBe('adhoc')
    expect(exp.description).toBe('STARBUCKS COFFEE')
    expect(exp.amount).toBe(5.95)
    expect(exp.dueDate).toBe('2026-04-15')
    expect(exp.category).toBe('Food')
    expect(exp.notes).toContain('Imported from')
  })

  it('imported income has correct data', () => {
    const { loadCsv, importSelected } = useStatementImport()
    const financesStore = useFinancesStore()
    loadCsv(SAMPLE_CSV, 'test.csv')
    importSelected()

    const inc = financesStore.incomes[0]!
    expect(inc.type).toBe('adhoc')
    expect(inc.description).toBe('PAYROLL DIRECT DEPOSIT')
    expect(inc.amount).toBe(3000)
    if (inc.type === 'adhoc') {
      expect(inc.date).toBe('2026-04-15')
    }
  })

  it('reset clears all state', () => {
    const { loadCsv, reset, transactions, parseErrors, fileName, imported } = useStatementImport()
    loadCsv(SAMPLE_CSV, 'test.csv')
    expect(transactions.value.length).toBeGreaterThan(0)
    reset()
    expect(transactions.value).toEqual([])
    expect(parseErrors.value).toEqual([])
    expect(fileName.value).toBe('')
    expect(imported.value).toBe(false)
  })

  it('loadCsv resets imported flag', () => {
    const { loadCsv, importSelected, imported } = useStatementImport()
    loadCsv(SAMPLE_CSV, 'test.csv')
    importSelected()
    expect(imported.value).toBe(true)
    loadCsv(SAMPLE_CSV, 'another.csv')
    expect(imported.value).toBe(false)
  })

  it('handles parse errors from malformed CSV', () => {
    const { loadCsv, parseErrors } = useStatementImport()
    loadCsv('Date,Description,Amount\n04/15/2026,BAD,abc', 'bad.csv')
    expect(parseErrors.value.length).toBeGreaterThan(0)
  })

  it('selectedTransactions returns only selected', () => {
    const { loadCsv, toggleTransaction, selectedTransactions } = useStatementImport()
    loadCsv(SAMPLE_CSV, 'test.csv')
    toggleTransaction(0)
    toggleTransaction(2)
    expect(selectedTransactions.value).toHaveLength(3)
    expect(selectedTransactions.value.every((t) => t.selected)).toBe(true)
  })
})

