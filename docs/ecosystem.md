---
sidebar_position: 1
title: Flixer ecosystem
description: Flixer repositories, services, and optional projects.
---

# Flixer ecosystem

The Flixer repositories have different roles. Some run together in the
self-hosted server; others provide optional features, the plugin catalogue,
or a separate public website.

## Core self-hosted services

| Repository | Role |
| --- | --- |
| [flixer](https://github.com/flixermedia/flixer) | API, accounts, catalog, settings, and administration. |
| [flixer-web](https://github.com/flixermedia/flixer-web) | Browser application and admin interface. |
| [flixer-streamer](https://github.com/flixermedia/flixer-streamer) | Authorized media delivery and playback processing. |
| [flixer-indexer](https://github.com/flixermedia/flixer-indexer) | Media scans, metadata, artwork, and technical details. |
| [flixer-logger](./flixer-logger/overview.md) | Structured logs and event search for the server. |
| [flixer-updater](https://github.com/flixermedia/flixer-updater) | In-dashboard updates, backups, and rollback support. |

The standard Compose stack also runs PostgreSQL, Redis, Meilisearch, and a
reverse proxy. These are dependencies, not separate Flixer repositories.

## Optional and supporting projects

| Repository or service | Role |
| --- | --- |
| [flixer-ai](./flixer-ai/overview.md) | Optional recommendation service, enabled with the `ai` Compose profile. |
| TURN relay (`coturn`) | Optional relay for audio/video calls, enabled with the `calls` Compose profile. It is an upstream image, not a Flixer repository. |
| [flixer-plugins](./flixer-plugins/overview.md) | Official plugin catalogue, schemas, and example packages. Plugins are installed by Flixer; this is not a Compose service. |
| [flixer-cloud](https://github.com/flixermedia/flixer-cloud) | Separate Flixer-branded marketing and account website. It is independent of the self-hosted media server. |
| [flixer-docs](https://github.com/flixermedia/flixer-docs) | Source for this documentation site. |

## Install

Use the official installer at [get.flixer.dev](https://get.flixer.dev). The
[quick start](./getting-started/quick-start.md) covers platform prerequisites
and first-run setup.
