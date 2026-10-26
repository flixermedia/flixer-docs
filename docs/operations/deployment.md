---
sidebar_position: 1
title: Deployment
description: Running Flixer in production with Docker Compose and nginx.
---

# Deployment

The reference deployment is `docker-compose.yml` in the `flixer` repository.

| Container | Image | Internal port | Notes |
| --- | --- | --- | --- |
| `api` | `ghcr.io/flixermedia/flixer` | 8081 | Mounts media read-only plus data folders under `DATA_DIR`. |
| `streamer` | `ghcr.io/flixermedia/flixer-streamer` | 8091 | Media read-only; transcode cache. |
| `indexer` | `ghcr.io/flixermedia/flixer-indexer` | 8092 | Media read-write so artwork can be stored next to media (use `:ro` if every library uses cache image storage). |
| `postgres` | `postgres:16-alpine` | 5432 | Bundled database; data is stored in `DATA_DIR/database`. |
| `redis` | `redis:7-alpine` | 6379 | Append-only persistence. |
| `web` | `ghcr.io/flixermedia/flixer-web` | 80 | Static frontend. |
| `proxy` | built from `deploy/proxy` | 80 (published as `HTTP_PORT`) | nginx front door. |

## Proxy routing

`deploy/proxy/nginx.conf` routes by path:

| Path | Upstream | Notes |
| --- | --- | --- |
| `/api/` | api | 120s read timeout. |
| `/api/live` | api | WebSocket upgrade, 1h timeout, no buffering. |
| `/api/logs/stream` | api | WebSocket upgrade for the live log viewer. |
| `/socket.io/` | api | WebSocket upgrade. |
| `/stream/` | streamer | Range requests, no buffering, 1h timeouts. |
| `/hls/`, `/info/` | streamer | |
| `/lyrics/`, `/subtitles/` | streamer | |
| `/` | web | Everything else. |

:::caution
If you put your own reverse proxy in front, it must forward WebSocket upgrades for `/api/live` and `/api/logs/stream`, or the admin dashboard will not update live.
:::

## TLS

The bundled proxy listens on plain HTTP. Terminate TLS in front of it and set `FLIXER_PUBLIC_URL`, `APP_URL` and `PASSKEY_ORIGINS` to the `https://` address. Passkeys require a secure context.

## Health checks

`api` (TCP 8081), `streamer` (`/healthz`), `web` (HTTP `/`) and `proxy` (`/healthz`) have container health checks; the proxy waits for the first three.

## Volumes

| Volume | Purpose |
| --- | --- |
| `redis-data` | Indexer queue persistence. |
| `${DATA_DIR}/avatars` | User avatars. |
| `${DATA_DIR}/config` | SQLite bootstrap config and encryption key. |
| `${DATA_DIR}/cache` | Media images, people photos, themes, subtitles and trickplay. |
| `${DATA_DIR}/database` | Bundled PostgreSQL data. |
| `${DATA_DIR}/backups` | Backup archives. |

## SMB and observability overlays

- `docker-compose.smb.yml` adds mount support for network shares.
- `docker-compose.observability.yml` adds Loki, Alloy and Grafana for logs.

## Updating from the dashboard

Admin → Updates shows the running version of the API, web, streamer and indexer next to the newest GitHub release of each, and can update everything with one click. The updater is part of the standard stack, so a plain `docker compose up -d` starts it. There is no token to configure: Flixer and the updater derive it from the app secret they already share.

Only the [flixer-updater](https://github.com/flixermedia/flixer-updater) sidecar mounts `/var/run/docker.sock`; Flixer just calls its token-protected HTTP API on the internal network. It acts only when an admin presses **Update all** (or turns on automatic updates, which are off by default). The project folder is mounted into it at the same path as on the host (`PROJECT_DIR`, default the current directory) so it can run `docker compose`.

An update runs these steps, shown live in the dashboard:

1. A `pg_dump` of the database (using the database URL Flixer is configured with) is written to `$DATA_DIR/backups` (the latest 5 are kept). If it fails, nothing is changed.
2. The new release of each outdated component is pinned in the updater's state volume (`versions.env`, read through the `${*_VERSION:-latest}` image tags) and the images are pulled.
3. Services are recreated one at a time (streamer, indexer, web, API) and each must become healthy.
4. If one fails, the previous releases are restored automatically and the run is reported as rolled back. A component whose previous version was not a known release (for example a `latest` or dev build) cannot be restored and is reported.
5. The proxy is restarted so it finds the new containers.

The dashboard is unavailable for a minute while the API restarts. Restore the database from a backup with `pg_restore` if a release changed the schema.

Pinned versions persist, so a manual `docker compose up` without the updater's `versions.env` falls back to `latest`. The updater cannot update itself: pull a new `flixer-updater` image manually.

Images built before this feature do not report their version, so those components show as not reachable until they are updated manually once.
