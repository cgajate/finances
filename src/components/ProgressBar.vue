<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  percent: number
  variant?: 'ok' | 'warning' | 'over' | 'primary'
  height?: number
}>()

const barHeight = computed(() => `${props.height ?? 10}px`)
const barRadius = computed(() => `${(props.height ?? 10) / 2}px`)
const clampedWidth = computed(() => Math.min(props.percent, 100) + '%')
const fillClass = computed(() => {
  if (props.variant === 'over') return 'fill--over'
  if (props.variant === 'warning') return 'fill--warning'
  if (props.variant === 'primary') return 'fill--primary'
  return 'fill--ok'
})
</script>

<template>
  <div
    class="progress-track"
    role="progressbar"
    :aria-valuenow="Math.min(Math.round(percent), 100)"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="`${Math.min(Math.round(percent), 100)}% complete`"
  >
    <div class="progress-fill" :class="fillClass" :style="{ width: clampedWidth }"></div>
  </div>
</template>

<style scoped>
.progress-track {
  height: v-bind(barHeight);
  background: var(--color-progress-track);
  border-radius: v-bind(barRadius);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: v-bind(barRadius);
  transition: width 0.3s ease;
}

.fill--ok {
  background: var(--color-progress-fill);
}

.fill--warning {
  background: var(--color-progress-warning);
}

.fill--over {
  background: var(--color-progress-over);
}

.fill--primary {
  background: var(--color-primary);
}
</style>

