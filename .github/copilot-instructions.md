# GitHub Copilot Custom Instructions

These instructions guide GitHub Copilot in generating code consistent with our project's standards and best practices.

## About My Project

*   **Project Name:** Finances
*   **Project Goal:** A personal finances single-page application for tracking income, expenses, budgets, savings goals, and spending trends. Built with Vue 3 + TypeScript + Vite for web and Android (via Capacitor).
*   **My Role:** Senior Software Engineer
*   **Key Features:**
    *   Income and expense CRUD with category management.
    *   Monthly budgets and savings goal tracking.
    *   Spending analytics, forecasting, and year-in-review.
    *   Bill calendar with due-date tracking.
    *   Activity feed / audit log and expense approval workflow.
    *   In-app notifications and snackbar toasts.
    *   Multi-user household support.
    *   PIN-based app lock.
    *   Dark/light theme toggle.
    *   Firebase Firestore sync with anonymous authentication.
    *   Android deployment via Capacitor.
*   **Technologies:**
    *   **Frontend:** Vue 3 (Composition API, `<script setup lang="ts">`), Vue Router 5, Pinia 3 (composition/setup style), Vite 8, TypeScript 6
    *   **Styling:** CSS/SCSS with BEM methodology
    *   **Icons:** Font Awesome (solid icons) registered globally as `<font-awesome-icon>`
    *   **Backend:** Firebase (Firestore + anonymous Auth), configured via `VITE_FIREBASE_*` env vars, lazy-initialized in `src/lib/firebase.ts`
    *   **Mobile:** Capacitor 8 for Android
    *   **Testing:** Vitest (unit), Playwright (E2E), Vue Test Utils
    *   **Linting:** oxlint (fast pass) then ESLint (second pass), both with `--fix`; Prettier for formatting

## General Guidelines

*   **Readability:** Prioritize clear, concise, and self-documenting code.
*   **Consistency:** Adhere to existing code patterns and conventions within the repository.
*   **Modularity:** Design components to be small, focused, and reusable.
*   **Error Handling:** Implement robust error handling and logging where appropriate.
*   **Testing:** Consider testability and include unit tests for new or modified functionality. Unit tests go in `src/**/__tests__/`, E2E tests in `e2e/`.
*   **Security:** Avoid common security vulnerabilities and sanitize user input.

## Language-Specific Guidelines

### TypeScript

*   **Strict Mode:** `noUncheckedIndexedAccess` is enabled — always handle `undefined` for array/object index access.
*   **Variable Declaration:** Use `const` and `let` consistently; never use `var`.
*   **Functions:** Prefer arrow functions for anonymous functions.
*   **Asynchronous Code:** Use `async/await` for asynchronous operations.
*   **Code Formatting:** Adhere to Prettier and ESLint formatting rules (ESLint formatting rules disabled via `eslint-config-prettier`).
*   **Comments:** Add comments only for complex logic or non-obvious design choices.
*   **Path Alias:** Use `@/` for imports from `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).
*   **Types:** Define domain types in `src/types/`. Prefer explicit typing over `any`.

### CSS / SCSS

*   **Methodology:** Follow BEM methodology.
*   **Units:** Prefer `rem` and `em` for font sizes and spacing; use `vh` and `vw` for responsive layouts.
*   **Responsiveness:** Utilize media queries for responsive design.
*   **Modern Features:** Leverage CSS Grid, Flexbox, and custom properties where suitable.
*   **Scoping:** Use `<style scoped>` in Vue SFCs to avoid style leakage.

## Project-Specific Requirements for Vue.js

*   **SFC Style:** Always use `<script setup lang="ts">` with Composition API — never use Options API.
*   **Component Design:**
    *   Each component should have a single, well-defined purpose.
    *   Use clear and descriptive PascalCase names reflecting function (e.g., `SpendingTrends`, `CurrencyInput`).
    *   Organize components: shared UI in `src/components/`, route-level pages in `src/views/`.
*   **Props and Events:**
    *   Clearly define expected props with TypeScript types using `defineProps<T>()`.
    *   Use `defineEmits<T>()` with typed event signatures.
    *   Use kebab-case for emitted event names (e.g., `item-selected`).
*   **Reactivity:**
    *   Use `ref` for primitive values and `reactive` for objects.
    *   Use `computed` for derived state.
    *   Avoid directly manipulating the DOM; let Vue handle DOM updates.
*   **Lists:** Always use the `:key` attribute with `v-for` directives.
*   **Templates:** Keep template expressions simple; extract complex logic into computed properties or composables.
*   **Composables:** Place reusable composition functions in `src/composables/` with `use` prefix (e.g., `useForecasting`, `useBillCalendar`).
*   **State Management:**
    *   Use Pinia 3 with the composition/setup syntax: `defineStore('name', () => { ... })`.
    *   Use `ref`/`computed` inside stores — never use the options syntax.
    *   Stores live in `src/stores/`.
*   **Routing:**
    *   Vue Router 5 with HTML5 history mode.
    *   Lazy-load route components with dynamic `import()` (except the dashboard).
    *   Route definitions in `src/router/index.ts`.
*   **Icons:** Use `<font-awesome-icon :icon="['fas', 'icon-name']" />` for icons. Icons must be imported and added to the library in `src/main.ts`.
*   **Testing:** Write unit tests using Vitest and Vue Test Utils. Tests go in `__tests__/` directories alongside source files.
*   **Error Handling:** Implement global error handling to gracefully manage unexpected errors.
*   **Reusability:** Design components to be reusable across different parts of the application.
*   **Parent–Child Communication:** Use props (down) and events (up) for parent–child communication.

## Accessibility

*   Include appropriate ARIA attributes and focus on accessible design.
*   Do not use ARIA to make up for bad HTML — use semantic HTML5 elements first.
*   ARIA attributes should only be used when HTML5 semantic tags are not available.
*   Do not change native semantics unnecessarily.
*   Don't use `role="presentation"` or `aria-hidden="true"` on a focusable element.
    *   `aria-hidden="true"` removes the entire element from the accessibility tree.
    *   `role="presentation"` removes the meaning of the element but still exposes its content to a screen reader.
*   WCAG 2.1 AA — size of the target for pointer inputs is at least 24×24 CSS pixels (except spacing, inline).
*   Interactive elements need multiple ways to be triggered (keyboard, touch, and pointer).
*   Interactive elements need to be visible and distinguishable (color, shape, size) — not just by color.
*   All interactive elements must have an accessible name:
    *   Links and buttons: the link text or button value becomes the accessible name.
    *   Input fields: associate with a visible label either implicitly or explicitly.
    *   Custom widgets: use `aria-label` or `aria-labelledby`.

## Preferred Practices

*   **Documentation:** Generate TSDoc comments for public APIs and complex functions.
*   **Firebase:** Firestore interactions go through composables (e.g., `useFirestoreSync`). Firebase is lazy-initialized and env-gated via `VITE_FIREBASE_API_KEY`.
*   **Capacitor:** Mobile-specific code should be guarded with platform checks from `@capacitor/core`.

## Repository Structure (High-Level)

```
src/
  main.ts            # App entry — mounts Vue with Pinia + Router + Font Awesome
  App.vue            # Root component
  router/index.ts    # Route definitions (lazy-loaded except dashboard)
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
  assets/            # CSS/SCSS stylesheets
e2e/                 # Playwright E2E tests
android/             # Capacitor Android project
public/              # Static assets
```

