---
sidebar_position: 7
title: Subtitles
description: OpenSubtitles configuration, matching, automatic fetch, sidecar naming, and API operations.
---

# Subtitles

`internal/subtitles` integrates with OpenSubtitles API v1. The integration is separate from metadata providers and is enabled only when an API key is configured. Search needs an API key; downloading also requires an OpenSubtitles account username and password.

## Credentials and language preferences

Use `OPENSUBTITLES_API_KEY`, `OPENSUBTITLES_USERNAME`, and `OPENSUBTITLES_PASSWORD` to configure credentials from the indexer environment. Alternatively, flixer settings may supply subtitle configuration. Flixer's settings take precedence when they contain a non-empty API key; if their language list is empty, the indexer uses the environment languages. `SUBTITLE_LANGUAGES` is a comma-separated list and defaults to `METADATA_LANGUAGE`, then `en`. `SUBTITLE_AUTO_FETCH` defaults to enabled and is disabled only by the case-insensitive string `false`. `internal/config/config.go` contains the actual defaults; see [Configuration](./configuration.md).

The client logs in only when downloading, caches its access token for 20 hours, and uses the OpenSubtitles-provided API base URL when present. A download quota/rate-limit response blocks further subtitle requests for an hour. Searches exclude AI-translated results and rank hash matches first, then non-hearing-impaired results, then download count.

## Automatic fetch during indexing

At the final probe stage, the indexer may fetch subtitles for movies, episodes, and home videos (`video`). It does not auto-fetch for series, seasons, albums, or tracks. For each configured language it checks for an existing sidecar and embedded subtitle language; it only searches for languages not already available. If the file is large enough to hash, the OpenSubtitles movie hash is included. Lookup uses movie/episode type, available IMDb/TMDB IDs (or series IDs and episode numbers), and title text when no provider ID is available.

Automatic searches have a 45-second task timeout. A path with no matching subtitle is remembered in process memory for 24 hours, so rescans do not repeat a fruitless search immediately. A quota response stops the remaining automatic downloads for that item. Subtitle failures are logged but do not fail the media indexing job. See `internal/pipeline/subtitles.go` and `internal/pipeline/handlers.go`.

## Sidecar files

Subtitles are saved beside the video as `<video-base>.<language>.srt`; if that name already exists, a numeric suffix is added, such as `<video-base>.en.2.srt`. The downloader requests SRT and the current save path always writes `.srt`. Listing and language-existence checks also recognize `.vtt` sidecars. Existing files are never overwritten. Input is normalized to UTF-8 where possible; invalid UTF-8 is interpreted as Latin-1.

Language tags accepted by the API are two/three letters with an optional short region/script suffix. Existing language comparisons normalize known ISO-639 three-letter codes and strip region suffixes (for example, `eng` and `en-US` compare as `en`). The OpenSubtitles search result reports `fileId`, language, release, filename, download count, hearing-impaired flag, hash-match flag, rating, and optional uploader.

## Manual operations

The authenticated endpoints are `POST /internal/subtitles/list`, `/search`, `/download`, and `/delete`; request/response schemas are in [HTTP API](./http-api.md). Every operation requires an absolute regular media file path under a configured library folder. Search may use a typed `query` to replace provider IDs for a different release; otherwise it prefers IDs and a hash. Downloads save a sidecar; deletion accepts only a basename belonging to that video's subtitle sidecars. The indexer must be able to write to the media directory to download subtitles, regardless of image storage policy.
