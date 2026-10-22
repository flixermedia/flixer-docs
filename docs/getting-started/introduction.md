---
sidebar_position: 1
title: Introduction
description: What Flixer is and how the documentation is organised.
---

# Introduction

Flixer is a self-hosted media server for movies, TV shows and music. You point it at folders on disk, declare libraries over them in the admin dashboard, and stream to any browser.

It is made of four services plus Postgres and Redis:

| Service | Language | Role |
| --- | --- | --- |
| [flixer](../flixer/overview.md) | TypeScript (Ts.ED, Fastify) | The API: accounts, libraries, media metadata, watch history, admin and live updates. |
| [flixer-web](../flixer-web/overview.md) | TypeScript (Vue 3) | The PWA users and admins open in the browser. |
| [flixer-streamer](../flixer-streamer/overview.md) | Go + ffmpeg | Serves media bytes: direct play, remux, transcode, HLS, subtitles and lyrics. |
| [flixer-indexer](../flixer-indexer/overview.md) | Go | Scans libraries, probes files, fetches metadata, artwork and subtitles. |

## Key ideas

- **Libraries live in the database.** An admin creates libraries (Movies, TV Shows, Music, anything) in the dashboard and picks folders for each from the root folders the server exposes. See [Libraries and media](../flixer/libraries-and-media.md).
- **Root folders are configuration.** `MEDIA_PATH` (Docker) or `STREAM_MEDIA_ROOT` (native) names the folder or folders everything is read from. It may be a JSON array so roots can sit on different disks.
- **The streamer never trusts the browser.** Playback uses short-lived signed stream tokens shared between flixer and flixer-streamer through `STREAM_TOKEN_SECRET`.
- **The admin dashboard is live.** Overview, streams, devices, indexer queues and network shares update over a single WebSocket. See [Real-time updates](../flixer/realtime.md).

## Where to go next

1. [Quick start](./quick-start.md) to run it.
2. [Architecture overview](../architecture/overview.md) to see how the pieces fit.
3. The per-service sections for details, and [Operations](../operations/deployment.md) for running it in production.
