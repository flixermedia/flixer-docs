---
sidebar_position: 8
title: Realtime updates
description: Shared admin topic WebSocket lifecycle, backoff and authorization handling, and the separate live log stream.
---

# Realtime updates

## Shared topic connection

`src/composables/useLive.ts` creates one module-scoped `LiveConnection` shared by all mounted panel instances. `useLiveTopic(topic)` subscribes on component mount, exposes a shallow `data` ref, the shared connection `status`, and a local `set(value)` helper, then unsubscribes on unmount.

Supported topic names are `overview`, `streams`, `devices`, `indexer`, and `shares`. When the first listener subscribes to a topic, the connection sends `{type: "subscribe", topic}` after authentication is ready. Multiple listeners for one topic share one server subscription. Removing the final listener for a topic sends `unsubscribe`; removing the last listener overall schedules socket shutdown after five idle seconds. The latest value per topic is cached in memory and immediately delivered to a newly subscribing listener while the connection remains active.

The WebSocket URL is the API base plus `/live`: a relative `/api` base becomes `ws://<current-host>/api/live` or `wss://...` according to page protocol; an absolute HTTP(S) base is changed to WS(S). On open, the client sends `{type: "auth", token}` using the saved access token. A `ready` message marks the connection live, resets retry count, and resubscribes to all current topics. Data messages with `type: "data"` and a topic update the cached value and listeners.

Unexpected closes mark the state disconnected and reconnect with exponential delay starting at one second, capped at 30 seconds. A successful ready resets the attempt counter. Close codes **4401** and **4403** are treated as unauthorized and do not reconnect. If there is no token at connect time, status becomes unauthorized without opening a socket. The status vocabulary is `connecting`, `live`, `disconnected`, and `unauthorized`.

## Topic consumers

| Topic | Consumers |
| --- | --- |
| `overview` | `src/components/admin/OverviewPanel.vue` — replaces REST overview data. |
| `streams` | `StreamSessionsPanel.vue` — replaces session list data; its one-second timer only advances elapsed display. |
| `devices` | `DevicesPanel.vue` — refreshes the device/session list; API-key list remains REST-driven. |
| `indexer` | `LibrariesPanel.vue` and `IndexerQueuesSection.vue` — updates indexer reachability, scans, queue statistics, and worker counts. |
| `shares` | `NetworkSharesSection.vue` — updates SMB share state. |

Each panel performs an initial REST read, then applies live payloads. Because `AdminView.vue` renders panels conditionally with `v-if`, inactive tabs unmount and relinquish their subscriptions; the shared socket closes after the final listener has been idle for five seconds.

## Live logs

`src/composables/useLiveLogs.ts` is a distinct connection used by `LogsPanel.vue`, not a topic on `/live`. It opens the API-base `/logs/stream` WebSocket and sends the same `{type: "auth", token}` message. A `snapshot` replaces the buffer and marks the connection live; each `log` message appends one entry. The buffer is bounded to the most recent 1,000 entries.

Logs reconnect with exponential backoff up to 30 seconds; close codes 4401/4403 become unauthorized without retry. Pause does not stop the socket: incoming rows are buffered separately (also capped at 1,000) and appended on resume. Clear empties the visible and pending client buffers. The panel's severity and text filters are local; Download exports the currently filtered entries. Leaving the Logs panel unmounts the composable and closes its socket.
