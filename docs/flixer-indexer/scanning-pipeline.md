---
sidebar_position: 4
title: Scanning pipeline
description: Library discovery, media-name parsing, probing, progress states, rescans, and pruning behavior.
---

# Scanning pipeline

A scan begins when flixer calls `POST /internal/scan` with a library ID. The indexer resolves that library from flixer and queues one `scan:library` task. `internal/scanner/scanner.go` walks each configured folder's `absolutePath`; unreadable or unavailable roots fail the walk. Entries are read in case-insensitive name order. The `scanner` package only discovers and describes files—metadata lookup and persistence happen in later workers.

## Discovery and filename parsing

Recognized video extensions are `.mkv`, `.mp4`, `.m4v`, `.avi`, `.mov`, `.wmv`, `.mpg`, `.mpeg`, `.ts`, `.m2ts`, `.webm`, `.flv`, `.ogv`, `.3gp`, and `.divx`. `.iso` is explicitly not treated as a video. Audio extensions include `.mp3`, `.flac`, `.m4a`, `.aac`, `.ogg`, `.opus`, `.wav`, `.wma`, `.alac`, `.ape`, `.wv`, `.aiff`, and `.aif`. Hidden entries are skipped; known extras such as `extras`, `trailers`, `featurettes`, `samples`, and `.actors` are excluded according to `internal/naming/naming.go`.

| Library type | Discovery behavior |
| --- | --- |
| `movies` | Recursively emits one item per video. A file inside its own folder can use the folder name as its title/year/ID hint. |
| `tvshows` | Each direct child folder is treated as a series. Episode names are recognized as `SxxExx`, `1x02`, and supported ranges; bare episode numbers are accepted when a recognized season directory provides the season. Season folders recognize `Season 02`, `S02`, localized forms such as `Staffel`/`Saison`/`Temporada`, and `Specials`. Video files that do not parse as episodes are skipped. |
| `music` | A directory containing audio (or recognized `Disc N`/`CD N` subfolders) is treated as an album. Tracks are parsed from forms such as `01 - Title`, `01. Title`, and `1-02 Title`; disc subfolders fold into the containing album. |
| `homevideos` | Recursively emits one `video` per recognized video file, with title/year hints from its name. |
| `mixed` or an unknown type | Classifies top-level folders heuristically as music, TV, or movies based on audio, season directories, and episode-like names; top-level video files are treated as movies. |

Filename parsing extracts common provider-ID tags such as `[tmdbid-603]`, `{imdb-tt0133093}`, `tvdb`, `anidb`, `anilist`, and MusicBrainz IDs, as well as years and release markers. Parsing is heuristic, not a guarantee of an exact provider match. Music track metadata is later enriched from embedded tags.

## Processing and probing

The scan worker queues an identify task for each newly accepted item. The pipeline then runs identify → metadata → images → probe. Local NFOs are read from conventional item paths (for example `tvshow.nfo`, `season.nfo`, `album.nfo`, or a same-name movie/episode `.nfo`). An NFO is considered complete only if it has title, overview, year, and at least one genre; complete NFOs skip remote metadata lookups except episodes may still need provider artwork. `Force=true` bypasses that skip.

`ffprobe` is invoked with JSON format/stream output and a two-minute per-file timeout (`internal/probe/probe.go`). It records container, duration, bitrate, first video/audio codec details, dimensions, frame rate, HDR, bit depth, audio/subtitle languages, channels, and sample rate. Probe runs at the final stage for movies, episodes, home videos, and tracks; tracks are probed during identify first so embedded audio tags can override path-derived track details. If a final probe fails, retries are attempted; after the final failure, the item can still be indexed without technical details. Set `FFPROBE_PATH`/`FFMPEG_PATH` when the executables are not on `PATH`.

Items are written back to flixer with provider-first external keys and root-relative path fallback keys. On completion, the indexer may prune flixer records older than the scan start that were not rediscovered. Pruning is claimed only once per scan and is disabled when any item failed, avoiding deletion of records that may simply have failed indexing.

## Progress states and rescan semantics

Progress is stored in Redis by library for seven days (`internal/progress/progress.go`). A normal scan transitions `scanning` (filesystem walk) → `indexing` (walk ended; queued items are settling) → `complete` when done plus failed reaches discovered. A filesystem walk error sets `failed` and records an error/finish time. Individual task exhaustion increments the failed count; it prevents pruning even if the overall progress later reaches `complete`.

A scan request can include `force: true`, causing the pipeline to bypass complete-NFO metadata short-circuiting. A `POST /internal/refresh` re-describes one typed path, queues it as forced and untracked work, and does not increment scan progress or trigger pruning. Duplicate tasks of the same type/payload are suppressed for 30 minutes by Asynq task uniqueness.

There is **no continuous new-file watcher** in this service: no filesystem notification loop or scheduled scan is implemented. New content is found when flixer (or an operator) requests another library scan. Scans do walk the folders again, rather than relying on a persistent per-file change index; the item payload includes size and modified time, but the scanner does not use those values to skip unchanged files. See `internal/pipeline/handlers.go`, `internal/pipeline/pipeline.go`, and `internal/progress/progress.go`.
