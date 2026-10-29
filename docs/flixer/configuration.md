---
sidebar_position: 2
title: Configuration
description: Every environment variable the flixer backend reads, plus Docker/compose variables and database-backed settings.
---

# Configuration

flixer is configured through **environment variables** (loaded from the process environment and a `.env` file via dotenv; see `.env.example`) and through **database settings** edited in the admin UI (`src/config/settings.json`, table `settings`).

## Environment variables read by the code

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | – | **Yes** | PostgreSQL connection string. Also used by pg-boss (own pool of 2). |
| `DATABASE_POOL_MAX` | `10` | No | Max connections in the TypeORM pool. |
| `PORT` | `8083` | No | HTTP port. The Docker image sets `8081`. |
| `NODE_ENV` | `development` | No | `production` switches logging layout/streams and disables the dev port-killer. |
| `JWT_SECRET` | – | **Yes** | HMAC secret (≥ 32 bytes) signing access tokens, passkey second-factor tickets and e-mail verification tokens. |
| `APP_SECRET` | – | **Yes** (to play/stream/index) | Secret (≥ 32 bytes) **shared with flixer-streamer and flixer-indexer**. Signs stream tokens, indexer and streamer request signatures, derives the streamer admin key, and is the key source for encrypting network-share passwords. Changing it invalidates saved share passwords. |
| `APP_URL` | `https://localhost:5173` | No | Public web URL; used to build links in e-mails (`/verify-email?token=`). |
| `STREAMER_PUBLIC_URL` | empty | No | Prefix for stream URLs returned to clients. Empty = relative URL (`/streamer/stream/<token>`), so the browser reaches the streamer through the same origin (proxy / Vite dev server). |
| `STREAMER_INTERNAL_URL` | `http://localhost:8091` | No | Where flixer reaches the streamer health and admin APIs. |
| `INDEXER_URL` | `http://localhost:8092` | No | Where flixer reaches the indexer. `INDEXER_INTERNAL_URL` is accepted as a fallback. |
| `PASSKEY_RP_ID` | `localhost` | No | WebAuthn relying-party id (the site's domain). |
| `PASSKEY_RP_NAME` | `Flixer` | No | WebAuthn relying-party display name. |
| `PASSKEY_ORIGINS` | `https://localhost:5173` | No | Comma-separated allowed WebAuthn origins. |
| `STREAM_MEDIA_ROOT` | falls back to `MEDIA_PATH`, then `../flixer-data/media` | No | Media root folder(s). Accepts a **JSON array** of paths, a list separated by the OS path delimiter (`;` on Windows, `:` elsewhere) or a single path. |
| `DATA_PATH` | `./data` (or `DATA_DIR` in dev) | No | Root for avatars, SQLite config, cache, SMB mounts and backups. Avatars use `avatars/`, SQLite uses `config/`, media images use `cache/images/`, SMB mounts use `mounts/`, and backups use `backups/`. |
| `INDEXER_MAX_WRITES` | `3` | No | Max concurrent indexer write requests (`WorkLimiter`). |
| `INDEXER_MAX_QUEUED_WRITES` | `200` | No | Waiting writes allowed before the API answers `429`. |
| `LOG_DIR` | unset | No | If set, flixer writes JSON logs to `<LOG_DIR>/flixer.log` and tails `<LOG_DIR>/streamer.log` into the live log stream. |

:::note
SMTP is **not** configured through environment variables – it lives in the `smtp_*` database settings.
:::

### Example `.env`

```bash
DATABASE_URL=postgres://flixer:flixer@localhost:5432/flixer
JWT_SECRET=change-me-to-a-long-random-string-of-32+bytes
APP_SECRET=another-long-random-string-shared-with-streamer
DATA_DIR=../flixer-data
APP_URL=https://localhost:5173
STREAM_MEDIA_ROOT=["D:/Media/Movies","D:/Media/Shows"]
LOG_DIR=../flixer-data/logs
```

## Docker / process-manager variables

These are consumed by the Dockerfile, `processes.config.cjs` or compose files, not by the application code:

| Variable | Default | Where | Purpose |
| --- | --- | --- | --- |
| `NB_INSTANCES` | `2` | PM2 config | Number of cluster instances. |
| `MAX_MEMORY_RESTART` | `750M` | PM2 config | Restart an instance above this memory. |
| `NODE_VERSION` | `26.12.0` | Dockerfile build arg | Node base image version. |
| `APP_VERSION` | – | Dockerfile build arg | Version label of the image. |
| `HTTP_PORT` | `8080` | compose | Host port published by the proxy. |
| `MAX_TRANSCODES`, `STREAMER_LOG_LEVEL`, `INDEXER_LOG_LEVEL` | – | compose | Passed to streamer/indexer. |
| `DATA_DIR`, `MEDIA_PATH`, `LOG_PATH` | `../flixer-data/...` | compose | Host folders mounted into containers. |

`.env.example` also lists `FLIXER_PUBLIC_URL`, which the backend source does not read.

## Database-backed settings (`settings` table)

Defined in `src/config/settings.json` and synchronised at every start by `src/config/settingsSync.ts` (inserts missing keys, updates `is_public`, deletes keys no longer defined, **never overwrites existing values**). Non-admins only see public settings.

| Key | Default | Public | Notes |
| --- | --- | --- | --- |
| `registration_enabled` | `true` | yes | When false, only an admin can create accounts. |
| `email_verification_required` | `true` | no | Only effective when `smtp_host` is set. |
| `server_name`, `server_address` | `null` | yes | Display info. |
| `logs_path`, `secret_key` | `null` | no | Reserved. |
| `smtp_host`, `smtp_port` (587), `smtp_secure` (false), `smtp_user`, `smtp_password`, `smtp_from` | empty | no | Outgoing mail. `smtp_password` is returned masked as `********`. |
| `indexer_language` | `"en"` | no | Metadata language code (e.g. `en`, `pt-BR`). |
| `indexer_providers` | `{}` | no | Per-provider `{enabled, apiKey}`; providers: `tmdb tvdb omdb fanart audiodb discogs anidb musicbrainz anilist`. |
| `indexer_concurrency` | `{}` | no | Workers per queue (`scan identify metadata images probe refresh`), 1–64. |
| `indexer_subtitles` | `{}` | no | OpenSubtitles `apiKey`, `username`, `password`, `languages` (≤ 10), `autoFetch`. |
| `sentry_enabled`, `sentry_flixer_enabled`, `sentry_streamer_enabled`, `sentry_web_enabled` | `true` | no | Sentry switches. |
| `sentry_flixer_dsn`, `sentry_streamer_dsn`, `sentry_web_dsn` | built-in DSNs | no | Must be http(s) URLs or `null`. |

Settings are changed with `PUT /api/settings/:key` (admin). See [Admin API](./admin-api.md).
