---
sidebar_position: 2
title: Configuration
description: Runtime environment variables, defaults, and configuration supplied dynamically by flixer.
---

# Configuration

The service reads the process environment and then fills unset values from `.env` in its **current working directory**. Existing environment values win over `.env`. Empty values for variables read through the default helper generally use the documented default; credential variables read directly from the environment remain empty. See `internal/config/config.go`, `.env.example`, and the Docker files.

## Runtime environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `8092` | HTTP listen port. A leading `:` is accepted and removed; valid range is 1–65535. |
| `ROLE` | `all` | `all`, `api`, or `worker`. `api` skips worker startup; `worker` still serves the HTTP API while starting workers. |
| `FLIXER_URL` | `http://localhost:8083` | Base URL for the flixer internal indexer endpoints. |
| `FLIXER_INTERNAL_URL` | `http://localhost:8083` | Backward-compatible fallback alias used only when `FLIXER_URL` is unset/blank. |
| `APP_SECRET` | required | Shared HMAC secret used for both directions of indexer/flixer requests. If blank, `JWT_SECRET` is used. Either secret must be at least 32 bytes. |
| `JWT_SECRET` | none | Legacy fallback for `APP_SECRET`; subject to the same minimum length. |
| `REDIS_ADDR` | `localhost:6379` | Redis address used by Asynq and scan-progress storage. |
| `REDIS_PASSWORD` | empty | Redis password. |
| `REDIS_DB` | `0` | Redis database number; must be a non-negative integer. |
| `CACHE_PATH` | `./cache/metadata` | Artwork cache directory. Made absolute at startup when possible. With Docker, the image sets `/var/cache/flixer/indexer`. |
| `TRICKPLAY_ENABLED` | `true` | Automatically queue hover-seek thumbnail generation after video items are successfully upserted. |
| `SUBTITLE_DIR` | `<CACHE_PATH>/subtitles` | Where subtitles are stored when the media folder is read-only. Flixer-streamer reads the same directory. |
| `TRICKPLAY_DIR` | `<CACHE_PATH>/trickplay` | Directory containing per-item trickplay folders. Mount the same directory read-only into flixer-streamer. |
| `TRICKPLAY_INTERVAL` | `10` | Thumbnail spacing, in seconds; valid range 2–60. |
| `TRICKPLAY_WIDTH` | `320` | Thumbnail width in pixels; valid range 80–640. Height follows the video aspect ratio and is even. |
| `FFPROBE_PATH` | `ffprobe` | Executable path/name used to inspect media files. |
| `FFMPEG_PATH` | `ffmpeg` | Executable used for embedded artwork extraction. |
| `CONCURRENCY_SCAN` | `2` | Initial worker count for the `scan` queue. |
| `CONCURRENCY_IDENTIFY` | `12` | Initial worker count for `identify`. |
| `CONCURRENCY_METADATA` | `12` | Initial worker count for `metadata`. |
| `CONCURRENCY_IMAGES` | `8` | Initial worker count for `images`. |
| `CONCURRENCY_PROBE` | `6` | Initial worker count for `probe`. |
| `CONCURRENCY_REFRESH` | `4` | Initial worker count for `refresh`. |
| `CONCURRENCY_TRICKPLAY` | `1` | Initial worker count for long-running thumbnail sheet generation. |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`/`warning`, or `error`. |
| `USER_AGENT` | `flixer-indexer/1.0 (+https://github.com/flixermedia/flixer-indexer)` | User-Agent sent to external HTTP services. |
| `METADATA_LANGUAGE` | `en` | Fallback language requested from metadata providers. |
| `TMDB_API_KEY` | empty | Fallback TMDB key if flixer does not supply one. |
| `TVDB_API_KEY` | empty | Fallback TVDB key. |
| `OMDB_API_KEY` | empty | Fallback OMDb key. |
| `FANART_API_KEY` | empty | Fallback Fanart.tv key. |
| `AUDIODB_API_KEY` | empty | Fallback TheAudioDB key. |
| `DISCOGS_TOKEN` | empty | Fallback Discogs token. |
| `ANIDB_CLIENT` | empty | Fallback registered AniDB client name; AniDB lookups require a known AniDB ID. |
| `LYRICS_FETCH` | enabled (`true`) | Set to `false` (case-insensitive) to disable automatic missing-LRC lookup. |
| `OPENSUBTITLES_API_KEY` | empty | OpenSubtitles API key; without it subtitle integration is inactive. |
| `OPENSUBTITLES_USERNAME` | empty | OpenSubtitles account name, needed for downloading, not searching. |
| `OPENSUBTITLES_PASSWORD` | empty | OpenSubtitles account password, needed for downloading. |
| `SUBTITLE_LANGUAGES` | `METADATA_LANGUAGE`, or `en` | Comma-separated preferred subtitle language codes; blank entries are discarded. |
| `SUBTITLE_AUTO_FETCH` | enabled (`true`) | Set to `false` (case-insensitive) to disable automatic subtitle downloads during indexing. Manual subtitle API routes remain available when configured. |
| `FLIXER_MODE` | normal client | Set to `stub` (case-insensitive) to use a JSON-file library source and JSONL output instead of flixer HTTP calls. |
| `STUB_LIBRARIES_FILE` | empty | In stub mode, JSON input containing `{"libraries":[...]}`. |
| `STUB_OUTPUT_FILE` | `./cache/stub-items.jsonl` | In stub mode, append one indexed item per JSONL line. |

All seven `CONCURRENCY_*` values must be integers from 1 to 64. Queue names are `scan`, `identify`, `metadata`, `images`, `probe`, `refresh`, and `trickplay`. Runtime controls are described in [Queues and workers](./queues-and-workers.md).

The `.env.example` lists the provider keys, but the current source also accepts the OpenSubtitles and lyrics variables above. They may be supplied to the process even when absent from that example file.

## Settings and library data from flixer

Outside stub mode, the indexer retrieves library definitions from flixer's signed `GET /api/indexer/libraries` endpoint and dynamic settings from `GET /api/indexer/settings`. The folder contract includes `rootId`, flixer-relative `path`, and `absolutePath`; scanning uses `absolutePath` as visible inside the indexer process. The indexer does not receive SMB credentials or mount instructions through this contract. See [Network shares](./network-shares.md).

Flixer settings include a provider map (`enabled`, `apiKey`), per-queue concurrency, preferred metadata `language`, and optional subtitle settings. A non-empty key from flixer takes precedence over the environment fallback. An explicitly disabled provider stays disabled. Keyless integrations (AniList, MusicBrainz, and Cover Art Archive) are enabled unless explicitly disabled. A library's non-empty `providers` list can further restrict the registry for that library.

When flixer supplies a non-empty OpenSubtitles API key, its subtitle settings are used; if its language list is empty, the indexer falls back to `SUBTITLE_LANGUAGES`/`METADATA_LANGUAGE`. Otherwise the environment subtitle configuration is used. Settings are loaded at startup and polled once a minute; an authenticated reload route is also available.

## Docker Compose interpolation variables

These names are Compose substitutions, not all indexer runtime settings. `docker-compose.yml` uses `INDEXER_ROLE` (`all`), `FLIXER_URL` (`http://flixer:8083`), required `APP_SECRET`, `INDEXER_LOG_LEVEL` (`info`), `METADATA_LANGUAGE` (`en`), provider keys (empty), `MEDIA_PATH` (`../flixer-data/media`), and `INDEXER_PORT` (`8092`). `docker-compose.dev.yml` uses `REDIS_PORT` (`6379`). The Compose stack sets Redis to its service address; it does not pass Redis password/database configuration. `INDEXER_MAX_WRITES` is a **flixer-side** write limiter setting, not an indexer variable; see [Queues and workers](./queues-and-workers.md).
