---
sidebar_position: 2
title: Environment variables
description: Cross-service summary of the most important environment variables.
---

# Environment variables

This page summarises the variables that tie services together. Each service's own configuration page is the complete reference:
[flixer](../flixer/configuration.md), [flixer-web](../flixer-web/configuration.md), [flixer-streamer](../flixer-streamer/configuration.md), [flixer-indexer](../flixer-indexer/configuration.md).

## Shared

| Variable | Services | Meaning |
| --- | --- | --- |
| `STREAM_TOKEN_SECRET` | flixer, streamer, indexer | Must be identical everywhere. 32+ random bytes. |
| `FLIXER_URL` | streamer, indexer | Base URL of the flixer API. |
| `LOG_LEVEL` | streamer, indexer | `debug`, `info`, `warn`, `error`. |
| `LOG_DIR` | flixer, streamer | Write JSON logs for Alloy/Loki (native dev). |

## flixer

| Variable | Meaning |
| --- | --- |
| `DATABASE_URL`, `DATABASE_POOL_MAX` | Postgres connection and pool size. |
| `JWT_SECRET` | Access-token signing. |
| `FLIXER_PUBLIC_URL`, `HTTP_PORT` | Public address and published proxy port. |
| `MEDIA_PATH` (Docker) / `STREAM_MEDIA_ROOT` | Root media folder(s); `STREAM_MEDIA_ROOT` accepts a JSON array natively. |
| `AVATAR_PATH`, `MEDIA_IMAGE_PATH` / `MEDIA_IMAGE_DIR` | Avatar and uploaded image storage. |
| `APP_URL`, `PASSKEY_RP_ID`, `PASSKEY_ORIGINS` | Passkey (WebAuthn) configuration; must match the browser address. |
| `STREAMER_PUBLIC_URL`, `STREAMER_INTERNAL_URL`, `INDEXER_URL` | How flixer reaches the other services. |
| `INDEXER_MAX_WRITES`, `INDEXER_MAX_QUEUED_WRITES` | Backpressure on indexer writes. |
| `SMB_MOUNT_DIR`, `SMB_MOUNT_PATH` | Network share mount locations (Linux/macOS/Docker). |

Email (SMTP), OpenSubtitles credentials and metadata provider keys are configured in the admin dashboard, not in `.env`.

## flixer-streamer

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `8091` | Listen port. |
| `FFMPEG_PATH`, `FFPROBE_PATH` | `ffmpeg`, `ffprobe` | Binaries. |
| `MAX_TRANSCODES` | `0` | Concurrent ffmpeg jobs; 0 is unlimited. |
| `ALLOWED_ORIGINS` | empty | Comma-separated CORS origins. |
| `TRANSCODE_DIR` | `./cache/transcode` | Scratch space. |

## flixer-indexer

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT`, `ROLE` | `8092`, `all` | Listen port; `all`, `api` or `worker`. |
| `REDIS_ADDR`, `REDIS_PASSWORD`, `REDIS_DB` | `localhost:6379` | Task queue. |
| `CACHE_PATH` | `./cache/metadata` | Artwork for cache image storage. |
| `CONCURRENCY_*` | see config page | Initial workers per queue; adjustable at runtime from the dashboard. |
| `TMDB_API_KEY` and others | empty | Fallbacks; flixer settings take precedence. |
| `FLIXER_MODE=stub` | unset | Run without flixer for testing. |
