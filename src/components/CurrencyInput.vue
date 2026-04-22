<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCurrencyInput } from '@/composables/useCurrencyInput'

const props = defineProps<{
  modelValue: number | null
  required?: boolean
  id?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const innerValue = ref<number | null>(props.modelValue)
const currency = useCurrencyInput(innerValue)

// Sync prop → inner
watch(
  () => props.modelValue,
  (val) => {
    if (val !== innerValue.value) {
      if (val === null) {
        currency.reset()
      } else {
        currency.setFromValue(val)
      }
    }
  },
)

// Sync inner → emit
watch(innerValue, (val) => {
  emit('update:modelValue', val)
})
</script>

<template>
  <input
    :id="id"
    type="text"
    inputmode="decimal"
    placeholder="$0.00"
    :value="currency.display.value"
    :required="required"
    @input="currency.onInput"
    @blur="currency.onBlur"
    @focus="currency.onFocus"
  />
</template>
