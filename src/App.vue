<script setup lang="ts">
import { ref } from 'vue'
import NotificationPanel from '@/components/NotificationPanel.vue'
import PinGate from '@/components/PinGate.vue'
import HouseholdSetup from '@/components/HouseholdSetup.vue'
import SnackbarNotification from '@/components/SnackbarNotification.vue'
import { useTheme } from '@/composables/useTheme'

const menuOpen = ref(false)
const { mode, isDark, highContrast, setMode, toggleDark, toggleHighContrast } = useTheme()
</script>

<template>
  <PinGate>
    <div class="app-shell">
      <header class="app-header">
        <RouterLink to="/" class="logo">💰 Family Finances</RouterLink>
        <button class="menu-toggle" @click="menuOpen = !menuOpen" aria-label="Toggle menu">
          <span :class="{ open: menuOpen }">☰</span>
        </button>
        <nav :class="{ open: menuOpen }">
          <NotificationPanel />
          <RouterLink to="/" @click="menuOpen = false">Dashboard</RouterLink>
          <RouterLink to="/income" @click="menuOpen = false">Income</RouterLink>
          <RouterLink to="/expenses" @click="menuOpen = false">Expenses</RouterLink>
          <RouterLink to="/analytics" @click="menuOpen = false">Analytics</RouterLink>
          <RouterLink to="/budgets" @click="menuOpen = false">Budgets</RouterLink>
          <RouterLink to="/savings" @click="menuOpen = false">Savings</RouterLink>
          <RouterLink to="/year-review" @click="menuOpen = false">Year Review</RouterLink>
          <RouterLink to="/calendar" @click="menuOpen = false">Calendar</RouterLink>
          <div class="theme-controls">
            <button
              class="theme-btn"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              aria-label="Toggle dark mode"
              @click="toggleDark"
            >
              {{ isDark ? '☀️' : '🌙' }}
            </button>
            <button
              class="theme-btn"
              :class="{ active: mode === 'system' }"
              title="Use system preference"
              aria-label="Use system theme"
              @click="setMode('system')"
            >
              💻
            </button>
            <button
              class="theme-btn"
              :class="{ active: highContrast }"
              title="Toggle high contrast"
              aria-label="Toggle high contrast mode"
              @click="toggleHighContrast"
            >
              🔲
            </button>
          </div>
        </nav>
      </header>
      <HouseholdSetup />
      <main class="app-main">
        <RouterView />
      </main>
    </div>
  </PinGate>
  <SnackbarNotification />
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--color-header-bg);
  color: var(--color-header-text);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-wrap: wrap;
  transition: background-color 0.2s ease;
}

.logo {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-header-text);
  text-decoration: none;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--color-header-text);
  font-size: 1.5rem;
  cursor: pointer;
}

nav {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

nav a {
  color: var(--color-header-link);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.95rem;
}

nav a:hover {
  background: var(--color-header-hover);
  color: var(--color-header-text);
}

.theme-controls {
  display: flex;
  gap: 0.2rem;
  margin-left: 0.5rem;
  border-left: 1px solid var(--color-header-hover);
  padding-left: 0.5rem;
}

.theme-btn {
  background: none;
  border: 1.5px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem 0.4rem;
  line-height: 1;
  transition: all 0.15s;
}

.theme-btn:hover {
  background: var(--color-header-hover);
}

.theme-btn.active {
  background: var(--color-header-hover);
  border-color: var(--color-header-text);
}

.app-main {
  flex: 1;
  padding: 1.5rem 1rem;
}

@media (max-width: 600px) {
  .menu-toggle {
    display: block;
  }

  nav {
    display: none;
    flex-direction: column;
    width: 100%;
    padding-top: 0.5rem;
  }

  nav.open {
    display: flex;
  }

  nav a {
    padding: 0.6rem 0.5rem;
  }

  .theme-controls {
    margin-left: 0;
    border-left: none;
    padding-left: 0;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-header-hover);
  }
}
</style>
