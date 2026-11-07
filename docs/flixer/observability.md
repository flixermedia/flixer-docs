---
sidebar_position: 10
title: Observability
description: Flixer Logger, application output and health checks.
---

# Observability

## Flixer Logger

The bundled deployment exports structured events asynchronously to
`flixer-logger`. Logger uses Pebble and stores all deployment event data under
`${DATA_DIR}/logs/logger`. The internal service is not published to the host;
Flixer creates an internal TLS certificate during initialization and shares
the public certificate with producers for verification. Flixer's protected
owner-file bootstrap pairs the local deployment without requiring a Logger
`.env` file.

Administrators use **Admin → Logging** for live events, historical search,
filters, analytics, error groups, retention, capacity and credential
management. Indexer task events are also viewed from the task modal and are
queried from Logger by task ID and physical queue. Task output is not stored in
Redis. Producer queues are bounded and delivery is best effort, so a Logger
outage or overloaded queue can cause drops without blocking application work.

See the [Logger guide](./logger.md) for API routes, limits, deployment,
troubleshooting, backup and recovery.

## Application output

Applications write operational diagnostics to stdout and stderr. Use
`docker compose logs -f <service>` for immediate container diagnostics. Flixer,
Streamer, Indexer, AI and Updater also export asynchronously to Flixer Logger
when configured; logger delivery is best effort and cannot block normal
application work. Task output is stored and queried in Logger, not in Redis or
per-service files.

## Health checks

| Component | Check |
| --- | --- |
| API | Compose TCP check on port `8081`. |
| Logger | `GET /api/health/ready` over internal TLS. |
| Streamer | `GET /streamer/healthz` on `8091`. |
| Web | HTTP `/` on port `80`. |
| Proxy | `GET /healthz` returns `204`. |

The admin overview also reports uptime, versions and service reachability.
