<script setup lang="ts">
defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div v-if="open" class="sidebar-backdrop" @click="emit('close')"></div>
  </Transition>

  <!-- Sidebar -->
  <Transition name="slide-left">
    <nav v-if="open" class="mobile-sidebar">
      <div class="sidebar-header">
        <img src="/mg-logo.webp" alt="Logo" class="sidebar-logo" />
        <span class="sidebar-title">Montajate Financier</span>
      </div>
      <RouterLink to="/" class="sidebar-link" @click="emit('close')">
        <font-awesome-icon :icon="['fas', 'house']" /> Dashboard
      </RouterLink>
      <RouterLink to="/finances" class="sidebar-link" @click="emit('close')">
        <font-awesome-icon :icon="['fas', 'money-bill-wave']" /> Finances
      </RouterLink>
      <RouterLink to="/goals" class="sidebar-link" @click="emit('close')">
        <font-awesome-icon :icon="['fas', 'bullseye']" /> Goals
      </RouterLink>
      <RouterLink to="/calendar" class="sidebar-link" @click="emit('close')">
        <font-awesome-icon :icon="['fas', 'calendar-days']" /> Calendar
      </RouterLink>
      <RouterLink to="/analytics" class="sidebar-link" @click="emit('close')">
        <font-awesome-icon :icon="['fas', 'chart-line']" /> Analytics
      </RouterLink>
    </nav>
  </Transition>
</template>

<style scoped>
.sidebar-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 150;
}

.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  z-index: 200;
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 1rem 1rem;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 0.5rem;
}

.sidebar-logo {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: contain;
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1.25rem;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s, padding-left 0.15s;
}

.sidebar-link:hover {
  background: var(--color-primary-light);
  color: var(--color-primary-text);
  padding-left: 1.5rem;
}

.sidebar-link.router-link-exact-active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

/* ─── Transitions ─── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-left-enter-active, .slide-left-leave-active { transition: transform 0.25s ease; }
.slide-left-enter-from, .slide-left-leave-to { transform: translateX(-100%); }
</style>

