---
sidebar_position: 12
title: Development
description: Install and run Flixer Web, type-check and format the source, and add views or shared components.
---

# Development

## Prerequisites and setup

Use Node.js and npm. The project has a `package-lock.json` and the Docker build uses Node `26.12.0`; `package.json` does not declare an `engines` range. The local setup commands are:

```sh
npm ci
npm run dev
```

Vite listens on port `5173` and binds to all interfaces. By default the page uses `http://localhost:5173`; the development server uses the configured local certificate/basic-SSL behavior when HTTPS is needed. For local end-to-end requests, run the Flixer API on port `8083` and flixer-streamer on `8091`, or adjust the source proxy configuration. See [Configuration](./configuration.md).

Useful commands from `package.json`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server. |
| `npm run build` | Runs `vue-tsc -b` followed by `vite build`; output is `dist/`. |
| `npx vue-tsc -b` | Run the TypeScript/Vue project build check without bundling. |
| `npm run preview` | Preview the built Vite site locally. |
| `npm run format:check` | Check Prettier formatting under `src/`. |
| `npm run format` | Apply Prettier formatting under `src/`. |
| `npm run i18n:check` | Validate translation JSON keys/placeholders. |

There is no test script declared in the current `package.json`. The formatter settings use two-space indentation and no semicolons; match nearby files and run the formatting check after source changes. The task's docs-only workflow does not require running these app commands.

## Add a route-level view

1. Create the view in `src/views/` using Vue 3 Composition API and `<script setup lang="ts">`, matching nearby components.
2. Add a lazy import and route entry in `src/router/index.ts`. Use a route name, typed props where appropriate, and `meta: { requiresAuth: true }` for authenticated pages. Use `requiresAdmin: true` for admin-only pages; the router loads the profile and checks the role.
3. Reuse `Header.vue`, `MobileTabBar.vue`, `page-gutter`, and existing media card/section primitives where applicable. Ensure the view behaves at narrow widths and exposes accessible labels/status/error text.
4. Put API calls and typed response shapes in `src/api.ts` when they are reusable; avoid embedding transport details in the view. For shared cross-view state, follow module-level composables such as `useProfile`/`useAudioPlayer` rather than adding a Pinia store that is not part of this app's dependencies.
5. Add user-visible text to `src/locales/en.json` and use `useI18n()`. Follow [Internationalization](./internationalization.md) and run `npm run i18n:check` when catalogs change.

## Add a shared component

Place components by responsibility (`components/home/`, `player/`, `admin/`, `settings/`, `auth/`, `ui/`, or `header/`). Prefer focused components with props/emits and keep server mutations in reusable API helpers/composables where they belong. For modal dialogs, use the already configured `@kolirt/vue-modal` integration and typed modal results; use `confirmAction()` for destructive confirmations and `notify` for consistent feedback. Style with the tokens in `src/tailwind.css`, including `.theme-dark` only for intentionally dark regions, and follow adjacent Prettier conventions.

## Build and deployment boundary

`npm run build` is the type-check plus production bundle. It does not build the Flixer API or streamer; it emits frontend static assets. Docker then serves those assets with Nginx. The production reverse proxy/ingress must provide SPA fallback and route API/streamer and WebSocket traffic as described in [Configuration and deployment](./configuration.md).
