---
sidebar_position: 2
title: Environment variables
description: The main settings used by a Flixer installation.
---

# Environment variables

Most settings can be entered in the setup wizard or managed in Flixer. The
installer's `.env.example` lists the options for that release; avoid copying
old values from another installation.

| Variable | Purpose |
| --- | --- |
| `DATA_DIR` | Persistent application data, including the bundled database, settings, cache, backups, and logs. Required by the standard Compose file. |
| `MEDIA_PATH` | Host folder containing media. Libraries are created from folders inside it. |
| `HTTP_PORT` | Host port for the bundled proxy. Defaults to `8080`. |
| `DATABASE_URL` | Optional database connection override. The standard installation includes PostgreSQL. |
| `APP_URL` | Public web address used by account and verification links. |
| `PASSKEY_RP_ID` | Hostname used for passkeys. Match the address people use. |
| `PASSKEY_ORIGINS` | Allowed browser origins for passkeys. Include the scheme and port when needed. |
| `APP_SECRET` | Shared secret used by Flixer services. Keep the same value wherever the stack requires it. Changing it can invalidate encrypted settings and service tokens. |
| `MAX_TRANSCODES` | Optional limit for simultaneous FFmpeg jobs. `0` means unlimited. |
| `COMPOSE_PROFILES` | Optional Compose profiles, including `ai` for AI recommendations. |

Use the admin dashboard for SMTP, metadata provider credentials, subtitles,
payments, and error reporting. These are not normally set in `.env`.

For manual or native deployments, use the configuration page for the relevant
service: [Flixer](../flixer/configuration.md), [Web](../flixer-web/configuration.md),
[Streamer](../flixer-streamer/configuration.md), or
[Indexer](../flixer-indexer/configuration.md).
