---
sidebar_position: 7
title: Admin dashboard
description: Administrator tabs, panel responsibilities, the API calls behind them, and controls that are currently visual prototypes.
---

# Admin dashboard

`src/views/AdminView.vue` requires both a valid signed-in session and `profile.role === 'admin'`. It selects a tab through `/admin?tab=...`; the dashboard lazily mounts the selected panel. The listed request paths are relative to the Flixer API base URL unless explicitly described as a WebSocket.

| Tab | Main component | What it does and data source |
| --- | --- | --- |
| **Overview** (`overview`) | `src/components/admin/OverviewPanel.vue` | Shows movie/series/episode/track/user counts, library and disk usage, server/runtime details, streamer/indexer reachability, transcode/stream status, and recent playback activity. Initial REST read: `GET /admin/overview`; live replacements arrive on the `overview` WebSocket topic. |
| **Streams** (`streams`) | `src/components/admin/StreamSessionsPanel.vue` | Lists active/idle stream sessions, user/address, delivery mode, output quality, position, elapsed time, bytes sent, source codec/resolution, and expanded session/process details. Reads `GET /admin/streams`, updates from live topic `streams`, and cancels via `DELETE /admin/streams/:id`. |
| **Libraries** (`libraries`) | `src/components/admin/LibrariesPanel.vue` plus `src/components/admin/NetworkSharesSection.vue` | Creates/edits/deletes libraries and their folder roots, reports folder availability, and starts normal or forced indexer scans. Library CRUD uses `/admin/media-libraries`; folder browsing uses `/admin/media-libraries/roots` and `/admin/media-libraries/browse`; scans use `POST /admin/indexer/libraries/:id/scan`. Scan status is read from `/admin/indexer/status` and live topic `indexer`. This tab also embeds network-share management (below). |
| **Media** (`media`) | `src/components/admin/MediaPanel.vue` and `src/components/admin/MediaItemModal.vue` | Filters and pages through indexed media by library, type, parent, and search text; supports child navigation, edit, and delete. Uses `/admin/media/items` and `/admin/media-libraries`. The edit modal changes title/sort title/year/season/episode numbers/overview, manages manual poster/backdrop/logo/banner/thumb/disc images, displays file path/provider IDs, and embeds subtitle management for movies, episodes, and videos. Detail/update/image requests use `/admin/media/items/:id` and its `/images` endpoints. |
| **Indexer** (`indexer`) | `src/components/admin/IndexerPanel.vue` | Combines queue controls and task browser with metadata-provider and subtitle-provider configuration. Details below. |
| **Users** (`users`) | `src/components/admin/UsersPanel.vue` | Lists and filters accounts, role/status/passkey count/last activity; creates/edits/deletes accounts, updates role/disabled status, avatar/password and sessions in its dialogs. Reads/writes `/admin/users` and related user subpaths. Registration and email-verification policy toggles use `GET /settings` and `PUT /settings/:key`; email verification toggle is disabled in the UI when no SMTP host is configured. |
| **Devices** (`devices`) | `src/components/admin/DevicesPanel.vue` | Lists all account sessions, shows current-session/device metadata, and can sign out a non-current device (`GET /admin/devices`, `DELETE /admin/devices/:id`). API keys can be listed and revoked; a newly created key returns a secret that the panel displays for copying, while the list API returns only key metadata (`/admin/api-keys`). Device updates use live topic `devices`; API keys use REST. |
| **Transcoding** (`transcoding`) | `src/components/admin/TranscodingPanel.vue` | Displays controls for hardware acceleration, encoder preset, concurrency, threads, CRF, bitrate, temp path, and decode/tone-map/throttle/HEVC/audio/subtitle toggles. **At present this component is a local form mock:** its controls are Vue reactive state, the Save button has no handler, and it imports no API functions. Do not treat these values as persisted server configuration. |
| **Tasks** (`tasks`) | `src/components/admin/TasksPanel.vue` | Displays example scheduled-task cards and run/stop controls. **At present it uses `src/components/admin/mock.ts`; the buttons have no handlers and it makes no API calls.** This is separate from the real Indexer task queue browser. |
| **Logs** (`logs`) | `src/components/admin/LogsPanel.vue` | Streams, filters, pauses/resumes, clears, and downloads the current in-memory log buffer. Uses a dedicated WebSocket, `/logs/stream` appended to the API base (see [Realtime](./realtime.md)); it does not use an HTTP history endpoint. |
| **General** (`general`) | `src/components/admin/GeneralPanel.vue` | Contains server/network/language/banner/retention, notification, quick-connect, and danger-zone UI plus Email and Error Monitoring subpanels. Those general controls and their save/danger buttons are currently local mock state with no handlers. Email and Error Monitoring are API-backed as described below. |

## Libraries and SMB network shares

`src/components/admin/NetworkSharesSection.vue` is displayed above the library list in the Libraries tab. It supports SMB shares only, showing connection status and error text; admins can create/edit, reconnect, and delete a share. Calls use `GET/POST /admin/network-shares`, `PATCH /admin/network-shares/:id`, `POST /admin/network-shares/:id/reconnect`, and `DELETE /admin/network-shares/:id`. It listens on the `shares` live topic. The library modal selects a media type (`movies`, `tvshows`, `music`, `homevideos`, or `mixed`), image storage mode (`cache` or `alongside`), and one or more folders.

## Indexer controls and providers

The queue section reads `GET /admin/indexer/status` and subscribes to topic `indexer`. It displays scan state and counters for the six queues (`scan`, `identify`, `metadata`, `images`, `probe`, `refresh`), allows pause/resume, and saves per-queue worker concurrency with `PUT /admin/indexer/concurrency`. The task browser filters by queue/state and pages `GET /admin/indexer/tasks`; it offers cancel/retry actions at `/admin/indexer/tasks/:queue/:id/{cancel,retry}`.

Provider configuration is stored through `/settings`: it exposes TMDB, TVDB, OMDb, Fanart, TheAudioDB, Discogs, AniDB, MusicBrainz, and AniList toggles, API-key fields for keyed providers, and an indexer language value. The API key returned as a mask is preserved when the field is left blank.

Indexer subtitle settings (`src/components/admin/IndexerSubtitlesSection.vue`), labeled **OpenSubtitles** in the English UI, use the `indexer_subtitles` server setting for the OpenSubtitles API key, username/password, preferred language list, and auto-fetch. Secrets are masked and retained when left blank; **Remove** clears the API key and password. This is separate from the per-item subtitle search/download/remove UI. The web client saves configuration through the Flixer `/settings` API; subtitle search and downloads are requested through the backend's per-item subtitle API, not directly from the browser to OpenSubtitles.

## Media editor and subtitles

The media editor updates only changed metadata fields so unrelated indexer-owned fields remain untouched. Images can be added as PNG/JPEG/WebP/GIF up to 15 MiB and categorized as poster, backdrop, logo, banner, thumb, or disc; manual images can be removed. Because admin image endpoints require auth, images are fetched as API blobs rather than plain unauthenticated `<img>` URLs.

The `src/components/admin/SubtitlePanel.vue` embedded in the editor lists subtitle files next to playable item media, searches available results by query and language, downloads one, and removes an existing file. The API helper calls `GET /admin/media/items/:id/subtitles`, `POST .../subtitles/search`, `POST .../subtitles/download`, and `DELETE .../subtitles?file=...`; search/download use long (70-second) timeouts. Search/download require the subtitle integration to be configured.

## Email and error monitoring

`src/components/admin/EmailSettingsSection.vue` is an API-backed subsection of General. It reads and updates `smtp_host`, `smtp_port`, `smtp_secure`, `smtp_user`, `smtp_from`, and `smtp_password` through `/settings`; blank password input preserves the saved secret. It validates port range 1–65535, and offers `POST /settings/email/test` when an SMTP host exists.

`src/components/admin/ErrorMonitoringSection.vue` also reads/writes settings: `sentry_enabled`, per-app `sentry_{flixer,streamer,web}_enabled`, and `sentry_{flixer,streamer,web}_dsn`. DSNs are validated as URLs. Its test action captures and flushes a Sentry test exception in the web app; it requires the client SDK to have been initialized.

## General-tab implementation status

The real General-tab integrations are SMTP and Sentry settings. The rest of `src/components/admin/GeneralPanel.vue` initializes values from `src/components/admin/mock.ts` and has no load/save handler or API import; the visible Save, networking, notification, cache/history, and danger-zone controls do not persist or invoke server actions. Similarly, the Transcoding and Tasks tabs are illustrative placeholders, not functional backend management pages. The Admin Overview and Streams panels do report live backend transcoding state, but that does not make the Transcoding form persistent.
