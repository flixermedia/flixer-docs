---
sidebar_position: 6
title: Sessions and limits
description: FFmpeg process slots, tracked playback sessions, disconnect cancellation, and admin controls.
---

# Sessions and limits

`internal/transcode/sessions.go` maintains an in-memory registry for FFmpeg runs. It is not a durable play-session database and does not store watch progress. The session ID comes from the validated token's `playSessionId`; Flixer remains responsible for user playback state.

## What is tracked

When a non-HEAD processed stream starts an FFmpeg process, the registry groups it under the token's playback-session ID. Progressive requests and individual HLS segment jobs can therefore be associated with the same logical playback session. Session metadata includes user/media identifiers, root-relative filename, delivery type, source probe result, remote address, and user agent. The snapshot includes mode, selected height, position, start/last-activity timestamps, bytes sent, whether a process is running, and process ID.

A session remains visible while any associated FFmpeg run is active. After its final run ends, it remains in the in-memory list for an idle grace period of 30 seconds, then is pruned when the registry is next accessed. Sessions are not persisted across process restart. DirectPlay does not run FFmpeg and is not entered in this registry. HEAD processed requests do not create a tracked playback session.

## Cancellation and client disconnects

FFmpeg runs under a request context. If the client disconnects, the context is canceled, the process is terminated, and the process slot is released. A client that stops reading output for more than two minutes also causes the write deadline/process path to fail rather than holding a slot indefinitely.

An authorized administrator can send `DELETE /streamer/admin/sessions/{id}`. The streamer cancels every currently registered FFmpeg run for that session and removes the session from the active list. A canceled session ID is temporarily revoked so that another processed request using the same ID cannot immediately recreate it; the revocation entry expires after one hour. This is in-memory administrative cancellation, not permanent token revocation. The admin API returns `204` when it found and canceled a tracked session, or `404 session_not_found` if no tracked session exists.

## Concurrency limit

`MAX_TRANSCODES` sets the maximum simultaneous FFmpeg processes; `0` means unlimited. This limit includes progressive remux/transcode and HLS segment processes. Each job waits up to 10 seconds for a free slot. If no slot becomes available, the request receives `503 transcoder_busy`; `Retry-After` is `5` for progressive streams and `2` for HLS. FFprobe operations are not counted against this FFmpeg slot limit. The limit is local to one streamer process/container, not coordinated across replicas.

`GET /streamer/admin/sessions` reports `maxTranscodes`, current `activeTranscodes`, whether transcoding is available, and the session snapshots. `/streamer/healthz` also returns the current active FFmpeg count. Both are operational views of this process, not a distributed session API.