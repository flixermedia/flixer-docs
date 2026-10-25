---
sidebar_position: 3
title: Troubleshooting
description: Common problems and where to look.
---

# Troubleshooting

## Admin dashboard does not update live

The browser connects to `wss://<host>/api/live`. If the proxy does not forward upgrades for that path the sockets fail and panels only show their first load. Make sure your proxy matches [the bundled nginx config](./deployment.md#proxy-routing). A close code `4401`/`4403` means the session is invalid or not an admin; sign in again.

## "OpenSubtitles is not set up"

Add the API key, username and password in the admin dashboard settings (or the indexer's `OPENSUBTITLES_*` environment as fallback). See [Subtitles](../flixer-indexer/subtitles.md).

## A library has no folders to choose

Root folders come from `MEDIA_PATH` / `STREAM_MEDIA_ROOT` and are validated against what flixer can read. In Docker confirm the host path is mounted at `/media`. Native: check the value is a path or a JSON array of paths.

## Playback fails or stalls

1. Check `APP_SECRET` matches in flixer and the streamer.
2. Confirm `ffmpeg` and `ffprobe` are available to the streamer (`FFMPEG_PATH`).
3. Look at `MAX_TRANSCODES`; at the limit new transcodes wait or fail.
4. Check the streamer log and the admin **Streams** tab for the session.

## Subtitles out of sync after seeking

Restart flixer-streamer so the keyframe-aligned seek is active, then hard-reload the page. See [Playback modes](../flixer-streamer/playback-modes.md).

## Scans stall or the UI is sluggish during a scan

Lower indexer worker counts in the dashboard or `INDEXER_MAX_WRITES` on flixer. The indexer retries on 429. See [Queues and workers](../flixer-indexer/queues-and-workers.md).

## Saved SMB share passwords stopped working

They are encrypted with a key derived from `APP_SECRET`. If it changed, re-enter them.

## Passkeys do not register

`APP_URL`, `PASSKEY_RP_ID` and `PASSKEY_ORIGINS` must match the exact browser address, and the site must be served over HTTPS (localhost excepted).
