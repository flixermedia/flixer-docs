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
| flixer-streamer | `8091` | Vite proxies `/streamer` here (media, info, HLS, lyrics, subtitles, trickplay, health and admin routes). |
| flixer-indexer | `8092` | Internal; only flixer talks to it. |
| Redis | `6379` | Indexer task queue. |
| Meilisearch | `7700` | Optional media search index; the development Compose stack publishes it on `127.0.0.1`. |

Check each service's configuration page for the authoritative variable list.

## Start order

1. Postgres, Redis and (optionally) Meilisearch.
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

### Meilisearch

The development Compose stack includes Meilisearch with persistent data under
`$DATA_DIR/meilisearch-dev` and exposes it only on `127.0.0.1:7700`. Start it with:

```bash
docker compose -f docker-compose.dev.yml up -d meilisearch
```

For a natively running Flixer API, set `MEILISEARCH_URL=http://localhost:7700` and
provide the same `APP_SECRET` to the native API and in `.env` for the development
Compose stack. The Compose API is configured to use `http://meilisearch:7700`
automatically and uses the same shared application secret as the streamer. If
Meilisearch is stopped or unavailable, media search continues to use PostgreSQL.

## Restarting after changes

- **flixer**: restart for any API or WebSocket change.
- **flixer-streamer / flixer-indexer**: Go changes need a rebuild and restart.
- **flixer-web**: Vite hot-reloads; hard-reload the page after player changes to drop cached modules.
