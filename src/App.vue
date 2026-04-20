<script setup lang="ts">
import { ref } from 'vue'
import NotificationPanel from '@/components/NotificationPanel.vue'

const menuOpen = ref(false)
</script>

<template>
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
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
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
  background: #1976d2;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-wrap: wrap;
}

.logo {
  font-size: 1.15rem;
  font-weight: 700;
  color: white;
  text-decoration: none;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

nav {
  display: flex;
  gap: 0.25rem;
}

nav a {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.95rem;
}

nav a:hover,
nav a.router-link-exact-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
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
}
</style>
