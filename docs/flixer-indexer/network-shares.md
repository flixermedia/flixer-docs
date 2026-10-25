---
sidebar_position: 8
title: Network shares
description: How flixer manages SMB connections and how indexed paths must be visible to flixer-indexer.
---

# Network shares

**SMB share management belongs to flixer, not flixer-indexer.** Flixer has a `NetworkSharesService` and `shareMounter` (`src/api/networkShares/networkSharesService.ts`, `src/api/networkShares/shareMounter.ts`) that stores share configuration, connects/reconnects shares, and offers connected shares as media roots. Saved passwords are encrypted in flixer's `network_shares` entity and are not included in the public share response.

The current flixer mount implementation uses Windows UNC paths and `net use` on Windows. On Linux and macOS it mounts shares under `DATA_PATH/mounts` (default `./data/mounts`); flixer's saved `readOnly` setting defaults to true. On Linux, mounting generally needs root or the `SYS_ADMIN` capability; flixer reports that constraint if it cannot mount. These SMB credentials and mount operations are **not passed to the indexer**.

## What the indexer receives

The indexer calls flixer's signed `GET /api/indexer/libraries`. Flixer builds each library folder's `absolutePath` from its media root plus the folder-relative path (`src/api/mediaLibraries/mediaLibrariesService.ts`). The indexer uses that absolute path for ordinary filesystem reads and writes; its `internal/models.Folder` also holds `rootId` and relative `path`. It has no SMB client, share credential fields, mount helper, or share-specific environment variable.

For an SMB-backed library, make the media path flixer reports accessible in the indexer's own filesystem namespace. A path that exists only in the flixer process/container is insufficient for a separate indexer container. Do not assume that mounting a share in one container automatically mounts it in another.

## Docker and native deployments

The indexer's `docker-compose.yml` mounts `${MEDIA_PATH:-../flixer-data/media}` at `/media`; its comment requires the path to match the path used by flixer and flixer-streamer. This mapping alone does not mount an SMB share configured inside flixer. Arrange for the share contents to be mounted/exposed to the indexer at the same path flixer returns—for example, share a host-level mount into both containers or configure equivalent container mounts—then use that path in the flixer media-root/library configuration. The mount location is determined by `DATA_PATH`, not an indexer variable.

For native runs, flixer may mount the share on its host (or you may mount it at the operating-system level). The indexer process must independently have read access to the resulting files, and write access if using alongside artwork or subtitle/lyrics sidecars. A Windows UNC path is valid only if it is reachable from the account running the indexer. The image store can fall back to `CACHE_PATH` when an alongside artwork write fails, but subtitle and lyrics downloads require writable media directories. See `docker-compose.yml`, `internal/images/images.go`, `internal/subtitles/subtitles.go`, and [Deployment](./deployment.md).
