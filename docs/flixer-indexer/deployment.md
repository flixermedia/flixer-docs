---
sidebar_position: 9
title: Deployment
description: Docker Compose and native deployment requirements, storage mounts, health checks, and platform notes.
---

# Deployment

## Docker Compose

The production `docker-compose.yml` defines Redis 7 and the indexer. Redis uses append-only persistence and a named volume; the indexer waits for Redis health. The indexer container exposes port 8092 by default, mounts a media root at `/media`, and mounts a named artwork cache at `/var/cache/flixer/indexer`. Configure `FLIXER_URL` so it resolves from the indexer container (Compose defaults to `http://flixer:8083`) and provide `STREAM_TOKEN_SECRET`. The indexer and flixer must use the same secret and media path view.

The Dockerfile builds a static Linux binary with Go 1.26 on Alpine and runs it in Alpine 3.22. Runtime dependencies include CA certificates, curl for the health check, and ffmpeg (which supplies `ffprobe`). The container runs as non-root UID 65532, declares port 8092, and checks `GET /health` every 15 seconds. Docker defaults `PORT=8092`, `FFMPEG_PATH=ffmpeg`, `FFPROBE_PATH=ffprobe`, and `CACHE_PATH=/var/cache/flixer/indexer`.

The Compose file's `MEDIA_PATH` volume is read-write in the example for alongside artwork and optional subtitle/lyrics files. For all-cache artwork with no sidecar downloads, it may be made read-only, but the process still needs read access. `CACHE_PATH` must be writable. Provider keys are optional; configure them in flixer settings or pass environment fallbacks. The Compose example does not provide OpenSubtitles variables or Redis password/database overrides; add those to the service environment if needed. See `Dockerfile`, `docker-compose.yml`, and `.env.example`.

`docker-compose.dev.yml` starts only an isolated Redis service and publishes port 6379 by default. Run the indexer natively alongside it, usually with `REDIS_ADDR=localhost:6379`.

## Native run

Install Go 1.26 or newer compatible with `go.mod`, Redis, and the FFmpeg tools. Ensure `ffprobe` and `ffmpeg` are on `PATH` or set `FFPROBE_PATH` and `FFMPEG_PATH`. From the `flixer-indexer` repository root:

```powershell
go run ./cmd/flixer-indexer
```

Set `PORT`, `FLIXER_URL`, `STREAM_TOKEN_SECRET`, `REDIS_ADDR`, and any provider/subtitle settings in the process environment or `.env` in the current working directory. The process fails at startup if the secret is shorter than 32 bytes or Redis cannot be reached. For local pipeline work without the flixer API, `FLIXER_MODE=stub` loads `STUB_LIBRARIES_FILE` JSON (`{"libraries":[...]}`) and appends resulting items to `STUB_OUTPUT_FILE` JSONL.

## Linux and Windows path considerations

The shipped Docker image is Linux-based. A native Go run can use host-installed FFmpeg/Redis on Windows or Linux, but all absolute library paths must be valid to the service process. On Windows, set executable paths to actual executables (for example, `ffprobe.exe`) when they are not discoverable on `PATH`; use paths visible to the account running the indexer. A container cannot directly use a host path string: map the host directory into the container and configure flixer to return the container path, such as `/media/Movies`.

There is no SMB mount helper in the indexer. Mount network shares outside the service. If `imageStorage=alongside` or automatic subtitles/lyrics are required, media folders must be writable. See [Network shares](./network-shares.md).
