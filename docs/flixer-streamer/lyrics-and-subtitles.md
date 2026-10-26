---
sidebar_position: 7
title: Lyrics and subtitles
description: Sidecar .lrc, .srt, and .vtt discovery and HTTP delivery behavior.
---

# Lyrics and subtitles

The streamer serves sidecar text files stored next to media, using the same encrypted locator token and root-confined resolver as playback. It does not extract embedded subtitle streams or fetch lyrics from an external provider. Implementations are in `internal/httpserver/audio.go` and `internal/httpserver/subtitles.go`.

## Lyrics

`GET /lyrics/{token}` expects a valid stream token whose relative path has one of these audio extensions: `.mp3`, `.flac`, `.m4a`, `.aac`, `.ogg`, `.opus`, `.wav`, `.aiff`, or `.aif` (extension matching is case-insensitive). It first opens `DATA_PATH/cache/lyrics/{media item id}.lrc` (override with `LYRICS_PATH`), where the indexer stores lyrics it downloads from lrclib.net so read-only libraries work. If that file is absent it replaces the audio extension with `.lrc` and opens that sibling in the same media root, for example `Music/Track.flac` looks for `Music/Track.lrc`.

A successful response is `text/plain; charset=utf-8` with `Cache-Control: private, no-store`. The handler reads at most 2 MiB. Unsupported token file extensions, missing sidecars, or invalid paths return `404 lyrics_not_found`; unexpected filesystem/read errors return `500 lyrics_failed`. Only `GET` is allowed.

## Subtitle listing

`GET /subtitles/{token}` expects a token naming a video file that can be resolved beneath an authorized media root. The handler lists regular directory entries whose extension is `.srt` or `.vtt` and whose filename begins with the video's base filename plus a dot. For a video named `Film.mkv`, candidates include `Film.en.srt`, `Film.en.forced.vtt`, and `Film.srt`; unrelated files and subdirectories are not included.

The JSON response is `{ "tracks": [...] }`. Each track has an `id` equal to its filename, a `language`, and an optional label. The first suffix component is treated as a language only if it matches the accepted 2–3 letter code with an optional region-style component; otherwise the language is `und`. Remaining dot-separated components form a space-separated label. The list sorts first by language, then filename.

## Serving a subtitle

`GET /subtitles/{token}?file={filename}` serves one discovered sidecar. `file` must be a basename (no slash or backslash), have `.srt` or `.vtt` extension, and match the video's base-name prefix. The resolver opens it under the same root; arbitrary paths cannot be selected.

The result is always `text/vtt; charset=utf-8`. WebVTT input is passed through; SRT timestamps using comma milliseconds are changed to WebVTT dot-millisecond syntax and the `WEBVTT` header is added. A UTF-8 BOM is removed and line endings are normalized. Invalid UTF-8 bytes are converted byte-by-byte to Unicode code points rather than interpreted using a language-specific encoding. Files larger than 5 MiB fail with `500 subtitles_failed`; missing or disallowed names return `404 subtitle_not_found`. Subtitle responses are `private, no-store`.

These endpoints only expose external sidecar files; the FFmpeg playback plans disable subtitle streams (`-sn`). Subtitle selection/burning and embedded subtitle extraction are not implemented here.