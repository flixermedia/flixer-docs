---
sidebar_position: 1
title: Deployment
description: Running Flixer in production with Docker Compose and nginx.
---

# Deployment

The reference deployment is `docker-compose.yml` in the `flixer` repository.

| Container | Image | Internal port | Notes |
| --- | --- | --- | --- |
| `api` | `ghcr.io/flixermedia/flixer` | 8081 | Mounts media read-only plus avatar and image folders. |
| `streamer` | `ghcr.io/flixermedia/flixer-streamer` | 8091 | Media read-only; transcode cache. |
| `indexer` | `ghcr.io/flixermedia/flixer-indexer` | 8092 | Media read-write so artwork can be stored next to media (use `:ro` if every library uses cache image storage). |
| `redis` | `redis:7-alpine` | 6379 | Append-only persistence. |
| `web` | `ghcr.io/flixermedia/flixer-web` | 80 | Static frontend. |
| `proxy` | built from `deploy/proxy` | 80 (published as `HTTP_PORT`) | nginx front door. |

PostgreSQL is **not** part of the compose file; supply `DATABASE_URL`.

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
| `indexer-cache` | Artwork for libraries with cache image storage. |
| `${AVATAR_PATH}`, `${MEDIA_IMAGE_PATH}` | Avatars and images uploaded in the media editor. |

## SMB and observability overlays

- `docker-compose.smb.yml` adds mount support for network shares.
- `docker-compose.observability.yml` adds Loki, Alloy and Grafana for logs.
