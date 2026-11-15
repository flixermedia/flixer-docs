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

| Endpoint                            | Behaviour                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/media/items/:id/progress` | `{ positionSeconds, completed }` (position is `0` when completed).                                                         |
| `PUT /api/media/items/:id/progress` | Body `{ positionSeconds, durationSeconds }` (integers ≥ 0), `204`. Only for `movie`, `episode`, `video` (`404` otherwise). |

Rules when saving:

- `completed` when `duration > 0` and `position ≥ 92 %` of duration; the stored position is then reset to `0`.
- A position under **20 s** is ignored unless a row already exists.
- Upsert on `(user_id, item_id)`.

### Playback history

`GET /api/user-media/history?offset=0&limit=25` returns the signed-in user's video, live TV, and music sessions, newest first. Consecutive sessions for the same item, series, album, or live channel are grouped before pagination; an intervening item starts a separate group. Episode groups show the series and track groups show the album. The API defaults to 200 groups per page and accepts a maximum of 200; the web interface requests 25. Existing viewing and listening events are copied into durable history when the migration runs. Where no session exists, the most recent legacy watch-progress or listening record supplies an approximate activity entry. New video and live sessions are recorded alongside viewing analytics; music sessions are recorded when listening starts. History remains until the user removes entries, clears it, deletes the account, or the corresponding library item is removed. `DELETE /api/user-media/history/:id` removes every session in the selected group and `DELETE /api/user-media/history` clears all entries. Deleting history does not reset watch progress or administrative analytics. Late reports from a deleted viewing session do not recreate it.

### Personal lists and recommendations

`/api/user-media/watch-later` is a private per-user video list, separate from favorites. `/api/user-media/queue` stores the user's ordered Up Next video queue across reloads and devices. `/api/user-media/collections` manages owner-created video collections; collections start private, and public collections are visible only where the owner's profile is visible and the viewer is permitted to see the media. Item mutations and ordering are owner-only.

`GET /api/user-media/automatic-collections` groups movies using the `collection` metadata populated from TMDb and NFO files. It returns only box sets with at least two movies visible to the requesting user. `GET /api/user-media/automatic-collections/:id` returns their visible movies in release order; automatic collections are read-only and their links do not bypass media access restrictions.

Recommendation dismissals are stored per user. Dismissed items are removed from cached and fresh API results, and provide a negative signal during future AI recommendation refreshes. Users can restore dismissed items; existing cached rankings update when the recommendation cache refreshes.

### Continue watching

Part of `GET /api/media/home`: unfinished rows (`completed = false`) newest first, up to **20** cards. Episodes show the series title with subtitle `S<season>E<episode> · <episode title>` and fall back to the series artwork. `progress` is a percentage clamped to 1–99 (duration from the row or the item's runtime).

## Home page content

`GET /api/media/home` returns:

| Field                                         | Content                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `libraries`                                   | Each library with `itemCount` (top-level items) and a `cover` image from its 12 newest items.                 |
| `featured`                                    | Up to 5 recent movies/series (from 40 candidates) that have a backdrop, with tagline/overview/rating/runtime. |
| `continueWatching`                            | See above.                                                                                                    |
| `recentMovies`, `recentShows`, `recentAlbums` | 20 newest of each type.                                                                                       |

Also: `GET /api/media/search?q=&type=` (min 2 chars, title/sort-title `ILIKE`, prefix matches first, max 60) and `GET /api/media/browse/:kind?sort=&offset=&limit=` (`sort`: `added` default, `title`, `year`; `limit` ≤ 100, default 48).

Browse and search accept filters for genre, release year, cast, studio, runtime in minutes, HDR format, minimum video height, and audio language code. These filters use indexed metadata; titles without the relevant metadata cannot match that filter. Technical filters apply to the selected item's own technical data, so a series without technical data does not inherit it from its episodes. Search uses PostgreSQL for the additional metadata filters.

## Subtitles

Subtitle files are owned by flixer-indexer; flixer proxies admin actions through signed calls (`src/api/media/subtitleService.ts`). Only `movie`, `episode`, `video` items are eligible (`400` otherwise).

| Endpoint (admin)                                 | Indexer call                                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `GET /api/admin/media/items/:id/subtitles`       | `POST /internal/subtitles/list` → `{ tracks, configured }`                                                 |
| `POST …/subtitles/search` `{query?, languages?}` | `/internal/subtitles/search` (60 s timeout) – sends title, year, season/episode, provider ids, series info |
| `POST …/subtitles/download` `{fileId, language}` | `/internal/subtitles/download` → `{ file }`                                                                |
| `DELETE …/subtitles?file=`                       | `/internal/subtitles/delete`                                                                               |

### OpenSubtitles settings

Setting `indexer_subtitles` (admin, via `PUT /api/settings/indexer_subtitles`):

```json
{
  "apiKey": "",
  "username": "",
  "password": "",
  "languages": ["en", "pt-BR"],
  "autoFetch": true
}
```

- `languages`: ≤ 10 codes matching `^[a-z]{2,3}(-[A-Za-z]{2,4})?$`; `autoFetch` boolean (default true).
- `apiKey` and `password` are returned masked (`********`); sending the mask back keeps the stored value.
- After saving, flixer calls the indexer's `/internal/settings/reload`.

Subtitles are served to players by flixer-streamer (`/streamer/subtitles/...` is routed to it by the proxy), not by this backend.

## Lyrics

The flixer backend has **no lyrics endpoint**. Lyrics are served by flixer-streamer (`/streamer/lyrics/...`, proxied by nginx) – see the streamer docs.

## Chapters and skippable segments

`POST /api/playback/items/:id/playback-info` also returns `chapters` (`{title, startMs, endMs}`, from the container's chapter list, which the indexer's probe stage stores) and `segments` (`{type, startMs, endMs, source}`). The player draws chapter ticks on the seek bar and offers a "Skip Intro/Recap/Credits" button inside a segment, with an optional auto-skip (intros, recaps, previews and breaks; never credits).

Segment types are `intro`, `recap`, `credits`, `preview` and `commercial`. Playback reads saved timing data from Flixer's database; no external segment service is queried while starting playback. One segment per type is returned, chosen by source priority:

1. `manual`: set by an admin with `PUT /api/admin/media/items/:id/segments/:type` (`{startMs, endMs}`) and removed with `DELETE` on the same path.
2. `theintrodb`: public intro and credits timings synced by flixer-indexer from TheIntroDB v4. The provider is enabled by default, requires no API key, and can be disabled under Admin → Providers. Movie and episode syncs use separate queues; existing media is backfilled and future indexer updates are queued automatically.
3. `plugin`: timings supplied by an independently installed and enabled segment-provider plugin.
4. `chapter`: chapter titles matched against built-in patterns (for example "Opening", "Previously on", "Credits"). Computed on read, never stored.

Items indexed before chapter support need a refresh to gain chapters.
