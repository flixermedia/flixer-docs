---
sidebar_position: 1
title: Overview
description: What Flixer Logger stores, who sends to it, and how administrators use it.
---

# Flixer Logger

[`flixer-logger`](https://github.com/flixermedia/flixer-logger) is Flixer's
structured event service. It stores events from the API, web app, streamer,
indexer, and AI service so administrators can search them in one place. It uses
Pebble for storage and is part of the standard Compose stack.

:::note
Logger is under active development. Check release notes before relying on it
as your only log record. Container output (`docker compose logs`) remains
available.
:::

## What you get

- Live streaming and historical search with time, field, and text filters.
- Trace lookup that correlates a request across services.
- Statistics by severity and source, and grouped errors.
- Per-deployment retention policies (disabled until you enable one).
- Producer credentials managed by Flixer, not by hand.

Everything is in **Admin → Logging** in Flixer Web. The browser never receives
Logger management credentials; calls go through Flixer's authenticated admin
API.

## How it is deployed

- Runs as an internal-only service (`logger`, port `8098`, not published to the
  host) with TLS between producers and Logger.
- Data lives in `${DATA_DIR}/logs/logger`; do not mount anything over it.
- Flixer pairs with Logger automatically on first start. No `.env` file is
  required.
- Pin the image with `LOGGER_VERSION`.

Backup, retention, limits, API routes, and troubleshooting are in
[Operations](./operations.md).
