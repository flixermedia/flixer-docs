---
sidebar_position: 10
title: Development
description: Repository structure, local development, tests, build commands, and implementation conventions.
---

# Development

## Repository structure

The entry point is `cmd/flixer-indexer/main.go`. Implementation packages are under `internal/`: `api`, `auth`, `config`, `flixerclient`, `httpx`, `images`, `lyrics`, `models`, `naming`, `nfo`, `pipeline`, `probe`, `progress`, `providers` (with provider-specific subpackages and `registry`), `scanner`, `settings`, and `subtitles`. Tests are co-located as `*_test.go` files, including API/auth/client tests and focused tests for parsing, providers, pipeline, probe, progress, images, lyrics, and subtitles.

The service uses Go modules (`go.mod`; module `github.com/flixermedia/flixer-indexer`) and targets Go 1.26. The core task queue is Asynq on Redis. The indexer communicates with flixer through the typed `internal/flixerclient` interface, making its stub useful for isolated local runs and tests.

## Common commands

Run the full test suite and build from the repository root:

```powershell
go test ./...
go build ./cmd/flixer-indexer
```

Run the service locally with Redis available:

```powershell
go run ./cmd/flixer-indexer
```

To start only the development Redis container, use `docker compose -f docker-compose.dev.yml up -d` from this repository; then run the Go process natively. Do not run the Docusaurus/npm commands as part of indexer development. The docs site is a separate repository.

## Conventions and testing notes

- Keep the flixer contract in `internal/models` and its implementation in `internal/flixerclient`; flixer remains the owner of persistence.
- Keep HTTP routing/authentication in `internal/api`, and stage behavior in `internal/pipeline`; scanners describe files but do not fetch metadata.
- Provider implementations should satisfy the relevant interfaces from `internal/providers/providers.go` and be wired through `internal/providers/registry`.
- Keep local NFO and image data ahead of remote values, and preserve fill-only merge semantics when adding provider fields.
- Use `internal/progress` for shared scan state in Redis, and update focused tests near the package changed. Existing tests use `miniredis` for Redis-dependent behavior and fake HTTP/provider bases where appropriate.
- The main worker pool starts one server per queue so concurrency, pause/resume, retries, and task inspection remain independently controllable.

The design note `flixer-indexer-SPEC.md` includes historical goals and suggested architecture. It is useful context but some details are aspirational; use current code in `cmd/` and `internal/` as the authoritative behavior when documenting or changing the service.
