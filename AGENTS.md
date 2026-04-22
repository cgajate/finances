# AGENTS.md

## Project Overview

Personal finances app built with **Vue 3 + TypeScript + Vite**. Supports web and Android (via Capacitor).

- **State management**: Pinia 3 with Composition API style (`defineStore` + `ref`/`computed`) — see `src/stores/finances.ts`
- **Routing**: Vue Router 5 with HTML5 history mode — see `src/router/index.ts`
- **Backend**: Firebase (Firestore + anonymous Auth) — configured via `VITE_FIREBASE_*` env vars, lazy-initialized in `src/lib/firebase.ts`
- **Icons**: Font Awesome (solid icons) registered globally as `<font-awesome-icon>` — see `src/main.ts`
- **Mobile**: Capacitor 8 for Android — see `capacitor.config.ts`
- **Path alias**: `@` → `./src` (configured in both `vite.config.ts` and `tsconfig.app.json`)

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Production build | `npm run build` (runs type-check + vite build in parallel) |
| Type-check only | `npm run type-check` (uses `vue-tsc --build`) |
| Unit tests | `npm run test:unit` (Vitest) |
| E2E tests | `npm run test:e2e` (Playwright — run `npx playwright install` first) |
| Lint | `npm run lint` (runs oxlint then eslint sequentially, both with `--fix`) |
| Format | `npm run format` (Prettier on `src/`) |
| Capacitor sync | `npm run cap:sync` (build + sync to Android) |
| Capacitor run | `npm run cap:run` (build + sync + run on device/emulator) |
| Capacitor build APK | `npm run cap:build` (produces debug APK) |

## Code Conventions

- **Vue SFCs**: Use `<script setup lang="ts">` with Composition API — no Options API
- **Stores**: Use Pinia's setup/composition syntax (`defineStore('name', () => { ... })`) not the options syntax
- **TypeScript**: `noUncheckedIndexedAccess` is enabled — handle `undefined` for array/object index access
- **Linting**: Two-pass lint — oxlint runs first (fast), then eslint. Prettier handles formatting (eslint formatting rules disabled via `eslint-config-prettier`)
- **Tests**: Unit tests go in `src/**/__tests__/`, E2E tests in `e2e/`
- **Node**: Requires `^20.19.0 || >=22.12.0` (uses `.nvmrc` with v25.8.2)
- **JSX**: Vue JSX is enabled via `@vitejs/plugin-vue-jsx`

## Architecture

```
src/
  main.ts            # App entry — mounts Vue with Pinia + Router + Font Awesome
  App.vue            # Root component
  router/index.ts    # Route definitions (12 routes, lazy-loaded except dashboard)
  stores/            # Pinia stores (composition style)
    finances.ts      #   Core income/expense CRUD
    budgets.ts       #   Monthly budget limits per category
    savingsGoals.ts  #   Savings goal tracking
    categories.ts    #   Expense/income category management
    activityFeed.ts  #   User action audit log
    approvals.ts     #   Expense approval workflow
    notifications.ts #   In-app notifications
  composables/       # Reusable composition functions
    useFirestoreSync.ts  # Firestore ↔ local state sync
    useForecasting.ts    # Monthly income/expense projections
    useBillCalendar.ts   # Bill due-date calendar logic
    useHousehold.ts      # Multi-user household management
    usePin.ts            # PIN-based app lock
    useSnackbar.ts       # Toast notification helper
    useSpendingTrends.ts # Spending analytics
    useTheme.ts          # Dark/light theme toggle
  components/        # Shared UI components
  views/             # Route-level page components
  types/finance.ts   # Core domain types (Income, Expense, Budget, SavingsGoal, etc.)
  lib/firebase.ts    # Firebase init (lazy, env-gated via VITE_FIREBASE_API_KEY)
```

