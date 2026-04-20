import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useCurrencyInput } from '@/composables/useCurrencyInput'

function makeInputEvent(value: string): Event {
  const event = new Event('input')
  Object.defineProperty(event, 'target', {
    value: { value, select: vi.fn() },
    writable: false,
  })
  return event
}

function makeFocusEvent(): Event {
  const event = new Event('focus')
  Object.defineProperty(event, 'target', {
    value: { select: vi.fn() },
    writable: false,
  })
  return event
}

describe('useCurrencyInput', () => {
  it('initializes with empty display when value is null', () => {
    const val = ref<number | null>(null)
    const { display } = useCurrencyInput(val)
    expect(display.value).toBe('')
  })

  it('initializes with formatted display when value is set', () => {
    const val = ref<number | null>(1234.56)
    const { display } = useCurrencyInput(val)
    expect(display.value).toBe('$1,234.56')
  })

  it('formats large numbers with commas', () => {
    const val = ref<number | null>(1000000)
    const { display } = useCurrencyInput(val)
    expect(display.value).toBe('$1,000,000.00')
  })

  describe('onInput', () => {
    it('formats input with $ and commas', () => {
      const val = ref<number | null>(null)
      const { display, onInput } = useCurrencyInput(val)
      onInput(makeInputEvent('1234'))
      expect(display.value).toBe('$1,234')
      expect(val.value).toBe(1234)
    })

    it('handles decimal input', () => {
      const val = ref<number | null>(null)
      const { display, onInput } = useCurrencyInput(val)
      onInput(makeInputEvent('99.99'))
      expect(display.value).toBe('$99.99')
      expect(val.value).toBe(99.99)
    })

    it('limits to 2 decimal places', () => {
      const val = ref<number | null>(null)
      const { display, onInput } = useCurrencyInput(val)
      onInput(makeInputEvent('12.345'))
      expect(display.value).toBe('$12.34')
    })

    it('strips non-numeric characters', () => {
      const val = ref<number | null>(null)
      const { display, onInput } = useCurrencyInput(val)
      onInput(makeInputEvent('$1,234.56'))
      expect(display.value).toBe('$1,234.56')
      expect(val.value).toBe(1234.56)
    })

    it('handles multiple dots by keeping only first', () => {
      const val = ref<number | null>(null)
      const { display, onInput } = useCurrencyInput(val)
      onInput(makeInputEvent('12.34.56'))
      expect(display.value).toBe('$12.34')
    })

    it('handles empty input', () => {
      const val = ref<number | null>(null)
      const { display, onInput } = useCurrencyInput(val)
      onInput(makeInputEvent(''))
      expect(display.value).toBe('$')
      expect(val.value).toBe(0)
    })

    it('handles input with only a dot', () => {
      const val = ref<number | null>(null)
      const { display, onInput } = useCurrencyInput(val)
      onInput(makeInputEvent('.'))
      expect(display.value).toBe('$.')
    })
  })

  describe('onBlur', () => {
    it('formats to 2 decimal places on blur', () => {
      const val = ref<number | null>(null)
      const { display, onInput, onBlur } = useCurrencyInput(val)
      onInput(makeInputEvent('1500'))
      onBlur()
      expect(display.value).toBe('$1,500.00')
      expect(val.value).toBe(1500)
    })

    it('clears display and sets null when empty', () => {
      const val = ref<number | null>(null)
      const { display, onBlur } = useCurrencyInput(val)
      display.value = ''
      onBlur()
      expect(display.value).toBe('')
      expect(val.value).toBe(null)
    })

    it('clears display when only $', () => {
      const val = ref<number | null>(null)
      const { display, onBlur } = useCurrencyInput(val)
      display.value = '$'
      onBlur()
      expect(display.value).toBe('')
      expect(val.value).toBe(null)
    })

    it('clears display when value is $0', () => {
      const val = ref<number | null>(null)
      const { display, onInput, onBlur } = useCurrencyInput(val)
      onInput(makeInputEvent('0'))
      onBlur()
      expect(display.value).toBe('')
      expect(val.value).toBe(null)
    })
  })

  describe('onFocus', () => {
    it('calls select on the target', () => {
      vi.useFakeTimers()
      const val = ref<number | null>(100)
      const { onFocus } = useCurrencyInput(val)
      const event = makeFocusEvent()
      onFocus(event)
      vi.advanceTimersByTime(10)
      expect((event.target as HTMLInputElement).select).toHaveBeenCalled()
      vi.useRealTimers()
    })
  })

  describe('reset', () => {
    it('clears display and sets value to null', () => {
      const val = ref<number | null>(500)
      const { display, reset } = useCurrencyInput(val)
      expect(display.value).toBe('$500.00')
      reset()
      expect(display.value).toBe('')
      expect(val.value).toBe(null)
    })
  })

  describe('setFromValue', () => {
    it('sets display and value', () => {
      const val = ref<number | null>(null)
      const { display, setFromValue } = useCurrencyInput(val)
      setFromValue(2500.5)
      expect(display.value).toBe('$2,500.50')
      expect(val.value).toBe(2500.5)
    })
  })

  describe('watch sync', () => {
    it('clears display when external value becomes null', async () => {
      const val = ref<number | null>(100)
      const { display } = useCurrencyInput(val)
      expect(display.value).toBe('$100.00')
      val.value = null
      await nextTick()
      expect(display.value).toBe('')
    })
  })
})

