import { ref, watch, type Ref } from 'vue'

/**
 * Composable for currency input fields.
 * - Displays with $ prefix and comma separators
 * - On blur/submit, ensures 2 decimal places
 * - Returns the raw numeric value for binding to the store
 */
export function useCurrencyInput(initialValue: Ref<number | null>) {
  const display = ref(initialValue.value ? formatForDisplay(initialValue.value) : '')

  function formatForDisplay(value: number): string {
    const parts = value.toFixed(2).split('.')
    const intPart = parts[0] ?? '0'
    const decPart = parts[1] ?? '00'
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return `$${withCommas}.${decPart}`
  }

  function parseRaw(input: string): number {
    const cleaned = input.replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }

  function onInput(event: Event) {
    const target = event.target as HTMLInputElement
    let raw = target.value

    // Strip everything except digits, dots, and leading $
    const cleaned = raw.replace(/[^0-9.]/g, '')

    // Prevent multiple dots
    const dotIndex = cleaned.indexOf('.')
    let sanitized = cleaned
    if (dotIndex !== -1) {
      sanitized = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '')
      // Limit to 2 decimal places while typing
      const afterDot = sanitized.slice(dotIndex + 1)
      if (afterDot.length > 2) {
        sanitized = sanitized.slice(0, dotIndex + 3)
      }
    }

    // Add commas to integer part
    const parts = sanitized.split('.')
    const intPart = (parts[0] ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const decPart = parts[1]

    display.value = '$' + intPart + (decPart !== undefined ? '.' + decPart : '')
    initialValue.value = parseRaw(sanitized)
  }

  function onBlur() {
    if (!display.value || display.value === '$') {
      display.value = ''
      initialValue.value = null
      return
    }
    const num = parseRaw(display.value)
    if (num === 0) {
      display.value = ''
      initialValue.value = null
      return
    }
    display.value = formatForDisplay(num)
    initialValue.value = num
  }

  function onFocus(event: Event) {
    const target = event.target as HTMLInputElement
    // Select all on focus for easy replacement
    setTimeout(() => target.select(), 0)
  }

  function reset() {
    display.value = ''
    initialValue.value = null
  }

  function setFromValue(value: number) {
    display.value = formatForDisplay(value)
    initialValue.value = value
  }

  // Sync if external value changes (e.g. edit mode population)
  watch(initialValue, (val) => {
    if (val === null) {
      display.value = ''
    }
  })

  return {
    display,
    onInput,
    onBlur,
    onFocus,
    reset,
    setFromValue,
  }
}

