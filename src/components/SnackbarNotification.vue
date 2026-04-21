<script setup lang="ts">
import { ref } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'

const { items, undo, dismiss } = useSnackbar()
const copiedId = ref<number | null>(null)

async function copyCode(text: string, id: number) {
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = null
    }, 2000)
  } catch {
    // Fallback — ignored
  }
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup name="snackbar" tag="div" class="snackbar-container" aria-live="polite">
      <div
        v-for="item in items"
        :key="item.id"
        class="snackbar"
        role="alert"
      >
        <span class="snackbar-message">{{ item.message }}</span>
        <button
          v-if="item.copyText"
          class="snackbar-copy"
          @click="copyCode(item.copyText!, item.id)"
          :title="copiedId === item.id ? 'Copied!' : 'Copy code'"
        >
          <font-awesome-icon :icon="['fas', copiedId === item.id ? 'check' : 'copy']" />
          {{ copiedId === item.id ? 'Copied' : 'Copy' }}
        </button>
        <button
          v-if="item.undoFn"
          class="snackbar-undo"
          @click="undo(item.id)"
        >
          Undo
        </button>
        <button
          class="snackbar-close"
          aria-label="Dismiss"
          @click="dismiss(item.id)"
        >
          <font-awesome-icon :icon="['fas', 'xmark']" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style>
/* Snackbar styles (unscoped for TransitionGroup) */
.snackbar-container {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column-reverse;
  gap: 0.5rem;
  pointer-events: none;
  max-width: 90vw;
}

.snackbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--color-income, #2e7d32);
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  font-size: 0.9rem;
  pointer-events: auto;
  min-width: 280px;
  max-width: 520px;
}

.snackbar-message {
  flex: 1;
}

.snackbar-copy {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #fff;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: background 0.15s;
}

.snackbar-copy:hover {
  background: rgba(255, 255, 255, 0.1);
}

.snackbar-undo {
  background: none;
  border: none;
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
}

.snackbar-undo:hover {
  background: rgba(255, 255, 255, 0.1);
}

.snackbar-close {
  background: none;
  border: none;
  color: #fff;
  opacity: 0.6;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.2rem;
}

.snackbar-close:hover {
  opacity: 1;
}

/* Transitions */
.snackbar-enter-active {
  transition: all 0.3s ease;
}

.snackbar-leave-active {
  transition: all 0.2s ease;
}

.snackbar-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.snackbar-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
