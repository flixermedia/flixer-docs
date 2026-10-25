---
sidebar_position: 3
title: HTTP API
description: Internal endpoints, request and response contracts, and service-to-service authentication.
---

# HTTP API

The indexer listens on `PORT` (default `8092`). `GET /health` is the only unauthenticated route. Every `/internal/*` route requires the shared signature. JSON request bodies are limited to 1 MiB. Errors are JSON objects of the form `{"error":"message"}` unless an endpoint returns image bytes.

## Authentication and flixer contract

Both sides sign requests with `APP_SECRET` (or its `JWT_SECRET` fallback). The request carries `X-Indexer-Timestamp` (Unix seconds) and `X-Indexer-Signature` (hex HMAC-SHA256) over:

```text
flixer-indexer:v1:<timestamp>:<METHOD>:<URL path>:<hex SHA-256 of body>
```

The verifier allows at most five minutes of clock skew and compares signatures in constant time. The same scheme authenticates indexer requests to flixer and flixer requests to the indexer. The secret itself is never sent. Source: `internal/auth/auth.go`, `internal/api/api.go`, and `internal/flixerclient/client.go`.

The indexer reads `GET /api/indexer/libraries` as `{"libraries":[...]}` and `GET /api/indexer/settings` as settings JSON. It writes completed `models.Item` objects to `POST /api/indexer/media/items` and expects `{"id":"..."}`. After a successful complete scan it calls `POST /api/indexer/libraries/{libraryId}/prune` with `{"scanStartedAt":"<RFC3339>"}` and expects `{"removed":N}`. These flixer endpoints must implement the matching signed contract.

## Routes

All request bodies below are JSON unless noted. Path identifiers are literal route parameters. In errors, common statuses include `400` for invalid input, `401` for invalid/missing signature, `413` for oversized body, `404` for missing resources, and `500` for internal failures.

`POST /internal/scan` may include `"trickplayOnly": true` to backfill thumbnail sheets for video items. This walks the library and queues trickplay tasks without identifying items, updating scan progress, or pruning; the response keeps the usual queued/already-queued shape.

| Method and path | Request | Successful response |
| --- | --- | --- |
| `GET /health` | None; open route. | `200 {"status":"ok","redis":true}`; `503 {"status":"unavailable","redis":false}` when Redis cannot be pinged. |
| `POST /internal/scan` | `{ "libraryId": string, "force"?: boolean, "trickplayOnly"?: boolean }` | New task: `202 {"libraryId":...,"queued":true,"alreadyQueued":false}`. Duplicate: `200` and `queued:false`, `alreadyQueued:true`. `400` if invalid JSON or missing ID; `404` if flixer has no matching library. |
| `POST /internal/refresh` | `{ "libraryId": string, "path": string, "itemType": "movie"\|"series"\|"season"\|"episode"\|"album"\|"track"\|"video" }` | `202 {"queued":bool,"alreadyQueued":bool}`. Invalid fields produce `400`; unknown library produces `404`. Refresh work is forced by the worker regardless of the request's optional `force` field. |
| `GET /internal/scans` | None. | `200 {"scans":[Scan...]}`; a scan has `libraryId`, `state`, `discovered`, `done`, `failed`, and optional `startedAt`, `finishedAt`, `error`. |
| `GET /internal/stats` | None. | `200` with `queues` (queue counters and latency), `scans`, and, after settings load, `providers` and `enabledProviders`; `concurrency` is included when this process has workers. |
| `GET /internal/tasks?queue=&state=&page=&size=` | `queue` is required; states are `pending` (default), `active`, `scheduled`, `retry`, `archived`, `completed`. Page defaults to 1; page size defaults to 50 if outside 1–200. | `200 {"queue":...,"state":...,"page":N,"tasks":[...]}`. Each task has `id`, `queue`, `type`, `state`, `retried`, `maxRetry`, optional error/time and `libraryId`, `itemType`, `path`. Unknown queue/state: `400`. |
| `GET /internal/tasks/{queue}/{id}/logs?offset=N` | `offset` is the number of lines already read (default 0). | `200 {"queue","id","state","total","entries":[{"time","level","message"}]}`. `state` is empty once the task has been removed. Lines are kept for 7 days, up to 1000 per task, across all retry attempts. Unknown queue: `404`. |
| `POST /internal/tasks/{queue}/{id}/cancel` | None. | `200 {"cancelled":"id"}`. Active tasks are cancelled in processing; others are deleted. Missing task: `404`; operation conflict: `409`. |
| `POST /internal/tasks/{queue}/{id}/retry` | None. | `200 {"retrying":"id"}`. Missing task: `404`; only archived, scheduled, or retrying tasks can be run early (`409` otherwise). |
| `POST /internal/queues/{queue}/pause` | None. | `200 {"queue":"...","paused":true}`; unknown queue: `404`. |
| `POST /internal/queues/{queue}/resume` | None. | `200 {"queue":"...","paused":false}`; unknown queue: `404`. |
| `GET /internal/concurrency` | None. | `200 {"concurrency":{"scan":N,...},"max":64}`. Worker-less API role returns `409`. |
| `POST /internal/concurrency` | Partial object such as `{ "probe": 4 }`; each queue maps to an integer 1–64. | `200 {"concurrency":{"scan":N,...}}`. Worker-less API role returns `409`; invalid queue/value: `400`. |
| `POST /internal/image` | `{ "path": "<saved image path>" }` | Image file bytes with an image Content-Type. Supports JPEG, PNG, WebP, GIF; paths outside cache/library folders are rejected. |
| `POST /internal/subtitles/list` | `{ "path": "<absolute media path>" }` | `200 {"tracks":[...],"configured":bool}`. Tracks are `.srt`/`.vtt` sidecars named for that video; `configured` indicates an OpenSubtitles client is available. |
| `POST /internal/subtitles/search` | `{ "path": string, "type"?: string, "title"?: string, "seriesTitle"?: string, "year"?: number, "season"?: number, "episode"?: number, "providerIds"?: object, "seriesProviderIds"?: object, "query"?: string, "languages"?: string[] }` | `200 {"results":[...]}`; each result includes `fileId`, `language`, `release`, `fileName`, `downloads`, `hearingImpaired`, `hashMatch`, `rating`, optional `uploader`. Invalid language: `400`. |
| `POST /internal/subtitles/download` | `{ "path": string, "fileId": positive integer, "language": string }` | `200 {"file":"<saved sidecar basename>"}`. Language/file ID required (`400`). |
| `POST /internal/subtitles/delete` | `{ "path": string, "file": "<sidecar basename>" }` | `200 {"ok":true}`; absent subtitle: `404`; invalid path/file: `400`. |
| `POST /internal/settings/reload` | Empty body is valid JSON; `{}` is conventional. | `200 {"reloaded":true}`; settings unavailable from flixer: `502`; process without a reloader: `409`. |

Subtitle routes require an absolute, regular media file path inside one of the configured library folders. OpenSubtitles failures map to `503` (not configured), `429` (quota/rate limit), `404` (no match), `400` (invalid request), or `502` (upstream failure). See [Subtitles](./subtitles.md) for matching and sidecar details.
