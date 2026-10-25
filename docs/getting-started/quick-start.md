---
sidebar_position: 2
title: Quick start
description: Run the whole Flixer stack with Docker Compose.
---

# Quick start

The fastest way to run everything is Docker Compose from the `flixer` repository. For hacking on the code see [Local development](./local-development.md).

## Prerequisites

- Docker with Compose v2.
- A PostgreSQL database reachable from the containers (the compose file does not start one).
- A folder containing your media, for example `Movies/`, `TV Shows/` and `Music/` subfolders.

## 1. Configure

```bash
cd flixer
cp .env.example .env
```

Edit `.env` and set at least:

| Variable | What to put |
| --- | --- |
| `DATABASE_URL` | Your Postgres connection string. |
| `JWT_SECRET` | A random secret of 32 or more bytes. |
| `APP_SECRET` | A different random secret of 32 or more bytes. Shared by flixer, the streamer and the indexer. |
| `FLIXER_PUBLIC_URL`, `APP_URL`, `PASSKEY_RP_ID`, `PASSKEY_ORIGINS` | The address users type in the browser. Passkeys only work when these match. |
| `MEDIA_PATH` | Host path of the root media folder. |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 2. Start

```bash
docker compose up -d
```

This starts `api`, `streamer`, `indexer`, `redis`, `web` and an nginx `proxy`. The proxy publishes `HTTP_PORT` (default `8080`).

## 3. Create your admin account and libraries

1. Open `http://localhost:8080` and register. Follow the first-run steps shown in the app.
2. Open **Admin dashboard → Libraries** and click **Add library**.
3. Give it a name, a type (movies, TV or music) and choose one or more folders from the offered root folders.
4. Press **Scan**. Progress appears live on the Libraries and Overview tabs.

:::tip
Libraries are yours to define. Flixer does not assume folder names such as `Movies` exist; it only offers whatever is inside your root media folders.
:::

## 4. Optional extras

- Subtitles from OpenSubtitles: add credentials under the admin dashboard settings. See [Subtitles](../flixer-indexer/subtitles.md).
- SMB network shares: use `docker-compose.smb.yml`. See [Network shares](../flixer-indexer/network-shares.md).
- Logs in Grafana: `docker-compose.observability.yml`. See [Observability](../flixer/observability.md).
