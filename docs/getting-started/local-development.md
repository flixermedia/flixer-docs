---
sidebar_position: 3
title: Local development
description: Run flixer, flixer-web, flixer-streamer and flixer-indexer natively.
---

# Local development

The four repositories are expected side by side:

```text
Developer/
  flixer/            API
  flixer-web/        Vue frontend
  flixer-streamer/   Go streamer
  flixer-indexer/    Go indexer
  flixer-data/       media, avatars, media-images (default MEDIA_PATH etc.)
  flixer-docs/       this site
```

## Default ports

| Service | Dev port | Notes |
| --- | --- | --- |
| flixer-web (Vite) | `5174` | HTTPS in dev when certificates exist in `certs/`. |
| flixer API | `8083` | Vite proxies `/api` here. |
| flixer-streamer | `8091` | Vite proxies `/stream`, `/info`, `/hls`, `/lyrics`, `/subtitles` here. |
| flixer-indexer | `8092` | Internal; only flixer talks to it. |
| Redis | `6379` | Indexer task queue. |

Check each service's configuration page for the authoritative variable list.

## Start order

1. Postgres and Redis.
2. `flixer` (the streamer and indexer ask it for libraries on startup).
3. `flixer-streamer` and `flixer-indexer`.
4. `flixer-web`.

```bash
# flixer
cd flixer && npm install && npm run start:dev

# flixer-streamer (needs ffmpeg + ffprobe on PATH)
cd flixer-streamer && go run ./cmd/...

# flixer-indexer
cd flixer-indexer && go run ./cmd/...

# flixer-web
cd flixer-web && npm install && npm run dev
```

See each service's `development` page for exact scripts, tests and conventions.

## Restarting after changes

- **flixer**: restart for any API or WebSocket change.
- **flixer-streamer / flixer-indexer**: Go changes need a rebuild and restart.
- **flixer-web**: Vite hot-reloads; hard-reload the page after player changes to drop cached modules.
