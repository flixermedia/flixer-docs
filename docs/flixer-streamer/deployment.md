---
sidebar_position: 8
title: Deployment
description: Building and running the streamer on Windows, Linux, or Docker with FFmpeg, media roots, and logs.
---

# Deployment

The streamer is a single Go HTTP service. See `Dockerfile` for the maintained container build and `.github/workflows/docker.yml` for the image publishing workflow. Configure the shared token secret before starting; `.env.example` contains a placeholder, not a usable secret.

## Runtime requirements

- Go 1.25 or later to build from source (`go.mod` declares Go 1.25.0).
- FFmpeg **and** FFprobe available on `PATH` or configured through `FFMPEG_PATH` and `FFPROBE_PATH` to enable probing, remuxing, transcoding, and HLS. If they cannot be found when the process starts, it continues with FFmpeg-dependent features disabled.
- Read access to the media-root paths returned by Flixer. The same root path must resolve inside the process/container.
- Network access to `FLIXER_URL` for root synchronization and optional Sentry configuration. The streamer can start if those requests fail; roots remain unavailable until a successful sync.

## Build and run on Windows

From the repository root in PowerShell, set the required secret in the environment (use a random value of at least 32 bytes and the matching Flixer-side value):

```powershell
$env:STREAM_TOKEN_SECRET = '<your-shared-random-secret>'
$env:FLIXER_URL = 'http://localhost:8083'
go build -o flixer-streamer.exe ./cmd/flixer-streamer
.\flixer-streamer.exe
```

Install FFmpeg/FFprobe and ensure both commands are discoverable, or set their executable paths before launch. You may also copy `.env.example` to `.env`; it is read from the current working directory and process environment values take precedence. The default listener is `:8091`.

## Build and run on Linux

```sh
export STREAM_TOKEN_SECRET='<your-shared-random-secret>'
export FLIXER_URL='http://localhost:8083'
go build -o flixer-streamer ./cmd/flixer-streamer
./flixer-streamer
```

The same `.env` behavior and FFmpeg requirements apply. Use a service manager or container orchestrator to supervise the process and provide secrets securely rather than embedding them in scripts or images.

## Docker

The multi-stage `Dockerfile` builds a static Linux binary with Go 1.25 Alpine and uses Alpine 3.22 at runtime. The runtime image installs CA certificates, `curl`, and FFmpeg; it runs as unprivileged user `streamer` (UID 65532), exposes port 8091, and sets `TRANSCODE_DIR=/var/cache/flixer/transcode`. Its health check calls `/healthz`. The cache directory is currently not used for HLS/transcode output because FFmpeg streams through pipes.

Build locally from the `flixer-streamer` repository:

```sh
docker build -t flixer-streamer:local .
```

Provide `STREAM_TOKEN_SECRET` and `FLIXER_URL` at runtime. Mount media read-only and ensure the Flixer-returned root paths match the container mount paths and are readable by the unprivileged user. The Dockerfile does not copy a `.env` file into the image. Do not mount or expose arbitrary filesystem paths beyond managed media roots.

## Logs and health

Service logs are structured JSON to stdout. Set `LOG_LEVEL` to choose the minimum service log level. When `LOG_DIR` is set, the same JSON records are also written to `LOG_DIR/streamer.log`, rotated at 10 MiB with three backups (`.1`, `.2`, `.3`). FFmpeg stderr is parsed and forwarded at `FFMPEG_LOG_LEVEL`; process start/exit records include operational metadata. Avoid logging or proxying complete tokenized URLs.

`GET /healthz` returns `200` with `status` and `activeTranscodes`; HEAD returns an empty `200`. It does not assert that Flixer roots have loaded or that FFmpeg is ready. The Docker health check therefore indicates process liveness only, not playback readiness.