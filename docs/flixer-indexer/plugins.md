---
sidebar_position: 6
title: Indexer plugins
description: WASI provider plugin contract, capability names, execution limits and current restrictions.
---

# Indexer plugins

The indexer loads only plugin modules that Flixer reports as enabled through its signed `/api/indexer/settings` response. Plugin files are mounted read-only at `PLUGINS_PATH` (default `/data/plugins/installed`). A plugin failure is isolated to that provider call; built-in providers and unrelated plugins continue through the existing registry.

Flixer can query the signed `GET /internal/plugins` endpoint for the latest settings-reload result. Each record includes per-target registration status for `flixer`, `flixer-indexer`, and `flixer-streamer`; a working target remains registered if another target fails. Registration does not guarantee every invocation succeeds.

## WASI execution

The indexer executes `flixer-indexer` and backend `flixer` targets as WASI command modules using wazero. A module must expose `_start`, read one JSON request from stdin, and write one JSON response to stdout. The current indexer provider request shape is:

```json
{
  "apiVersion": 1,
  "method": "movie",
  "query": {
    "title": "Example",
    "year": 2025,
    "ids": {},
    "language": "en"
  }
}
```

Supported methods are `movie`, `series`, `season`, `episode`, `album`, and `images`. Successful metadata calls return `{"result": {"ids": {}, "meta": {}, "images": []}}`; image calls return `{"result": []}`. A no-match response is `{"error": {"code": "not_found", "message": "..."}}`. Other errors are logged and treated as that provider's failed attempt.

Capability names are `indexer.provider.movie`, `indexer.provider.series`, `indexer.provider.season`, `indexer.provider.episode`, `indexer.provider.album`, and `indexer.provider.images`. The indexer registers only methods declared in the plugin's catalog capabilities. A plugin may additionally declare the corresponding `.replace` capability, such as `indexer.provider.movie.replace`, and request administrator approval for `indexer.provider.override`. Approved replacements run before built-in providers; other providers remain available as fallbacks. Without that approval, replacement ordering is ignored.

The runtime caps module size at 16 MiB, memory at 256 WASM pages, request and response data at 1 MiB, and execution at three seconds per invocation. It provides no filesystem preopens, environment variables, or network host imports. A module may return `hostCalls` and a `continuation`, and receives `hostResults` in a subsequent invocation. Up to four rounds of eight calls are supported within a 30-second total deadline. `http.get`, `http.post`, and `http.request` use Flixer's approved `network.http.<hostname>` or `network.http.any` permissions and its public HTTPS restrictions. `settings.get` returns only that plugin's settings, including its configured secrets, and requires approved `settings.read`. Other host operations are unavailable to indexer providers.

## Backend route modules

For backend route modules, Flixer calls the signed indexer endpoint `POST /internal/plugins/invoke` with a plugin ID and versioned JSON input. The indexer only executes a module present in its latest enabled-plugin configuration and declared with `api.routes` or `backend.routes`. Its `BackendEntry` is validated as a relative `.wasm` path under that plugin's installed directory before each invocation.

Flixer exposes authenticated `POST /api/plugins/{pluginId}/{operation}` routes. The module receives an envelope containing `apiVersion: 1`, the operation, authenticated user's ID and role, and the submitted request body. The module must return a JSON object with a `result` property; plugin-declared errors or malformed output become an isolated gateway error. No user bearer token, database handle, filesystem preopen, environment, or network import is passed to WASI.

## Current limitations

The current SDK is a protocol contract, not a complete language SDK. Backend modules have permission-gated host APIs for storage, HTTP and structured database access; event subscriptions are not implemented. Streamer and web targets have bounded contracts described in the [runtime guide](../flixer-plugins/runtime.md). Per-invocation health metrics, publisher signatures, and the three official feature migrations remain pending.
