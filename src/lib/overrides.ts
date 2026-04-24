import type { MonthlyOverrides } from '@/types/finance'

/**
 * Returns the effective amount for a recurring item in a given month.
 * If an override exists for the month, returns the override; otherwise the base amount.
 *
 * @param baseAmount - The default recurring amount
 * @param overrides - Optional map of YYYY-MM → adjusted amount
 * @param month - The target month in YYYY-MM format
 */
export function getEffectiveAmount(
  baseAmount: number,
  overrides: MonthlyOverrides | undefined,
  month: string,
): number {
  const override = overrides?.[month]
  return override !== undefined ? override : baseAmount
}

