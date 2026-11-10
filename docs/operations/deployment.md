---
sidebar_position: 1
title: Deployment and operations
description: Run, secure, update, and back up a Flixer installation.
---

# Deployment and operations

For a new server, use the [official installer at get.flixer.dev](https://get.flixer.dev).
It creates the Compose configuration, prepares storage, and starts the services.
The [quick start](../getting-started/quick-start.md) covers platform
requirements and first-run setup.

## What runs

The standard stack includes the API, web app, streamer, indexer, PostgreSQL,
Redis, Meilisearch, Flixer Logger, and the updater. AI recommendations and the
TURN relay for calls are optional services. Payments are disabled until
configured. See the [ecosystem guide](../ecosystem.md) for all repositories
and optional components.

## Network and HTTPS

The bundled proxy listens on port `8080` by default. It routes the web app,
API, and streamer through one address. For remote access, put a TLS reverse
proxy in front of Flixer and forward WebSocket upgrades as well as regular
HTTP traffic. Do not expose internal service ports directly to the internet.

Set the public app address and passkey settings to match the URL people use:
`FLIXER_PUBLIC_URL`, `APP_URL`, `PASSKEY_RP_ID`, and `PASSKEY_ORIGINS`.
Passkeys require HTTPS outside localhost.

## Storage and backups

- `DATA_DIR` holds Flixer's database, settings, cache, backups, and logs.
- `MEDIA_PATH` is the root containing your media folders.
- Back up the database and important Flixer configuration before upgrades.
  Keep media backups according to your own storage plan.
- Prefer the admin **Updates** page for updates. It creates a database backup
  before applying component versions and can roll back known releases.
- Do not copy Flixer Logger's live Pebble directory as a backup. Use Logger's
  checkpoint procedure in the [Logger guide](../flixer-logger/operations.md).

Keep both paths persistent and make sure the Docker host has enough free space.
The [environment guide](./environment-variables.md) summarizes the settings;
the installation's `.env` and the [Flixer README](https://github.com/flixermedia/flixer)
are authoritative for the selected release.

## Network shares and logs

Add SMB shares through the installer or **Admin → Libraries**. Docker requires
the corresponding supported Compose configuration and mount permissions; see
[network shares](../flixer-indexer/network-shares.md).

Use **Admin → Logging** for searchable application events. For immediate
container diagnostics, run `docker compose logs -f <service>` from the
installation directory.
