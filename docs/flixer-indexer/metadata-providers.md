---
sidebar_position: 6
title: Metadata providers
description: Integrated metadata and artwork providers, matching, precedence, and caching.
---

# Metadata providers

Provider implementations live under `internal/providers/`; `internal/providers/registry/registry.go` builds an ordered registry from flixer settings and environment fallbacks. Providers are queried only for missing metadata, except that the pipeline may still resolve episode artwork when a complete local NFO exists.

## Implemented providers

| Provider | Capability in this implementation | Configuration |
| --- | --- | --- |
| TMDB | Movie and series metadata, seasons/episodes, and movie/series artwork. | `TMDB_API_KEY` fallback or flixer provider setting. |
| TVDB | Movie/series/episode metadata, including IDs and some episode details. | `TVDB_API_KEY` fallback or flixer setting. |
| OMDb | Movie/series/episode metadata. | `OMDB_API_KEY` fallback or flixer setting. |
| Fanart.tv | Artwork for movies, series, seasons, and albums; not the primary metadata lookup. | `FANART_API_KEY` fallback or flixer setting. |
| AniList | Anime series metadata enrichment. | Keyless; enabled unless explicitly disabled. |
| AniDB | Anime series enrichment by a pre-existing AniDB `aid`; it does not search by arbitrary title. | `ANIDB_CLIENT` is the registered client name/fallback key. |
| MusicBrainz | Album lookup and release-group identifiers. | Keyless; enabled unless explicitly disabled. |
| Cover Art Archive | Artwork associated with MusicBrainz IDs. | Keyless; enabled unless explicitly disabled. |
| TheAudioDB | Album metadata. | `AUDIODB_API_KEY` fallback or flixer setting. |
| Discogs | Album metadata and identifiers. | `DISCOGS_TOKEN` fallback or flixer setting. |

All provider keys are optional. A provider requiring a key is omitted when there is no key. flixer's non-empty key wins over the environment fallback; an explicitly disabled provider remains off. A library-level `providers` list narrows the enabled registry for that library. The Cover Art Archive is included when `musicbrainz` is allowed for the library.

## Matching and merge rules

The indexer starts with IDs parsed from names and NFOs, as well as title/year hints. Movie, series, and album lookups send the known IDs along with text hints to providers; the registry passes IDs found by earlier providers to later providers. The default mainstream lookup order is TMDB, TVDB, then OMDb. Anime providers run as enrichment when the result or supplied IDs indicate anime. Album providers run MusicBrainz, TheAudioDB, then Discogs. Season and episode requests use resolved series IDs and season/episode numbers; provider support is not uniform (for example, TMDB is the season-capable implementation).

Metadata merge is fill-only: existing destination values win. This means local NFO values win over provider values, and earlier provider results win where they already populated a field. Missing IDs and fields can be supplied by later providers. Filename hints fill fields still empty at finalization. `internal/providers/providers.go`, `internal/providers/registry/registry.go`, and `internal/pipeline/handlers.go` implement these rules.

Local artwork found next to media is preferred by type: remote candidates are skipped for an image type already present locally. Downloaded remote images are validated and saved alongside the media when `imageStorage=alongside`; if that write fails, or the library uses cache storage, they go under `CACHE_PATH/<libraryId>/<path-hash>/`. The image store also extracts embedded audio cover art as a fallback for albums. Provider artwork candidate limits are applied by type in the pipeline.

## Caching and limits

Provider lookup results are cached **in memory** for 30 minutes per registry, and simultaneous identical lookups are collapsed to one provider call. Provider errors are cached for 15 seconds to avoid hammering a failing endpoint. The cache is not a durable metadata database and is lost when the process restarts. Artwork files are stored on disk separately; see [Configuration](./configuration.md). HTTP request counters are exposed through provider stats in `GET /internal/stats`.

`internal/providers/httpx` supplies shared provider HTTP behavior, request statistics, and provider-specific request pacing. AniDB in particular is paced to honor its request interval. Provider errors propagate through task retry handling unless the provider reports not found, which is treated as a normal no-match result.
