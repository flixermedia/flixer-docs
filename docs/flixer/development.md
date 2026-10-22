---
sidebar_position: 11
title: Development
description: Running the flixer backend natively, npm scripts, tests, code conventions and release flow.
---

# Development

## Prerequisites

- Node.js 24+ (the Docker image defaults to Node 26.12.0) and npm.
- PostgreSQL reachable through `DATABASE_URL`.
- Optional: flixer-streamer and flixer-indexer running locally (defaults `http://localhost:8091` / `:8092`); sibling repositories `flixer-web`, `flixer-streamer`, `flixer-data`.

## Run natively

```bash
npm install
cp .env.example .env     # set DATABASE_URL, JWT_SECRET, STREAM_TOKEN_SECRET (>= 32 bytes)
npm start                # barrels + `tsed dev` (Vite runtime) on PORT (default 8083)
```

Migrations and settings seeding run automatically on start. The first account you register becomes admin. In development, if the port is busy `scripts/kill-port.mjs` frees it automatically.

Production-like:

```bash
npm run build
npm run start:prod       # NODE_ENV=production node dist/index.js
```

`dist/index.js` is an SSR bundle of `src/index.ts` built by Vite (target node24, sourcemaps, no minify).

`docker-compose.dev.yml` builds web and streamer from sibling folders (no indexer/redis); `docker-compose.yml` runs the published GHCR images (`ghcr.io/flixermedia/{flixer,flixer-streamer,flixer-indexer,flixer-web}`) behind the nginx proxy.

## npm scripts

| Script | Command |
| --- | --- |
| `start` | `npm run barrels && tsed dev` |
| `build` | `npm run barrels && tsed build` |
| `start:prod` | `cross-env NODE_ENV=production node dist/index.js` |
| `barrels` | generate barrel files (`.barrels.json`) |
| `kill:port` | `node scripts/kill-port.mjs 8083` |
| `format` | `node scripts/format.mjs --write` (Prettier wrapper) |
| `format:check` | check formatting only |
| `insomnia:update` | `node scripts/update-insomnia.mjs` – refresh the Insomnia collection |
| `test` | `npm run test:lint && npm run test:coverage` |
| `prepare` | install Husky hooks |

:::note
`package.json` references `test:lint` and `test:coverage` from `test` but does not define them, so `npm test` fails as-is. Specs are written for Vitest (`tsconfig.spec.json`); run them directly with `npx vitest`.
:::

Existing specs: `src/api/indexer/indexerAuth.spec.ts` and `src/live/liveHub.spec.ts`.

## Conventions

- **Ts.ED** patterns: `@Controller`, `@Injectable`, constructor DI, request DTOs with `@tsed/schema` decorators (`@Required`, `@MaxLength`, `@Enum`, …); keep controllers thin and logic in services.
- **Feature folders**: `src/api/<feature>/` with controller, service and requests.
- **Tabs** for indentation; **ESM** with explicit `.js` extensions in relative imports (`import { X } from "./x.js"`).
- Errors are thrown as `@tsed/exceptions` (`BadRequest`, `NotFound`, `Conflict`, …); `tryCatch` from `@dschz/try-catch` is used for result-style handling.
- New controllers must be exported from `src/api.ts` to be mounted under `/api`.
- New settings: add to `src/config/settings.json` (default, `is_public`); they sync on startup.
- New schema: add an entity and a migration in `src/migrations` and register it in the datasource's migration list.
- Admin mutations that change dashboard data should call `LiveService.invalidate(...)`.

## Commits and releases

A Husky `commit-msg` hook (`scripts/emoji-commit-message.mjs`) adds an emoji after the conventional commit type. Release flow (see `VERSION.md`): bump the version in `package.json`; on push to `main` a tag is created when none exists for that version and images are published to GHCR as `ghcr.io/flixermedia/flixer:X.Y.Z` and `:latest`.

## Docker image

Multi-stage Node Alpine build; the runtime installs `build-base`, `git`, `curl`, `cifs-utils` and `pm2`, copies `resources/`, runs as user `node`, exposes `8081` and starts `pm2-runtime start processes.config.cjs --env production` (cluster mode, `NB_INSTANCES` default 2).
