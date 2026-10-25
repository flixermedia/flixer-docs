---
sidebar_position: 5
title: Queues and workers
description: Asynq queues, worker concurrency, control endpoints, retry policy, and flixer write backpressure.
---

# Queues and workers

Tasks are stored in Redis and executed with Asynq. The pipeline and queue names are defined in `internal/config/config.go`; handlers and retry behavior are in `internal/pipeline/`.

## Queue map

| Queue | Task type | Default initial workers | Timeout |
| --- | --- | ---: | --- |
| `scan` | `scan:library` | 2 | 12 hours |
| `identify` | `identify:item` | 12 | 5 minutes |
| `metadata` | `metadata:fetch` | 12 | 5 minutes |
| `images` | `images:fetch` | 8 | 5 minutes |
| `probe` | `probe:item` | 12 | 3 minutes |
| `refresh` | `refresh:item` | 4 | 5 minutes |
| `trickplay` | `trickplay:item` | 6 | 3 hours |
| `themes` | `themes:item` | 6 | 15 minutes |

Each task's log output (the start and end of every attempt, plus the handler's info, warning and error lines) is stored in Redis for 7 days, capped at 1000 lines, and can be read from the admin dashboard while the task runs or after it fails.

Each queue has its own Asynq server so worker counts can be changed independently. Environment settings `CONCURRENCY_SCAN`, `CONCURRENCY_IDENTIFY`, `CONCURRENCY_METADATA`, `CONCURRENCY_IMAGES`, `CONCURRENCY_PROBE`, `CONCURRENCY_REFRESH`, `CONCURRENCY_TRICKPLAY`, and `CONCURRENCY_THEMES` set initial counts. The allowed range is 1–64. Settings from flixer are polled once a minute; changes are applied by restarting that queue's worker server. During a restart, running jobs get up to 30 seconds to finish and are then requeued. `ROLE=api` starts no worker pool; `ROLE=worker` runs workers and serves the HTTP API as well.

Tasks are unique for 30 minutes and completed tasks are retained for two hours. A scan task is configured with zero retries. Item stages and refresh use up to three retries with Asynq's default retry-delay function; trickplay generation uses one retry and a duration-scaled timeout capped at three hours. A terminal failure of an item task is reflected in scan progress; malformed task payloads and unknown-library cases marked `SkipRetry` do not benefit from retries. The final probe can proceed to persistence without technical details after its retries are exhausted.

## Queue control and status

Authenticated controls are available through the routes in [HTTP API](./http-api.md):

- `GET /internal/concurrency` returns the running counts and maximum; `POST` accepts a partial queue-to-count map.
- `POST /internal/queues/{queue}/pause` and `/resume` pause or resume an Asynq queue.
- `GET /internal/tasks` lists a queue's pending, active, scheduled, retry, archived, or completed tasks with pagination.
- Task-specific `cancel` and `retry` routes operate on Asynq task IDs.
- `GET /internal/stats` reports queue `pending`, `active`, `scheduled`, `retry`, `archived`, `completed`, `processed`, `failed`, `paused`, and `latencyMs`, plus scan snapshots. Provider stats/enabled names and worker concurrency are included when available.

A scan snapshot contains `libraryId`, `state`, `discovered`, `done`, `failed`, and optional `startedAt`, `finishedAt`, `error`. See [Scanning pipeline](./scanning-pipeline.md).

## Write backpressure with flixer

Indexer queue concurrency limits concurrent work in the indexer, but flixer separately limits how many item writes reach its database. In the flixer repository, `INDEXER_MAX_WRITES` defaults to `3`; `INDEXER_MAX_QUEUED_WRITES` defaults to `200`. The flixer `WorkLimiter` queues writes up to that bound and returns HTTP `429` when the waiting queue is full. These are **flixer** settings, not indexer environment variables.

The indexer HTTP client treats non-429 4xx responses from flixer as permanent failures; HTTP 429 is deliberately not permanent, so Asynq can retry the upsert using its default retry delay. Other non-2xx statuses and transport errors are retryable as well. In deployments, size `INDEXER_MAX_WRITES` for flixer's database connection budget and tune the indexer's `probe`/upstream concurrency to avoid excessive pressure; do not mistake a higher worker count for higher safe write throughput. Sources: flixer `src/api/indexer/workLimiter.ts`, `.env.example`, and indexer `internal/flixerclient/client.go`.

## Trickplay backfill

`POST /internal/scan` accepts `{"libraryId":"…","trickplayOnly":true}` to walk a library and queue eligible movie, episode, and video items directly to `trickplay`. It does not start or update scan progress and never prunes. The normal scan and trickplay-only request have different task payloads, so they do not collide under Asynq uniqueness. Generation checks the source size and RFC3339 modification time against `index.json`; matching files are cheap no-ops.
