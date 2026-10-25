---
sidebar_position: 2
title: Configuration
description: Environment variables, defaults, media-root ownership, and startup configuration behavior.
---

# Configuration

`internal/config/config.go` is the source of truth. Configuration comes from process environment variables and, if present, a `.env` file in the process working directory. The loader reads `.env` first but does not overwrite variables already set in the process environment. There are **no command-line flags** in `cmd/flixer-streamer/main.go`.

| Variable | Default / requirement | Behavior |
| --- | --- | --- |
| `PORT` | `8091` | HTTP port, parsed as an integer from 1 through 65535. A single leading `:` is stripped, so `:8091` is accepted. The listener binds to all interfaces as `:<port>`. |
| `APP_SECRET` | Required | Shared secret for JWT verification, media-locator decryption, Flixer root-request signatures, and derivation of the admin bearer key. Must contain at least 32 bytes. This takes precedence over `JWT_SECRET`. Use the same value as the token issuer / Flixer configuration. |
| `JWT_SECRET` | No default; compatibility fallback | Used only if `APP_SECRET` is empty. It is subject to the same 32-byte minimum. |
| `FLIXER_URL` | `http://localhost:8083` | Flixer base URL. Trailing slashes are removed. Used to retrieve Sentry settings and media-root configuration. |
| `FFMPEG_PATH` | `ffmpeg` | FFmpeg executable name or path. If it cannot be found at startup, remux/transcode and HLS are disabled; the service logs a warning and continues. |
| `FFPROBE_PATH` | Sibling `ffprobe` executable | FFprobe executable name or path. If `FFMPEG_PATH` is a bare command, the default is `ffprobe`; otherwise it uses `ffprobe` beside FFmpeg and carries over the executable extension (for example, `ffprobe.exe`). Both tools must be discoverable for the transcoder to initialize. |
| `MAX_TRANSCODES` | `0` (unlimited) | Maximum simultaneous FFmpeg jobs. Must be a non-negative integer. When positive, a request can wait up to 10 seconds for a slot before receiving `503 transcoder_busy`. This limits FFmpeg jobs, not HTTP requests or FFprobe probes. |
| `FFMPEG_LOG_LEVEL` | `info` | FFmpeg stderr verbosity forwarded into streamer logs. Accepted values: `quiet`, `panic`, `fatal`, `error`, `warning`, `info`, `verbose`, `debug`, `trace`. |
| `SUBTITLE_DIR` | `<TRICKPLAY_DIR parent>/subtitles` | Subtitles the indexer stored for videos in read-only media folders. Mount it read-only from the indexer cache. |
| `TRICKPLAY_DIR` | `/data/metadata/trickplay` | Shared hover-seek thumbnail sheet directory. Mount it read-only from the indexer cache. |
| `TRANSCODE_DIR` | `./cache/transcode` | Present in configuration and documented as reserved for future use. Current progressive and HLS implementations pipe FFmpeg output and do not store transcodes here. |
| `ALLOWED_ORIGINS` | Empty | Optional comma-separated exact browser origins. If empty, requests without an `Origin` are accepted, but a request supplying an origin is denied. CORS is not authorization. |
| `LOG_LEVEL` | `info` | Minimum service log level: `debug`, `info`, `warn`/`warning`, or `error`. |
| `LOG_DIR` | Empty | When non-empty, JSON logs are written to both stdout and `LOG_DIR/streamer.log`. The directory is created as needed. The file rotates at 10 MiB with three backups. |

Invalid ports, a missing/short secret, invalid log levels, invalid FFmpeg log levels, or negative/non-numeric `MAX_TRANSCODES` prevent startup. See `.env.example` for a maintained sample; its secret value is deliberately a placeholder and must be replaced.

## Media roots

The streamer has **no media-root environment variable**. Root IDs and paths are owned by Flixer. The streamer calls `GET {FLIXER_URL}/api/streamer/media-roots`, signing the request with an HMAC-SHA256 value in `X-Streamer-Timestamp` and `X-Streamer-Signature`; the shared secret is required for this request. The response supplies root IDs and paths. `internal/flixer/roots.go` retries every two seconds until Flixer responds, then refreshes roots every minute. If a later refresh fails, the last successful root set remains in use. Unusable individual roots are skipped by `internal/media`.

The corresponding media-root setting is on the Flixer side (the streamer `.env.example` refers to Flixer's `STREAM_MEDIA_ROOT`). A configured path must exist and be readable **inside the streamer process/container**. With containers, arrange the Flixer-returned path to match the path mounted in the streamer; mount media read-only where possible. Root path administration must be restricted to trusted operators.

## Flixer dependency at startup

Before starting the HTTP server, `cmd/flixer-streamer/main.go` asks Flixer for `/api/sentry/config/streamer`. It retries for up to 60 seconds; if Flixer is unreachable or does not answer in time, the streamer continues with Sentry disabled. Root synchronization runs in a separate background goroutine and does not block the listener. This startup behavior does not mean that the streamer calls Flixer to authorize playback or obtain stream tokens.