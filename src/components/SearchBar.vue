<script setup lang="ts">
const model = defineModel<string>({ required: true })

defineProps<{
  placeholder?: string
}>()

function clear() {
  model.value = ''
}
</script>

<template>
  <div class="search-bar">
    <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="search-icon" />
    <input
      v-model="model"
      type="text"
      class="search-input"
      :placeholder="placeholder ?? 'Search...'"
    />
    <button v-if="model" class="search-clear" aria-label="Clear search" @click="clear">
      <font-awesome-icon :icon="['fas', 'xmark']" />
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  margin-bottom: 0.75rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: 0.9rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.6rem 2.2rem 0.6rem 2.2rem;
  border: 1px solid var(--color-input-border);
  border-radius: 8px;
  font-size: 0.95rem;
  box-sizing: border-box;
  background: var(--color-input-bg);
  color: var(--color-input-text);
}

.search-clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.2rem;
}

.search-clear:hover {
  color: var(--color-text);
}
</style>

