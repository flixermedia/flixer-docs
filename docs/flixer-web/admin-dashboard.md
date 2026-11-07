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

### Experimental Flixer Logger

The Flixer API also has experimental administrator-only `/api/admin/logger`
configuration, retention, and short-lived query-token endpoints. Configuration
stores the logger origin and an encrypted management credential in Flixer's
local configuration store; the credential is not returned on reads. The logger
must already have an operator-provisioned management credential. The Logging
page sends authenticated queries to the Flixer API, which checks administrator
access on each request and relays them to the logger using a short-lived
query credential. That credential is not sent to the page. The older
administrator-only query-token endpoint remains available for compatibility.

An operator can optionally register a separate logger-owner credential in the
Logging panel. Flixer stores it encrypted and binds it to the configured
logger origin; changing the logger connection requires registering the owner
credential again. Owner capacity metrics and global thresholds affect every
deployment sharing that logger, not just this Flixer installation. Thresholds
may reject new log batches and producers can drop logs. They are best-effort
guards, not hard physical disk quotas; compaction and other processes can use
additional space. Credential provisioning is still manual.

For an additional deployment, a logger owner can create a short-lived,
single-use invitation from **Deployment pairing invitations**, then securely
deliver its token and deployment ID to that deployment's administrator. The
receiving administrator uses **Connect with a pairing token**. Flixer
exchanges the invitation directly with the logger and encrypts the resulting
management credential; that credential is not sent to the browser. If setup
fails after the exchange, the page offers a retry using the encrypted pending
credential. If the pending credential has expired or cannot be used, discard
the pending pairing and request a new invitation. Discarding removes Flixer's
local copy but does not revoke the credential at the logger; ask the owner to
revoke it if necessary. Owners can list and revoke management credentials for
the selected deployment under **Deployment management credentials**. This
does not revoke previously issued ingest or query credentials. If the exchange response was lost before Flixer stored it, the
invitation has been consumed and the owner must create another.

Invitations grant management access to the named deployment and are shown
only once. Treat them and the clipboard as sensitive. Owners can list or
revoke unused invitations; revocation does not remove a credential already
issued by a redeemed invitation. Manually paired management credentials
expire and are not automatically renewed; the connection panel displays the
expiry. Replace the connection before it expires. The opt-in Coder local
bootstrap can renew connections it created, as described in the Coder guide.
Connecting the initial owner credential remains manual outside that bootstrap.

The logger health panel shows the latest retention worker check for the current
deployment, including its deletion count or a failure warning. Reaching the
batch limit means more expired events may remain, not that a backlog is
confirmed. This diagnostic is held in memory and may be absent after a logger
restart or when the logger evicts older deployment status entries.

The dedicated **Logging** page connects an operator-provisioned logger,
configures retention, logical event-body quotas and per-deployment ingestion limits, checks storage
readiness and deployment activity, displays severity totals and event and error trends with selectable
one-hour through 30-day windows and UTC minute, hour or day buckets, and
exact-message error groups for the previous 24 hours,
and shows recent logs, indexed historical searches and a live stream.
Minute buckets are limited to windows of 24 hours or less. Apply changes to
refresh the analytics; the displayed window and bucket reflect the applied
settings rather than unsubmitted changes.
Application and source totals use a separate fixed 24-hour window.
The experimental logger refuses an unsafe or world-writable storage parent;
the existing Compose log directory is not yet isolated from legacy services
and must not be used for logger data without a secure deployment migration.
Historical searches can be filtered by whole words, phrases, substrings or
regular expressions;
app, source, instance, severity, event code, trace, request and task filters
are exact. Event timestamps can be displayed in local time or UTC; stored
timestamps remain UTC. Substrings use a bounded candidate scan and
may require a narrower window or additional filters. Regular expressions use
Go RE2 syntax, are case-sensitive unless prefixed with `(?i)`, and are limited
to 256 UTF-8 bytes. Regex searches use the same bounded candidate scan and may
also require narrower filters. Error grouping is limited
to 10,000 events and 1,000 groups and reports an error instead of partial
counts when exceeded. Search windows are limited to
30 days in the interface. Live reconnects attempt bounded replay from the last
received event. When retention has removed the cursor, replay exceeds its
limits, a disconnect occurs before the first event, or the 500-event display
buffer fills, the page warns that events may be missing; use historical search
to find them. Live streaming applies the exact structured filters selected at
start to both replayed and new events; restart the stream to change them.
Message text and the historical time window do not filter live events. The
live buffer is separate from historical searches, so searching or loading
another history page does not stop the stream. Either view can export its first
500 displayed events as JSON, and individual events can be copied. Treat
downloads and clipboard contents as sensitive. Pausing freezes the display,
not the stream: incoming events continue to fill the bounded buffer and may
evict older entries. The logger origin must be reachable from the Flixer API,
with HTTPS except for literal loopback HTTP. The browser needs access only to
the Flixer API. Query credentials are kept in Flixer's memory, not browser
storage or URLs. A non-streaming response is limited to 16 MiB; the relay
preserves live-stream cursors and cancels upstream requests on disconnect.
Changing the logger connection or management credential ends in-flight relay
responses, including live streams; reconnect to continue viewing logs.

The explorer can save up to 20 named filter sets in browser storage, scoped to
the configured logger origin. Saved values are visible to other users of that
browser profile and are not an authorization boundary; saving a name again
replaces it. A copied filter link places values in the URL fragment and opens
the Logging page with the fields populated; the recipient must still be an
authorized administrator and start the search. Relative windows are evaluated
when the search runs. Filter values may contain sensitive text or identifiers,
so share links and browser profiles only with trusted people. Never save or
share credentials in filter values. Links may be recorded in browser history,
and authentication redirects may include the link in a query string.

The quota counts retained serialized event-body bytes, not indexes or physical
disk usage. Zero disables the limit. Once the limit is reached, new batches
can be rejected and producers may drop logs; retention can free logical quota
without immediately reclaiming physical disk space.

Ingestion limits can optionally apply to each credential as well as the entire
deployment. Set both credential fields to zero to disable the per-credential
limit. Token buckets are in memory and start full after a logger restart or
credential rotation; the deployment limit still applies. Older clients that
replace the policy without credential fields disable the per-credential limit.
Service limits use one bucket per application across its credentials. Enabling
them rejects unbound credentials with HTTP 403; migrate every producer to an
application-bound credential first. Set both service fields to zero to disable
the service limit. Older clients that omit the service fields disable it.

Retention can override the default days per severity; a blank or zero override
uses the default. Changes replace the entire policy. Disabling retention stops
future cleanup but does not restore events already deleted.

Trace and task detail uses the exact indexed identifier across services and
displays events in logger ingestion order. It loads older pages up to 500
events, not an unlimited timeline; producer timestamps can differ because of
clock skew. Identifiers are sent to the logger as query parameters and may be
sensitive.

Top sources shows the ten highest application/source counts for the preceding
24 hours ending at the last complete UTC minute. The logger returns an error
instead of partial counts if its source-statistics budget is exceeded.
Events by application sums all returned sources per application over the same
window and reports the same error rather than showing partial totals.

Registration also issues a separate ingestion credential for the Flixer API,
bound to the `flixer` application, stored encrypted and renewed before expiry.
Registration and renewal require a logger version that supports application-bound
credentials. A legacy unrestricted credential is renewed to obtain a binding;
if renewal fails, the existing credential remains configured. The previous
credential is not automatically revoked and remains valid until expiry or
explicit revocation. The credential list shows each ingestion restriction or
identifies legacy unrestricted credentials. The experimental exporter sends
redacted records asynchronously through a bounded in-memory queue, while the
existing appenders remain active. Records may be dropped on overload, delivery
failure or shutdown. After three consecutive transient batch failures, the
exporter pauses delivery for 30 seconds and drops queued batches during that
pause; its status shows when the circuit will reopen. Redaction is best effort,
so sensitive information must not be placed in log messages or identifiers.
Administrators can list and revoke issued query and ingestion credentials
for their deployment. Revocation interrupts the service or session using the
credential. When Flixer has recorded its own ingestion credential's ID,
revocation through this page clears it and the API attempts to issue a new one
within a minute. Older credentials without recorded IDs and out-of-band
revocations require reconnecting the logger. Bootstrap management credentials
are not listed or revoked there.

AI, Indexer, Streamer and Updater can obtain application-bound ingestion
credentials from a paired Flixer over HTTPS, literal loopback HTTP or a
protected local Unix socket. The Compose configuration selects a signed socket
on its shared secrets volume; it does not send enrollment responses over the
plaintext container network. Flixer stores these credentials encrypted, renews
them before expiry and clears them when the logger connection is replaced.
Export is suspended when enrollment cannot be confirmed. Go producers poll
every five seconds and AI every minute, so events may still reach the previous
deployment before the next refresh; requests already accepted cannot be
recalled. The shared application secret is not a distinct service identity.
A pre-provisioned AI logger credential file takes precedence. When a producer
credential issued by the current Flixer version is revoked through this page,
Flixer clears it and issues a replacement at the next enrollment refresh.
Out-of-band revocations and older credentials without a recorded ID still
require reconnecting or pairing again. The logger endpoint itself requires TLS
outside literal loopback; TLS-terminating proxies and all upstream hops must
be trusted and protected.

The dashboard Logs widget links to the dedicated Logging page rather than
maintaining a second viewer. The bundled Compose deployment provisions the
internal Logger and pairs it through Flixer's protected owner bootstrap file.
See the [Flixer Logger guide](../flixer/logger.md) for deployment, API,
retention, limits and recovery details.

## Libraries and SMB network shares

`src/components/admin/NetworkSharesSection.vue` is displayed above the library list in the Libraries tab. It supports SMB shares only, showing connection status and error text; admins can create/edit, reconnect, and delete a share. Calls use `GET/POST /admin/network-shares`, `PATCH /admin/network-shares/:id`, `POST /admin/network-shares/:id/reconnect`, and `DELETE /admin/network-shares/:id`. It listens on the `shares` live topic. The library modal selects a media type (`movies`, `tvshows`, `music`, `homevideos`, or `mixed`), image storage mode (`cache` or `alongside`), and one or more folders.

## Indexer controls and providers

The queue section reads `GET /admin/indexer/status` and subscribes to topic `indexer`. It displays scan state and counters for the six queues (`scan`, `identify`, `metadata`, `images`, `probe`, `refresh`), allows pause/resume, and saves per-queue worker concurrency with `PUT /admin/indexer/concurrency`. The task browser filters by queue/state and pages `GET /admin/indexer/tasks`; it offers cancel/retry actions at `/admin/indexer/tasks/:queue/:id/{cancel,retry}`. A task's **Logs** button opens a Logger-backed view of events from the past 30 days, up to 1,000 events, following new events while the modal remains open. Logger retention can remove events sooner; delivery is best effort. Reopen the modal after a day to start a fresh query window. The previous Indexer Redis task-output endpoint has been removed.

New Indexer task events include a trace ID shared with Flixer API requests made
by that task. In **Logging**, inspect the trace to see correlated task and API
request events when both services have successfully exported them.
The task-output view reports drops and write failures observed by the Indexer
instance answering the request since it started; it does not aggregate other
instances or identify which tasks were affected. Drops include queue overflow,
oversized records, shutdown and the 1,000-entry per-task cap.

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
