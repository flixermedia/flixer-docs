---
sidebar_position: 12
title: Plugins
description: Plugin manifests, repository catalogs, installation safety, permissions and current runtime support.
---

# Plugins

Flixer's plugin manager is being introduced in stages. It stores repository and installation metadata in Flixer's PostgreSQL database and stores packages and plugin-owned data under `DATA_PATH/plugins`. The official catalog is `https://github.com/flixermedia/flixer-plugins`.

## Catalog and package format

The catalog root is `repository.json` and declares `manifestVersion: 1`. Catalog entries have a globally unique plugin ID, display metadata, target services, declared capabilities and permissions, and independently versioned releases. A release identifies a plugin manifest, a `.tar.gz` package, a SHA-256 digest, and an optional exact package size. See the versioned schemas in the [official plugin repository](https://github.com/flixermedia/flixer-plugins/tree/main/schemas).

Each package contains `plugin.json` at its root. The package manifest is checked against the catalog manifest before installation. Package paths must be relative; symlinks, traversal paths, duplicate paths, unsupported archive entries, oversized files, and oversized decompressed packages are rejected. Installation is staged and atomically swapped under `DATA_PATH/plugins/installed`; settings and plugin data are kept separately under `DATA_PATH/plugins/data`.

## Permissions and execution

Plugin permission declarations are not treated as isolation. Installation requires explicit administrator approval for every declared permission. Repository manifests are fetched only over HTTPS; the manager rejects redirects and private/reserved DNS answers, pins the request to a validated public address, bounds response sizes, validates schemas, and checks package digests.

Executable extension targets use WASI modules run by the indexer's wazero host, with no preopened filesystem, inherited environment, or network imports; execution has memory, input/output, and time limits. Indexer provider modules receive one versioned JSON request on stdin. Backend route modules use the same isolated runner and receive a versioned JSON request on stdin. Networked plugins are not yet supported because no host-mediated network capability is exposed.

Plugin settings use the package's JSON Schema. The admin form supports text, numeric, boolean, enum, and primitive-list fields. Fields marked `writeOnly` or `x-flixer-secret` are stored separately using AES-GCM with a key derived from `APP_SECRET`; API reads return a mask, never the saved value. Schema references to external URLs and unsupported form shapes are rejected.

Backend route plugins declare a `flixer` target with a `.wasm` entry and the `api.routes` or `backend.routes` capability. Each operation must also declare and receive administrator approval for its exact `api.routes.{operation}` permission. They are invoked through authenticated `POST /api/plugins/{pluginId}/{operation}` requests. The WASI module receives `{ apiVersion, method, operation, user: { id, role }, request: { method, body } }`; when storage-read permissions are granted, the host adds a `storage` snapshot. A module may return `{"result": ...}` or `{"error": {"code": "...", "message": "..."}}`. To persist state, it may also return `storage.plugin` and/or `storage.user` patches shaped as `{ "set": { "key": "value" }, "delete": ["old-key"] }`; each scope requires its matching `storage.{scope}.write` permission and is applied transactionally. Plugin storage is namespaced by plugin; user storage is additionally isolated to the authenticated user. Each scope is limited to 256 KiB and 1,024 keys total. Plugins never receive direct database, filesystem, network, settings-secret, or application-token access. Backend plugin errors are isolated to the request and reflected in plugin health state. Streamer plugin execution is not yet available. The frontend provides repository, installation, and schema-backed settings administration; it does not load third-party UI code.

## Lifecycle and data

The admin Plugins page can list installations, search enabled repository catalogs, filter by target and capability, add/refresh/remove custom repositories, install releases, configure schema-backed settings, and enable/disable/uninstall supported indexer and backend route plugins. Newer releases are discovered from cached catalogs and can be applied manually to disabled plugins. Updates preserve settings, encrypted secrets, and grants for permissions still requested by the new release. Every install or update attempt is recorded in `plugin_update_history`; successful package and installation metadata changes are committed together, and failures retain a bounded, credential-redacted diagnostic. Admins can inspect the latest 20 attempts from each installed plugin's **History** control or use `GET /admin/plugins/:id/history?limit=20` (limit 1–100). History remains after plugin uninstall. Every update is verified and staged, and the prior package is restored if metadata persistence fails. Automatic updates are not implemented. The official repository is seeded idempotently and cannot be removed. Catalog refresh runs in the background at startup and periodically; a repository outage does not block Flixer startup.

Installed metadata records requested versus granted permissions. Backend and indexer WASI modules currently receive no host capabilities; backend authentication is enforced by Flixer before dispatch. The signed indexer status endpoint reports runtime registration; per-invocation health metrics, publisher signatures, and app-version checks for streamer/web targets remain pending.

Uninstall removes the package but retains plugin-owned data, including scoped backend storage, for a future reinstall. Existing user feature data is not migrated by the current plugin manager yet. The migrations of SkipMe.db, media requests, and theme songs remain pending; their current implementations continue to be core-owned.

## Indexer provider contract

The [indexer plugin guide](../flixer-indexer/plugins.md) documents the currently supported WASI request/response contract and capability names. Use the indexer guide and schemas as the implementation source of truth; do not assume unsupported targets are executable.