# AGENTS.md

## Project Overview

Personal finances app built with **Vue 3 + TypeScript + Vite**. Currently in early scaffold stage (created from `create-vue`).

- **State management**: Pinia 3 with Composition API style (`defineStore` + `ref`/`computed`) — see `src/stores/counter.ts`
- **Routing**: Vue Router 5 with HTML5 history mode — see `src/router/index.ts`
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
  main.ts          # App entry — mounts Vue with Pinia + Router
  App.vue          # Root component
  router/index.ts  # Route definitions (currently empty)
  stores/          # Pinia stores (composition style)
```

