---
sidebar_position: 11
title: Flixer Logger
description: Logger deployment, configuration, API, performance, troubleshooting and recovery.
---

# Flixer Logger

`flixer-logger` is the platform's structured event service. It uses Pebble for
persistent storage and serves deployment-scoped search, statistics and live
streams. Flixer Web exposes it through **Admin → Logging**; it is not a
replacement for process stdout/stderr diagnostics.

## Bundled deployment

The reference Compose stack runs `logger` as an internal-only service. It does
not publish port `8098` to the host. A one-shot certificate initializer
creates a TLS certificate for the Compose service name `logger`; producer
containers mount that public certificate read-only and verify it on requests.
The private key remains in Logger storage.

Flixer's initializer prepares `${DATA_DIR}/logs/logger` and a private owner
bootstrap directory in the shared secrets volume. Logger creates the owner
credential only for a new Pebble store, then Flixer pairs and manages the
deployment through the owner API. Compose does not require a Logger `.env`
file. Normal configuration, producer credentials and retention policies are
managed through Flixer and Flixer Web. Pin the image with `LOGGER_VERSION`.

The service writes all event data beneath `${DATA_DIR}/logs/logger`; do not
mount a different directory over `/data/logs/logger`. The container health
check uses `/api/health/ready`. For diagnostics:

```bash
docker compose logs -f logger
```

## Admin Logging page

The page provides live streaming, historical search, time and field filters,
text search, trace correlation, analytics by level/source, grouped errors,
event inspection, Logger health/capacity, producer credentials and retention
controls. Search and management calls are proxied through Flixer's authenticated
Admin API; browsers do not receive Logger management credentials.

Indexer task modals query Logger events using the exact task ID and physical
queue. Events include `task_id`, `fields.task_queue` and a stable task trace
ID. The previous Indexer Redis task-output route has been removed. Task records
at INFO and above are exported even when the Indexer's normal log level
suppresses them. Export queues are bounded and best effort; loss under
overload, a Logger outage or shutdown does not block normal work.

## API contract

All service endpoints use `/api/` paths; there is no `/api/v1/` prefix.
Common endpoints include:

| Route | Purpose |
| --- | --- |
| `POST /api/logs/batch` | Authenticated producer batch ingestion; supports gzip. |
| `POST /api/logs/search` | Indexed, deployment-scoped event search and cursor paging. |
| `GET /api/logs/stream` | Authenticated server-sent event stream. |
| `GET /api/logs/stats` | Minute buckets by severity. |
| `GET /api/logs/sources` | Counts by application and source. |
| `GET /api/logs/errors` | Grouped error and fatal events. |
| `GET /api/logs/trace/{trace_id}` | Trace-correlated event lookup. |
| `GET /api/logger/retention` / `PUT /api/logger/retention` | Deployment retention policy. |
| `GET /api/health/live` / `GET /api/health/ready` | Process liveness and storage readiness. |

The owner and deployment management routes are described in the Logger
repository's [API and operational reference](https://github.com/flixermedia/flixer-logger/blob/main/README.md).
Use scoped, short-lived credentials for external integrations; never place an
owner token in a producer or browser.

## Search and throughput bounds

Message-token search is case-insensitive and indexed; exact field, trace,
severity, time and task filters narrow the candidate set. Phrase, substring
and RE2-compatible regex modes are bounded. Searches cover at most 31 days,
return at most 200 events per page and examine at most 10,000 candidates
within a five-second budget. A too-broad query returns an explicit limit error
instead of silently truncating results.

Batch requests are limited to 2 MiB compressed and decompressed. Global and
per-deployment request concurrency and event-rate policies are enforced.
Quota and retention are logical limits: Pebble may reclaim physical disk
space later during compaction. There is no physical disk quota; monitor
filesystem capacity and configure retention.

## Retention and migration

Retention is disabled until an administrator enables a policy. Configure the
default age and optional severity-specific ages in Admin → Logging. Retention
is based on ingestion time and permanently deletes expired events. It cannot
restore removed data.

On startup, the Compose initializer moves legacy top-level entries from
`${DATA_DIR}/logs` to `${DATA_DIR}/app-logs`, preserving
`${DATA_DIR}/logs/logger`. It refuses to overwrite a colliding destination.
Flixer, Streamer and Indexer no longer write application-managed log files;
container output remains available through Docker. Redis remains in the stack
for Indexer queues, not task-log storage.

## Backup and recovery

Compose enables Pebble checkpoints. To create a consistent snapshot:

```bash
docker compose kill -s USR1 logger
```

Logger writes a private checkpoint under
`${DATA_DIR}/logs/logger/checkpoints` and reports its path in container logs.
Checkpoints contain all deployments and may contain sensitive data; protect
them and expire old copies separately. Do not copy the live Pebble directory
as a backup.

For restore, stop Logger, preserve the current store, and place a complete
checkpoint at `${DATA_DIR}/logs/logger/pebble` before starting Logger again.
Restore orchestration and scheduled managed backups are not provided.

## Troubleshooting

- **Logger is unhealthy:** inspect `docker compose logs logger` and verify
  `${DATA_DIR}/logs/logger` is writable by UID 1000 in the bundled image.
- **TLS verification fails:** ensure `logger-cert-init` completed and the
  certificate at `${DATA_DIR}/logs/logger/tls.crt` is mounted into each
  producer. Restart Node and Go producers after replacing a certificate.
- **Flixer remains unpaired:** check that API and Logger share the Compose
  secrets volume and that `/run/flixer-secrets/logger` is private and owned by
  the API/Logger UID. Flixer retries bootstrap asynchronously.
- **Events are missing:** check the Logger connection and producer health in
  Admin → Logging, review producer stderr diagnostics, and confirm the
  retention window and filters. Export is best effort.
- **Search returns a limit error:** narrow the time range and add indexed
  application, source, severity, trace or task filters before substring or
  regex matching.
- **Disk usage remains high after retention:** Pebble reclaims physical space
  during compaction; logical quota usage is not a physical disk measurement.
