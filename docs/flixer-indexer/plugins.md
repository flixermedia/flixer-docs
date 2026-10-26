---
sidebar_position: 6
title: Indexer plugins
description: WASI provider plugin contract, capability names, execution limits and current restrictions.
---

# Indexer plugins

The indexer loads only plugin modules that Flixer reports as enabled through its signed `/api/indexer/settings` response. Plugin files are mounted read-only at `PLUGINS_PATH` (default `/data/plugins/installed`). A plugin failure is isolated to that provider call; built-in providers and unrelated plugins continue through the existing registry.

Flixer can query the signed `GET /internal/plugins` endpoint for the latest settings-reload result. Each record reports `registered` or `error`; `registered` means the provider was added to the registry, not that every future provider invocation will succeed. Failures during individual calls are returned through the normal provider error path and do not remove the module from the registry.

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

Capability names are `indexer.provider.movie`, `indexer.provider.series`, `indexer.provider.season`, `indexer.provider.episode`, `indexer.provider.album`, and `indexer.provider.images`. The indexer registers only methods declared in the plugin's catalog capabilities.

The runtime caps module size at 16 MiB, memory at 256 WASM pages, request and response data at 1 MiB, and execution at three seconds per call. It provides no filesystem preopens, environment variables, or network host imports. Thus third-party modules cannot access media paths or make outbound requests through this runtime. A future network capability must be implemented as a host-mediated, policy-enforced API before plugins can use it.

## Backend route modules

For backend route modules, Flixer calls the signed indexer endpoint `POST /internal/plugins/invoke` with a plugin ID and versioned JSON input. The indexer only executes a module present in its latest enabled-plugin configuration and declared with `api.routes` or `backend.routes`. Its `BackendEntry` is validated as a relative `.wasm` path under that plugin's installed directory before each invocation.

Flixer exposes authenticated `POST /api/plugins/{pluginId}/{operation}` routes. The module receives an envelope containing `apiVersion: 1`, the operation, authenticated user's ID and role, and the submitted request body. The module must return a JSON object with a `result` property; plugin-declared errors or malformed output become an isolated gateway error. No user bearer token, database handle, filesystem preopen, environment, or network import is passed to WASI.

## Current limitations

The current SDK is a protocol contract, not a complete language SDK. Streamer and web targets cannot be enabled yet. Backend route modules receive no host-mediated data or persistence APIs; applications requiring database access, event subscriptions, or durable plugin state still need those APIs implemented. Per-invocation health metrics, publisher signatures, and the three official feature migrations are still pending.