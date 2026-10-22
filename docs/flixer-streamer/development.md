---
sidebar_position: 9
title: Development
description: Repository structure, tests, and implementation conventions for contributing to flixer-streamer.
---

# Development

The service is a Go module (`go.mod`) with the executable in `cmd/flixer-streamer` and implementation packages in `internal/`. Keep changes aligned with the actual boundaries: HTTP handling in `internal/httpserver`, token format in `internal/token`, root-safe file access in `internal/media`, and process/mode logic in `internal/transcode`.

## Tests

Run the complete Go test suite from the repository root:

```sh
go test ./...
```

Tests are colocated with packages as `*_test.go`. Coverage includes configuration validation, root resolution and refresh signing, token validation/encryption, HTTP handlers, subtitle conversion, FFmpeg plans, session lifecycle, HLS playlists, and log writers. Tests for `internal/transcode` primarily inspect generated plans and playlist content; they do not replace a real end-to-end validation against the installed FFmpeg/FFprobe binaries.

To build the service:

```sh
go build ./cmd/flixer-streamer
```

The Docker build is separate and is defined in `Dockerfile`. The CI workflow `.github/workflows/docker.yml` publishes images on pushes to `main` and manual dispatch; it is not a Go test workflow.

## Implementation conventions

- Keep FFmpeg execution as an argument array via `exec.CommandContext`; do not invoke a shell or accept FFmpeg arguments from clients.
- Resolve token-provided media locators through `internal/media.Resolver`; do not trust or open a client-supplied absolute path.
- Preserve cancellation via request contexts, and keep FFmpeg process output streamed rather than buffering full media in memory.
- Keep token, URL, and secret values out of logs. Structured HTTP logs record a route template rather than tokenized route paths.
- Add/update tests near the changed package, and update `.env.example`, `README.md`, and/or `DESIGN.md` when behavior or configuration changes. Keep proposed contracts clearly labeled as proposals rather than shipped routes.
- `TRANSCODE_DIR` is currently reserved; do not assume it is a cache already used by the HLS implementation.

For architecture and protocol details, consult the repository's `README.md` and `DESIGN.md`. The latter includes future integration proposals, so verify implementation against source before treating a proposed route or behavior as available.