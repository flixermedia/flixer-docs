---
sidebar_position: 3
title: HTTP API
description: Implemented streamer routes, authentication, query parameters, response types, and common errors.
---

# HTTP API

Routes are implemented in `internal/httpserver` and are all namespaced under `/streamer`. Media and playback-information routes require a valid token in the URL path. The admin routes use a separate derived bearer key. There is no playback-info issuance endpoint in this service.

Playback and subtitle responses use `Cache-Control: private, no-store`; trickplay indexes and sheets use private five-minute and one-day caching respectively. Information and error responses use `no-store`. Error bodies are JSON of the form `{"error":"code","message":"description"}`. Unsupported routes return the standard HTTP 404 response. If `ALLOWED_ORIGINS` is non-empty, a request with an `Origin` header must match one of its entries exactly. Preflight `OPTIONS` requests receive `204` and advertise `GET, HEAD, OPTIONS` and `Range, If-Range, If-Modified-Since` headers.

## Route reference

| Method and path | Auth | Query | Success response |
| --- | --- | --- | --- |
| `GET`, `HEAD /streamer/healthz` | None | None | `200`; GET returns `{"status":"ok","activeTranscodes":N}` JSON; HEAD has no body. Liveness only, not readiness. |
| `GET`, `HEAD /streamer/stream/{token}` | Stream token | `height`, `start` | Original media with range support for DirectPlay, or an FFmpeg output stream for DirectStream/Transcode. |
| `GET /streamer/info/{token}` | Stream token | `height`, `start` | JSON with `playMethod`, `source`, `availableHeights`, and sometimes `keyframeStart`. Requires FFmpeg/FFprobe. |
| `GET`, `HEAD /streamer/hls/{token}/index.m3u8` | Stream token | `height` | Static VOD HLS playlist; each segment is encoded on demand. Requires FFmpeg/FFprobe and known duration. |
| `GET`, `HEAD /streamer/hls/{token}/{index}.ts` | Stream token | `height` | One MPEG-TS segment generated on demand. Zero-based integer segment index. |
| `GET /streamer/lyrics/{token}` | Stream token naming an audio file | None | Neighboring `.lrc` content as `text/plain; charset=utf-8`. |
| `GET /streamer/subtitles/{token}` | Stream token naming a video file | None | JSON list of matching sidecar subtitle tracks. |
| `GET /streamer/subtitles/{token}?file={filename}` | Stream token naming a video file | `file` | Matching `.srt` or `.vtt` sidecar converted/passed through as WebVTT. |
| `GET`, `HEAD /streamer/trickplay/{token}/index.json` | Stream token | None | Per-source trickplay index JSON. `private, max-age=300`. |
| `GET`, `HEAD /streamer/trickplay/{token}/{n}.jpg` | Stream token | None | JPEG contact sheet, with HTTP range/conditional support and `private, max-age=86400`. |
| `GET /streamer/admin/sessions` | `Authorization: Bearer <admin-key>` | None | JSON snapshot of FFmpeg availability, configured limit, active process count, and tracked sessions. |
| `DELETE /streamer/admin/sessions/{id}` | `Authorization: Bearer <admin-key>` | None | Cancels the active session and returns `204`; missing/expired session returns `404`. |

Tokens are compact JWTs, so clients should URL-encode them when constructing request URLs. Tokens containing a slash in the path are rejected. The admin key is the lowercase hexadecimal HMAC-SHA256 derived from the shared secret; see [Authentication](./authentication.md).

## Stream options

`height` accepts only `240`, `360`, `480`, `720`, or `1080`. It is a maximum output height; the service never scales a source upward. `start` is a non-negative number of seconds, capped at seven days. These are optional on `/streamer/stream` and `/streamer/info`; `height` is also accepted on both HLS paths. `/streamer/lyrics` and `/streamer/subtitles` do not accept playback options. The handler parses the supported parameters; unknown query parameters are not used as options.

DirectPlay responses are served by Go's `http.ServeContent`: they advertise `Accept-Ranges: bytes` and can return `206 Partial Content` for a valid `Range` request. Processed output is streamed live with status `200`, no content length or byte-range seeking, a `Content-Type` of `video/mp4` or `video/webm`, and an `X-Flixer-Playback-Mode` header. Use a new request with `start` to seek in progressive processed playback.

Example response from `/streamer/info/{token}` (shape; actual values come from FFprobe):

```json
{
  "playMethod": "DirectStream",
  "source": {
    "videoCodec": "h264",
    "audioCodec": "aac",
    "width": 1920,
    "height": 1080,
    "durationSeconds": 10
  },
  "availableHeights": [240, 360, 480, 720],
  "keyframeStart": 59.96
}
```

`keyframeStart` is present only for a remux/DirectStream request with a positive `start`, and only when FFprobe can find an earlier keyframe.

## Admin session JSON

`GET /streamer/admin/sessions` returns fields `transcodingAvailable`, `maxTranscodes`, `activeTranscodes`, and `sessions`. Each session includes the token's `playSessionId` as `id`, user/media identifiers, relative `file`, delivery type (`progressive` or `hls`), source probe details, `mode`, `height`, `positionSeconds`, timestamps, `bytesSent`, `running`, and an FFmpeg `pid` while a process is running. This endpoint exposes operational/session metadata; keep it private to the Flixer backend or a trusted management network.

## Common status codes

| Status | Examples |
| --- | --- |
| `400` | Unsupported/invalid `height` or invalid `start` on stream/info/HLS. |
| `401` | Missing, malformed, invalid, expired, or undecryptable stream token; missing/incorrect admin bearer key. |
| `403` | An unlisted browser origin when CORS origins are configured. |
| `404` | Unavailable/disallowed media, missing lyrics/subtitle/trickplay file (`trickplay_not_available`), unknown HLS route/segment, or unknown admin session. |
| `405` | Method not allowed; response includes `Allow`. |
| `422` | HLS requested for media with unknown/non-positive duration. |
| `501` | Required transcoder unavailable, or seek/height requested when FFmpeg is disabled. |
| `503` | FFmpeg slot not acquired before the 10-second wait; includes `Retry-After` (`5` for progressive playback, `2` for HLS). |
| `500` | Media probe/open or processed-stream failure. |

When FFmpeg is unavailable, `/streamer/info` and `/streamer/hls` return `501`. `/streamer/stream` still serves requests without `height` or `start` directly from the file; do not assume that the original file will be browser-compatible. Audio files also stream directly and do not go through FFprobe.
