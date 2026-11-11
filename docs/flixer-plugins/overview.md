---
sidebar_position: 1
title: Overview
description: The official Flixer plugin catalogue and how plugins are installed.
---

# Flixer Plugins

[`flixer-plugins`](https://github.com/flixermedia/flixer-plugins) is the
official, versioned catalogue of Flixer plugins, plus the JSON schemas that
validate them. It is data, not a running service: administrators install
plugins from **Admin → Plugins** in Flixer.

## Available plugins

| Plugin            | What it does                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `flixer.skipmedb` | Adds crowd-sourced intro, recap, credits, and preview timestamps from SkipMe.db.                       |
| `flixer.example`  | Reference backend plugin showing an authenticated route, plugin storage, and a permissioned HTTP call. |

Releases are immutable: a new version is published instead of overwriting an
old one.

Catalogue entries can include optional `icon` and `banner` paths relative to
`repository.json`. PNG, JPEG, WebP and GIF images up to 5 MiB are supported;
Flixer displays them in the admin plugin list.

## Install a plugin

1. Open **Admin → Plugins** and add or select the official repository.
2. Choose a plugin and review the permissions it declares.
3. Approve the permissions and install. Flixer checks the manifest, schema,
   compatibility, and package SHA-256 before using it.

Permissions are not a sandbox by themselves; approve only what you trust.
Plugins run as WASI modules with no filesystem, environment, or direct network
access. Uninstalling keeps plugin data so a reinstall can restore it.

## Repository layout

```text
flixer-plugins/
├── repository.json   # catalogue index and release versions
├── schemas/          # repository and plugin manifest JSON schemas
└── plugins/          # plugin sources and releases
```

## Build a plugin

See [`plugins/oauth`](https://github.com/flixermedia/flixer-plugins/tree/main/plugins/oauth)
for a working plugin. Its `build.sh` compiles with `GOOS=wasip1 GOARCH=wasm`
and packages an immutable release. Validate against the schemas and add the
release digest and size to `repository.json`.

Manifest fields, permissions, host APIs, and limits are covered in
[Runtime and permissions](./runtime.md); indexer provider plugins are described
in the [indexer plugin guide](../flixer-indexer/plugins.md).
