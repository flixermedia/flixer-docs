---
sidebar_position: 8
title: Admin API
description: Every administrative endpoint of the flixer backend grouped by area, with method, path, auth and purpose.
---

# Admin API

All paths are relative to the `/api` mount. Admin controllers are annotated with `@Security("BearerAuth")` for OpenAPI.

**Auth legend**

- **Admin** – `requireAdmin`: admin session JWT *or* an API key owned by an admin.
- **Admin session** – `requireAdminSession`: real admin login only; API keys are rejected.

## Overview – `/admin/overview`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/overview` | Admin | Dashboard aggregate (`src/api/overview/overviewService.ts`): `counts` (movies, series, episodes, albums, tracks, users), per-library `items`/`sizeBytes`, `storage` (used bytes + disks of the media roots via `statfs`, roots on the same disk merged), last 10 `activity` entries from `watch_progress`, and `server` (hostname, version, Node, OS, uptime, streamer and indexer reachability). |

## Media libraries – `/admin/media-libraries`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/media-libraries` | Admin | List libraries with folder availability. |
| GET | `/admin/media-libraries/roots` | Admin | List media roots (`{id, name, path}`). |
| GET | `/admin/media-libraries/browse?rootId=&path=` | Admin | List sub-folders of a root path. |
| POST | `/admin/media-libraries` | Admin | Create `{name, type, imageStorage?, folders[1..50]}`. `409` duplicate name. |
| PATCH | `/admin/media-libraries/:id` | Admin | Update any of the above. |
| DELETE | `/admin/media-libraries/:id` | Admin | Delete (204). |

## Media items & subtitles – `/admin/media`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/media/items?libraryId&type&parentId&search&page&size` | Admin | Paged item list. |
| GET | `/admin/media/items/:id` | Admin | Item with full metadata. |
| PATCH | `/admin/media/items/:id` | Admin | Edit title, sortTitle, year, seasonNumber, episodeNumber, episodeEndNumber, overview. |
| DELETE | `/admin/media/items/:id` | Admin | Remove item. |
| GET | `/admin/media/items/:id/images/:index` | Admin | Image bytes. |
| POST | `/admin/media/items/:id/images?type=` | Admin | Upload image (multipart `image`, ≤ 15 MB). |
| DELETE | `/admin/media/items/:id/images/:index` | Admin | Delete image. |
| GET | `/admin/media/items/:id/subtitles` | Admin | List subtitle tracks (`{tracks, configured}`). |
| POST | `/admin/media/items/:id/subtitles/search` | Admin | Search OpenSubtitles `{query?, languages?}`. |
| POST | `/admin/media/items/:id/subtitles/download` | Admin | Download `{fileId, language}`. |
| DELETE | `/admin/media/items/:id/subtitles?file=` | Admin | Delete a subtitle file. |

## Indexer – `/admin/indexer`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/indexer/status` | Admin | `{reachable, scans, queues, concurrency, maxConcurrency, enabledProviders}`. |
| POST | `/admin/indexer/libraries/:id/scan` | Admin | Start a scan; body `{force?: boolean}` re-reads everything. |
| POST | `/admin/indexer/refresh` | Admin | Refresh one item `{libraryId, path, itemType}`. |
| GET | `/admin/indexer/tasks?queue&state&page&size` | Admin | List queue tasks; `state` ∈ pending, active, scheduled, retry, archived, completed. |
| POST | `/admin/indexer/tasks/:queue/:id/cancel` | Admin | Cancel a task. |
| POST | `/admin/indexer/tasks/:queue/:id/retry` | Admin | Retry a task. |
| POST | `/admin/indexer/queues/:queue/pause` | Admin | Pause a queue. |
| POST | `/admin/indexer/queues/:queue/resume` | Admin | Resume a queue. |
| PUT | `/admin/indexer/concurrency` | Admin | Set workers per queue, e.g. `{"identify": 8}` (1–64); persisted in `indexer_concurrency`. |

Valid queues: `scan`, `identify`, `metadata`, `images`, `probe`, `refresh` (otherwise `404`). An unreachable indexer yields `503`.

The *indexer-facing* signed endpoints (`/indexer/*`) are listed in the [API reference](./api-reference.md#indexer-signed).

## Streams – `/admin/streams`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/streams` | Admin | Streamer sessions + `transcodingAvailable`, `maxTranscodes`, `activeTranscodes`. |
| DELETE | `/admin/streams/:sessionId` | Admin | Stop a playback session (204, `404` if already ended). |

## Devices – `/admin/devices`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/devices` | Admin session | All signed-in sessions as devices (parsed user agent, IP, last seen, current flag). |
| DELETE | `/admin/devices/:id` | Admin session | Sign a device out (204); your own current device is refused. |

## Network shares – `/admin/network-shares`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/network-shares` | Admin | List shares with status. |
| POST | `/admin/network-shares` | Admin | Create and connect an SMB share. |
| PATCH | `/admin/network-shares/:id` | Admin | Update; reconnects, rolls back on failure. |
| POST | `/admin/network-shares/:id/reconnect` | Admin | Retry the connection. |
| DELETE | `/admin/network-shares/:id` | Admin | Unmount/delete; `409` if a library uses it. |

## Users – `/admin/users`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/users` | Admin session | List users. |
| POST | `/admin/users` | Admin session | Create a user (`409` duplicate username/e-mail). |
| PATCH | `/admin/users/:id` | Admin session | Update displayName, email, role, disabled. You cannot change your own role or disable yourself. |
| POST | `/admin/users/:id/avatar` | Admin session | Set avatar (multipart). |
| DELETE | `/admin/users/:id/avatar` | Admin session | Remove avatar. |
| PUT | `/admin/users/:id/password` | Admin session | Set a password (204). |
| DELETE | `/admin/users/:id/sessions` | Admin session | Revoke the user's sessions (`{revoked}`). |
| DELETE | `/admin/users/:id` | Admin session | Delete (204); not yourself. |

## API keys – `/admin/api-keys`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/api-keys` | Admin session | List keys (name, prefix, dates – never the secret). |
| POST | `/admin/api-keys` | Admin session | Create `{name}`; the full key is returned once. |
| DELETE | `/admin/api-keys/:id` | Admin session | Revoke (204). |

## Settings and e-mail

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/settings` | Bearer | All settings for admins, only public ones for others (secrets masked). |
| PUT | `/settings/:key` | Admin | Update a setting (`404` unknown key). Validated per key; SMTP changes reset the mailer, Sentry changes re-apply, indexer keys trigger an indexer reload. |
| POST | `/settings/email/test` | Admin session | Send a test e-mail. |

## Jobs – `/jobs` (pg-boss)

All **Admin**. Only the queue `cleanup-expired-user-sessions` (cron `0 * * * *`) is currently supported.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/jobs/queues` | Queue stats. |
| GET | `/jobs/queues/:queueName/jobs?limit=` | List jobs (limit 1–1000). |
| GET | `/jobs/queues/:queueName/jobs/:jobId` | Job detail. |
| POST | `/jobs/queues/:queueName/jobs` | Enqueue a job. |
| POST | `/jobs/queues/:queueName/jobs/:jobId/retry` | Retry. |
| DELETE | `/jobs/queues/:queueName/jobs/:jobId` | Delete. |
| GET | `/jobs/schedules` | List schedules. |
| PUT | `/jobs/schedules/:queueName` | Set schedule `{cron, data}`. |
| DELETE | `/jobs/schedules/:queueName` | Remove schedule. |

## Logs

The live log feed is a WebSocket (`/api/logs/stream`, admin) – see [Real-time](./realtime.md). There is no REST log endpoint.

## Real-time companion

Most dashboard data above is also pushed over `/api/live` ([Real-time](./realtime.md)).
