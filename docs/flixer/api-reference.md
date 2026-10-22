---
sidebar_position: 9
title: API reference
description: All non-admin REST endpoints of the flixer backend grouped by controller, with auth and purpose.
---

# API reference (non-admin)

Base path: **`/api`**. Authentication: `Authorization: Bearer <access token or API key>`. Request bodies are JSON unless noted. Administrative endpoints are in the [Admin API](./admin-api.md).

**OpenAPI / Scalar:** the app serves interactive docs at **`/scalar/doc`** (OpenAPI 3.1.0, `BearerAuth` HTTP bearer JWT scheme). Through the Docker proxy only `/api/*` is forwarded to flixer, so open Scalar on the API port directly (`8081` in Docker, `8083` natively). `scripts/update-insomnia.mjs` regenerates an Insomnia collection.

Legend: **Public** = no auth; **Bearer** = any authenticated user; **Signed** = HMAC headers.

## Version – `VersionController`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/version` | Public | `{ version }`. |

## Auth – `/auth`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public (admin token if registration disabled) | Create account; returns token or `{verificationRequired}`. |
| POST | `/auth/login` | Public | Username/e-mail + password → token, or `{passkeyRequired, ticket}`. |
| POST | `/auth/verify-email` | Public | Confirm e-mail with token. |
| POST | `/auth/resend-verification` | Public | Resend verification mail (60 s cooldown). |
| GET | `/auth/me` | Bearer | Current user. |
| PATCH | `/auth/me` | Bearer | Update display name / e-mail. |
| PATCH | `/auth/me/passkey-required` | Bearer | Toggle passkey second factor. |
| POST | `/auth/me/password` | Bearer | Change password. |
| POST | `/auth/me/delete` | Bearer | Delete own account (password required). |
| GET | `/auth/sessions` | Bearer | List own sessions. |
| DELETE | `/auth/sessions/:sessionId` | Bearer | Revoke a session. |
| POST | `/auth/logout` | Bearer | End current session. |
| POST | `/auth/me/avatar` | Bearer | Upload avatar (multipart `avatar`, ≤ 5 MB). |
| DELETE | `/auth/me/avatar` | Bearer | Remove avatar. |
| GET | `/auth/avatars/:filename` | Public | Avatar image (immutable cache). |

## Passkeys – `/auth/passkeys`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/auth/passkeys` | Bearer | List own passkeys. |
| POST | `/auth/passkeys/register/options` | Bearer | WebAuthn creation options (body `{password}`). |
| POST | `/auth/passkeys/register/verify` | Bearer | Verify and store a passkey. |
| POST | `/auth/passkeys/login/options` | Public | Usernameless authentication options. |
| POST | `/auth/passkeys/login/verify` | Public | Verify assertion → token. |
| POST | `/auth/passkeys/second-factor/options` | Public (ticket) | Options for second factor. |
| POST | `/auth/passkeys/second-factor/verify` | Public (ticket) | Verify → token. |
| POST | `/auth/passkeys/:passkeyId/delete` | Bearer | Delete a passkey. |

## Users – `UserController`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/users` | Admin | List users. |
| GET | `/users/:id` | Self or admin | User detail. |
| DELETE | `/users/:id` | Self (with password) or admin | Delete user. |

## Preferences

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/preferences` | Bearer | Own preferences. |
| PATCH | `/preferences` | Bearer | Update (`language` only; `null` deletes). |

## Settings

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/settings` | Bearer | Visible settings (public ones for non-admins). |
| GET | `/settings/registration` | Public | Whether registration is enabled. |

## Sentry

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/sentry/config/:app` | Public | `{enabled, dsn}` for `flixer`, `streamer` or `web`. |

## Media browsing – `/media`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/media/home` | Bearer | Home page rows (libraries, featured, continue watching, recents). |
| GET | `/media/search?q=&type=` | Bearer | Title search (q ≥ 2 chars). |
| GET | `/media/browse/:kind?sort=&offset=&limit=` | Bearer | `kind`: `movies`, `tv`, `music`; `sort`: `added`, `title`, `year`; `limit` ≤ 100. |
| GET | `/media/items/:id` | Bearer | Item detail with children. |
| GET | `/media/items/:id/images/:index` | Bearer | Image bytes (`private, max-age=300`). |
| GET | `/media/items/:id/progress` | Bearer | Watch progress. |
| PUT | `/media/items/:id/progress` | Bearer | Save `{positionSeconds, durationSeconds}` (204). |

## Playback – `/playback`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/playback/samples` | Bearer | Sample videos found in library folders. |
| POST | `/playback/items/:id/playback-info` | Bearer | Stream URL + token for an indexed item. |
| POST | `/playback/samples/:id/playback-info` | Bearer | Stream URL + token for a sample. |

## Streamer-facing

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/streamer/media-roots` | Signed (`x-streamer-timestamp`, `x-streamer-signature`) | `{ roots: [{id, path}] }`. Signature = hex HMAC-SHA256(`STREAM_TOKEN_SECRET`, `flixer-streamer:media-roots:v1:<timestamp>`), ±5 min. |

## Indexer-facing (signed) {#indexer-signed}

Headers `x-indexer-timestamp` and `x-indexer-signature` = hex HMAC-SHA256(`STREAM_TOKEN_SECRET`, `flixer-indexer:v1:<ts>:<METHOD>:<path>:<sha256hex(body)>`), ±5 min skew. Bodies are read raw so the signature covers exact bytes.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/indexer/libraries` | Libraries with absolute folder paths. |
| GET | `/indexer/settings` | Providers, concurrency, language, subtitle settings (unmasked). |
| POST | `/indexer/media/items` | Upsert an item (rate-limited, `429` when busy). |
| POST | `/indexer/libraries/:id/prune` | Body `{scanStartedAt}`; delete unseen items → `{removed}`. |

## Common error shape

Ts.ED exceptions are returned as JSON with `name`, `message`, `status`. Typical statuses: `400` validation, `401` missing/invalid/expired token, `403` forbidden/disabled/unverified, `404`, `409` conflict, `429` rate limited, `502/503/504` streamer or indexer problems.
