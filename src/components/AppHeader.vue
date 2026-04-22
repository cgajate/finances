<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import NotificationPanel from '@/components/NotificationPanel.vue'
import { useTheme } from '@/composables/useTheme'
import { useHousehold } from '@/composables/useHousehold'

const emit = defineEmits<{
  'toggle-menu': []
  'open-sync': []
}>()

defineProps<{
  collapsed: boolean
}>()

const themeMenuOpen = ref(false)
const adminMenuOpen = ref(false)
const headerRef = ref<HTMLElement | null>(null)
const navRef = ref<HTMLElement | null>(null)
const { isDark, mode, highContrast, setMode, toggleDark, toggleHighContrast } = useTheme()
const { hasHousehold } = useHousehold()

const internalCollapsed = ref(false)
let checking = false
let cachedNavWidth = 0

function checkOverflow() {
  if (checking || !headerRef.value || !navRef.value) return
  checking = true

  const nav = navRef.value

  if (cachedNavWidth === 0) {
    nav.classList.remove('nav-hidden')
    nav.style.visibility = 'hidden'
    nav.style.position = 'absolute'
    nav.style.display = 'flex'
    nav.style.flex = 'none'
    cachedNavWidth = nav.scrollWidth
    nav.style.visibility = ''
    nav.style.position = ''
    nav.style.display = ''
    nav.style.flex = ''
    if (internalCollapsed.value) nav.classList.add('nav-hidden')
  }

  const headerWidth = headerRef.value.offsetWidth
  const right = headerRef.value.querySelector('.header-actions') as HTMLElement | null
  const fixedLeftWidth = 262
  const rightWidth = right?.offsetWidth ?? 90
  const totalNeeded = cachedNavWidth + fixedLeftWidth + rightWidth + 24

  internalCollapsed.value = totalNeeded > headerWidth
  checking = false
}

onMounted(async () => {
  await nextTick()
  checkOverflow()
  window.addEventListener('resize', checkOverflow)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkOverflow)
})

defineExpose({ internalCollapsed, headerRef, navRef, checkOverflow })
</script>

<template>
  <header ref="headerRef" class="app-header">
    <!-- Left: Logo + Title or Hamburger -->
    <div class="header-left">
      <RouterLink to="/" class="logo-link">
        <img src="/mg-logo.webp" alt="Logo" class="logo-img" />
      </RouterLink>
      <button
        v-if="internalCollapsed"
        class="menu-toggle"
        @click="emit('toggle-menu')"
        aria-label="Toggle menu"
      >
        <font-awesome-icon :icon="['fas', collapsed ? 'xmark' : 'bars']" />
      </button>
      <span v-else class="logo-text">Montajate Financier</span>
    </div>

    <!-- Center: Nav links (hidden when collapsed) -->
    <nav ref="navRef" class="desktop-nav" :class="{ 'nav-hidden': internalCollapsed }">
      <RouterLink to="/" class="nav-badge nav-badge-icon" aria-label="Dashboard">
        <font-awesome-icon :icon="['fas', 'house']" />
      </RouterLink>
      <RouterLink to="/finances" class="nav-badge">Finances</RouterLink>
      <RouterLink to="/goals" class="nav-badge">Goals</RouterLink>
      <RouterLink to="/calendar" class="nav-badge">Calendar</RouterLink>
      <RouterLink to="/analytics" class="nav-badge">Analytics</RouterLink>
    </nav>

    <!-- Right: Sync, Theme, Notifications -->
    <div class="header-actions">
      <!-- Sync with Family -->
      <button
        class="icon-btn sync-btn"
        :class="{ connected: hasHousehold }"
        title="Sync with Family"
        aria-label="Sync with Family"
        @click="emit('open-sync')"
      >
        <font-awesome-icon :icon="['fas', 'users']" />
        <span class="sync-status" :class="{ active: hasHousehold }">{{
          hasHousehold ? 'Synced' : 'Local'
        }}</span>
      </button>

      <!-- Theme toggle button -->
      <div class="theme-dropdown-wrapper">
        <button
          class="icon-btn"
          title="Theme settings"
          aria-label="Theme settings"
          @click="themeMenuOpen = !themeMenuOpen"
        >
          <font-awesome-icon :icon="['fas', 'palette']" />
        </button>
        <div v-if="themeMenuOpen" class="theme-backdrop" @click="themeMenuOpen = false"></div>
        <Transition name="slide">
          <div v-if="themeMenuOpen" class="theme-bubble" role="dialog" aria-label="Theme settings" @keydown.escape="themeMenuOpen = false">
            <button class="theme-option" @click="toggleDark">
              <font-awesome-icon :icon="['fas', isDark ? 'sun' : 'moon']" />
              <span>{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
            </button>
            <button
              class="theme-option"
              :class="{ active: mode === 'system' }"
              @click="setMode('system')"
            >
              <font-awesome-icon :icon="['fas', 'desktop']" />
              <span>System Theme</span>
            </button>
            <button
              class="theme-option"
              :class="{ active: highContrast }"
              @click="toggleHighContrast"
            >
              <font-awesome-icon :icon="['fas', 'circle-half-stroke']" />
              <span>High Contrast</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Notifications -->
      <NotificationPanel />

      <!-- Admin menu -->
      <div class="admin-dropdown-wrapper">
        <button
          class="icon-btn"
          title="Admin"
          aria-label="Admin menu"
          @click="adminMenuOpen = !adminMenuOpen"
        >
          <font-awesome-icon :icon="['fas', 'gear']" />
        </button>
        <div v-if="adminMenuOpen" class="admin-backdrop" @click="adminMenuOpen = false"></div>
        <Transition name="slide">
          <div v-if="adminMenuOpen" class="admin-bubble" role="dialog" aria-label="Admin menu" @keydown.escape="adminMenuOpen = false">
            <RouterLink to="/categories" class="admin-option" @click="adminMenuOpen = false">
              <span>Categories</span>
              <font-awesome-icon :icon="['fas', 'tags']" />
            </RouterLink>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* ─── Header ─── */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: color-mix(in srgb, var(--color-surface) 70%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  gap: 0.75rem;
}

.header-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 0.5rem;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--color-text);
}

.logo-img {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: contain;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* ─── Desktop nav badges (center) ─── */
.desktop-nav {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.desktop-nav.nav-hidden {
  display: none !important;
}

.nav-badge {
  text-decoration: none;
  color: var(--color-text-secondary);
  background: var(--color-icon-bg);
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
  backdrop-filter: blur(4px);
}

.nav-badge-icon {
  padding: 0.35rem 0.6rem;
  font-size: 0.95rem;
}

.nav-badge:hover {
  background: var(--color-primary-light);
  color: var(--color-primary-text);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--color-card-shadow);
}

.nav-badge.router-link-exact-active {
  background: var(--color-primary);
  color: #fff;
}

/* ─── Icon buttons ─── */
.icon-btn {
  background: var(--color-icon-bg);
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.15rem;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
  backdrop-filter: blur(4px);
}

.icon-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary-text);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--color-card-shadow);
}

/* ─── Sync button ─── */
.sync-btn {
  gap: 0.3rem;
  font-size: 0.95rem;
  padding: 0.3rem 0.5rem;
}

.sync-status {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.sync-status.active {
  color: var(--color-income);
}

.sync-btn.connected {
  border: 1px solid var(--color-income);
  color: var(--color-income);
}

/* ─── Theme dropdown ─── */
.theme-dropdown-wrapper {
  position: relative;
}

.theme-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 199;
}

.theme-bubble {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px var(--color-card-shadow);
  z-index: 200;
  min-width: 180px;
  padding: 0.4rem;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: none;
  background: none;
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
}

.theme-option:hover {
  background: var(--color-primary-light);
  color: var(--color-primary-text);
}

.theme-option.active {
  background: var(--color-primary-light);
  color: var(--color-primary-text);
}

/* ─── Admin dropdown ─── */
.admin-dropdown-wrapper {
  position: relative;
}

.admin-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 199;
}

.admin-bubble {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px var(--color-card-shadow);
  z-index: 200;
  min-width: 180px;
  padding: 0.4rem;
}

.admin-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: none;
  background: none;
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.admin-option:hover {
  background: var(--color-primary-light);
  color: var(--color-primary-text);
}

/* ─── Hamburger ─── */
.menu-toggle {
  background: var(--color-icon-bg);
  border: none;
  color: var(--color-text);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
}

.menu-toggle:hover {
  background: var(--color-primary-light);
  color: var(--color-primary-text);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--color-card-shadow);
}

/* ─── Transitions ─── */
.slide-enter-active, .slide-leave-active { transition: opacity 0.15s, transform 0.15s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ─── Small screens ─── */
@media (max-width: 480px) {
  .logo-text {
    display: none;
  }

  .logo-img {
    width: 36px;
    height: 36px;
  }

  .theme-bubble,
  .admin-bubble {
    position: fixed;
    top: auto;
    right: 1rem;
    left: 1rem;
    width: auto;
    min-width: unset;
    margin-top: 0.5rem;
  }
}
</style>

