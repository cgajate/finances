<script setup lang="ts">
export interface Tab {
  value: string
  label: string
  icon?: string[]
}

const props = defineProps<{
  tabs: Tab[]
  modelValue: string
  color?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const accentColor = props.color ?? 'var(--color-primary)'
</script>

<template>
  <div class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      :class="{ active: modelValue === tab.value }"
      @click="emit('update:modelValue', tab.value)"
    >
      <font-awesome-icon v-if="tab.icon" :icon="tab.icon" />
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
}

.tab-bar button {
  flex: 1;
  padding: 0.6rem;
  border: 2px solid v-bind(accentColor);
  background: var(--color-surface);
  color: v-bind(accentColor);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-left-width: 1px;
  border-right-width: 1px;
}

.tab-bar button:first-child {
  border-radius: 8px 0 0 8px;
  border-left-width: 2px;
}

.tab-bar button:last-child {
  border-radius: 0 8px 8px 0;
  border-right-width: 2px;
}

.tab-bar button:first-child:last-child {
  border-radius: 8px;
  border-width: 2px;
}

.tab-bar button.active {
  background: v-bind(accentColor);
  color: white;
}
</style>

