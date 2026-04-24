import type { ExpenseCategory, IncomeCategory } from '@/types/finance'

/**
 * Keyword-to-category mapping for expense auto-categorization.
 * Keys are lowercase keywords/phrases, values are expense categories.
 */
const EXPENSE_KEYWORDS: Record<string, ExpenseCategory> = {
  // Housing
  rent: 'Housing',
  mortgage: 'Housing',
  'property tax': 'Housing',
  hoa: 'Housing',
  'home insurance': 'Housing',
  // Food
  grocery: 'Food',
  groceries: 'Food',
  supermarket: 'Food',
  restaurant: 'Food',
  'uber eats': 'Food',
  doordash: 'Food',
  grubhub: 'Food',
  mcdonald: 'Food',
  starbucks: 'Food',
  chipotle: 'Food',
  walmart: 'Food',
  costco: 'Food',
  'whole foods': 'Food',
  trader: 'Food',
  aldi: 'Food',
  kroger: 'Food',
  publix: 'Food',
  safeway: 'Food',
  target: 'Food',
  // Transport
  gas: 'Transport',
  fuel: 'Transport',
  shell: 'Transport',
  exxon: 'Transport',
  chevron: 'Transport',
  uber: 'Transport',
  lyft: 'Transport',
  parking: 'Transport',
  toll: 'Transport',
  transit: 'Transport',
  metro: 'Transport',
  'car wash': 'Transport',
  'auto repair': 'Transport',
  'car insurance': 'Transport',
  // Utilities
  electric: 'Utilities',
  'power bill': 'Utilities',
  water: 'Utilities',
  internet: 'Utilities',
  comcast: 'Utilities',
  verizon: 'Utilities',
  'at&t': 'Utilities',
  'att': 'Utilities',
  'at & t': 'Utilities',
  't-mobile': 'Utilities',
  tmobile: 'Utilities',
  phone: 'Utilities',
  cellular: 'Utilities',
  xfinity: 'Utilities',
  spectrum: 'Utilities',
  // Entertainment
  netflix: 'Entertainment',
  spotify: 'Entertainment',
  hulu: 'Entertainment',
  disney: 'Entertainment',
  'apple tv': 'Entertainment',
  hbo: 'Entertainment',
  'amazon prime': 'Entertainment',
  cinema: 'Entertainment',
  movie: 'Entertainment',
  theater: 'Entertainment',
  concert: 'Entertainment',
  gaming: 'Entertainment',
  playstation: 'Entertainment',
  xbox: 'Entertainment',
  steam: 'Entertainment',
  // Healthcare
  pharmacy: 'Healthcare',
  doctor: 'Healthcare',
  hospital: 'Healthcare',
  medical: 'Healthcare',
  dental: 'Healthcare',
  dentist: 'Healthcare',
  cvs: 'Healthcare',
  walgreens: 'Healthcare',
  'health insurance': 'Healthcare',
  copay: 'Healthcare',
  prescription: 'Healthcare',
  // Education
  tuition: 'Education',
  school: 'Education',
  college: 'Education',
  university: 'Education',
  textbook: 'Education',
  udemy: 'Education',
  coursera: 'Education',
  // Savings
  transfer: 'Savings',
  'savings deposit': 'Savings',
  '401k': 'Savings',
  ira: 'Savings',
  investment: 'Savings',
}

/**
 * Keyword-to-category mapping for income auto-categorization.
 */
const INCOME_KEYWORDS: Record<string, IncomeCategory> = {
  payroll: 'Salary',
  salary: 'Salary',
  'direct deposit': 'Salary',
  paycheck: 'Salary',
  wages: 'Salary',
  freelance: 'Freelance',
  consulting: 'Freelance',
  contractor: 'Freelance',
  dividend: 'Investment',
  interest: 'Investment',
  'capital gain': 'Investment',
  refund: 'Other',
  rebate: 'Other',
  cashback: 'Other',
  gift: 'Gift',
  venmo: 'Other',
  zelle: 'Other',
}

/**
 * Auto-categorize a transaction description against active categories.
 *
 * @param description - The transaction description text
 * @param isExpense - Whether this is an expense (negative amount) or income
 * @param activeExpenseCategories - Currently active expense category names
 * @param activeIncomeCategories - Currently active income category names
 * @returns The matched category name, or 'Other' if no match
 */
export function autoCategorize(
  description: string,
  isExpense: boolean,
  activeExpenseCategories: string[],
  activeIncomeCategories: string[],
): string {
  const lower = description.toLowerCase()

  if (isExpense) {
    // Check expense keywords
    for (const [keyword, category] of Object.entries(EXPENSE_KEYWORDS)) {
      if (lower.includes(keyword) && activeExpenseCategories.includes(category)) {
        return category
      }
    }
    return 'Other'
  }

  // Check income keywords
  for (const [keyword, category] of Object.entries(INCOME_KEYWORDS)) {
    if (lower.includes(keyword) && activeIncomeCategories.includes(category)) {
      return category
    }
  }
  return 'Other'
}

export { EXPENSE_KEYWORDS, INCOME_KEYWORDS }

