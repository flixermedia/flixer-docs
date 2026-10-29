---
sidebar_position: 6
title: Playback and history
description: How stream URLs and tokens are issued, watch progress and Continue Watching, home page content, subtitles and lyrics.
---

# Playback and history

## Stream URL and token issuance

`POST /api/playback/items/:id/playback-info` (bearer) → `PlaybackService.createItemPlaybackInfo` (`src/api/playback/playbackService.ts`).

Validation:

- Item must exist and not be a placeholder (`404`).
- Type must be `movie`, `episode`, `video` or `track`, with a stored `rootId` and `relativePath` (`400` otherwise).
- Extension must be a known one: `.mp4 .webm .mkv` or audio `.mp3 .flac .m4a .aac .ogg .opus .wav .aiff .aif` (`400` otherwise).

Response:

```json
{
  "playSessionId": "uuid",
  "title": "Movie title",
  "mediaSource": {
    "id": "item-uuid",
    "title": "Movie title",
    "container": "mkv",
    "directPlay": false,
    "mediaSourceId": "item-uuid",
    "streamUrl": "/streamer/stream/<jwt>"
  },
  "expiresAt": "2025-01-01T12:00:00.000Z"
}
```

- `directPlay` is `false` only for `.mkv` (the streamer must remux/transcode).
- `streamUrl` is prefixed with `STREAMER_PUBLIC_URL` (empty by default → same-origin `/streamer/stream/...` URL, routed by the proxy to the streamer).
- The token is an **HS256 JWT** valid **1 hour** with claims `iss: flixer`, `aud: flixer-streamer`, `sub`/`userId`, `mediaItemId`, `mediaSourceId`, `playSessionId`, `mediaLocator`, `iat`, `exp`, `jti`. Signed with `APP_SECRET` (≥ 32 bytes, otherwise issuing fails).
- `mediaLocator` is `{rootId, relativePath}` encrypted with **AES-256-GCM** (key = SHA-256 over an AAD label + secret, 12-byte nonce, AAD `flixer-streamer:media-locator:v1`), so file paths never reach the client.

Sample videos: `GET /api/playback/samples` scans every library folder for `.mp4/.webm/.mkv` files and `POST /api/playback/samples/:id/playback-info` issues tokens for them (id = first 16 hex chars of sha256 of `rootId/relativePath`).

## Active streams

`GET /api/admin/streams` and `DELETE /api/admin/streams/:sessionId` proxy flixer-streamer's `/streamer/admin/sessions` (admin key derived from `APP_SECRET`; 5 s timeout; `502` unreachable/error, `504` timeout). Sessions are enriched with the user's `username` / `displayName`.

## Watch progress and history

Stored in `watch_progress` (one row per user + item). `src/api/media/mediaHomeService.ts`:

| Endpoint | Behaviour |
| --- | --- |
| `GET /api/media/items/:id/progress` | `{ positionSeconds, completed }` (position is `0` when completed). |
| `PUT /api/media/items/:id/progress` | Body `{ positionSeconds, durationSeconds }` (integers ≥ 0), `204`. Only for `movie`, `episode`, `video` (`404` otherwise). |

Rules when saving:

- `completed` when `duration > 0` and `position ≥ 92 %` of duration; the stored position is then reset to `0`.
- A position under **20 s** is ignored unless a row already exists.
- Upsert on `(user_id, item_id)`.

### Continue watching

Part of `GET /api/media/home`: unfinished rows (`completed = false`) newest first, up to **20** cards. Episodes show the series title with subtitle `S<season>E<episode> · <episode title>` and fall back to the series artwork. `progress` is a percentage clamped to 1–99 (duration from the row or the item's runtime).

## Home page content

`GET /api/media/home` returns:

| Field | Content |
| --- | --- |
| `libraries` | Each library with `itemCount` (top-level items) and a `cover` image from its 12 newest items. |
| `featured` | Up to 5 recent movies/series (from 40 candidates) that have a backdrop, with tagline/overview/rating/runtime. |
| `continueWatching` | See above. |
| `recentMovies`, `recentShows`, `recentAlbums` | 20 newest of each type. |

Also: `GET /api/media/search?q=&type=` (min 2 chars, title/sort-title `ILIKE`, prefix matches first, max 60) and `GET /api/media/browse/:kind?sort=&offset=&limit=` (`sort`: `added` default, `title`, `year`; `limit` ≤ 100, default 48).

## Subtitles

Subtitle files are owned by flixer-indexer; flixer proxies admin actions through signed calls (`src/api/media/subtitleService.ts`). Only `movie`, `episode`, `video` items are eligible (`400` otherwise).

| Endpoint (admin) | Indexer call |
| --- | --- |
| `GET /api/admin/media/items/:id/subtitles` | `POST /internal/subtitles/list` → `{ tracks, configured }` |
| `POST …/subtitles/search` `{query?, languages?}` | `/internal/subtitles/search` (60 s timeout) – sends title, year, season/episode, provider ids, series info |
| `POST …/subtitles/download` `{fileId, language}` | `/internal/subtitles/download` → `{ file }` |
| `DELETE …/subtitles?file=` | `/internal/subtitles/delete` |

### OpenSubtitles settings

Setting `indexer_subtitles` (admin, via `PUT /api/settings/indexer_subtitles`):

```json
{ "apiKey": "", "username": "", "password": "", "languages": ["en", "pt-BR"], "autoFetch": true }
```

- `languages`: ≤ 10 codes matching `^[a-z]{2,3}(-[A-Za-z]{2,4})?$`; `autoFetch` boolean (default true).
- `apiKey` and `password` are returned masked (`********`); sending the mask back keeps the stored value.
- After saving, flixer calls the indexer's `/internal/settings/reload`.

Subtitles are served to players by flixer-streamer (`/streamer/subtitles/...` is routed to it by the proxy), not by this backend.

## Lyrics

The flixer backend has **no lyrics endpoint**. Lyrics are served by flixer-streamer (`/streamer/lyrics/...`, proxied by nginx) – see the streamer docs.

## Chapters and skippable segments

`POST /api/playback/items/:id/playback-info` also returns `chapters` (`{title, startMs, endMs}`, from the container's chapter list, which the indexer's probe stage stores) and `segments` (`{type, startMs, endMs, source}`). The player draws chapter ticks on the seek bar and offers a "Skip Intro/Recap/Credits" button inside a segment, with an optional auto-skip (intros, recaps, previews and breaks; never credits).

Segment types are `intro`, `recap`, `credits`, `preview` and `commercial`. One segment per type is returned, chosen by source priority:

1. `manual`: set by an admin with `PUT /api/admin/media/items/:id/segments/:type` (`{startMs, endMs}`) and removed with `DELETE` on the same path.
2. `skipme`: crowd-sourced timestamps from the SkipMe.db URL set under Admin → Providers (default `https://database.skipme.deno.net/v3`; empty disables lookups) (`POST /movies` with the series or movie ids, season/episode and file duration; the entry whose duration is within 5 s and with the most submissions wins). Failed or empty lookups are not retried for 24 hours.
3. `chapter`: chapter titles matched against built-in patterns (for example "Opening", "Previously on", "Credits"). Computed on read, never stored.

Items indexed before chapter support need a refresh to gain chapters.
