---
sidebar_position: 1
title: Glossary
description: Terms used throughout the Flixer documentation.
---

# Glossary

| Term | Meaning |
| --- | --- |
| **Root media folder** | A folder named in `MEDIA_PATH` / `STREAM_MEDIA_ROOT`. Libraries are built from folders inside roots. |
| **Library** | An admin-defined collection (for example Movies, TV Shows, Music) with a type and one or more folders. Stored in the database. |
| **Item** | A movie, series, episode, album or track in a library. |
| **Scan** | An indexer run over a library: discover, probe, fetch metadata, write items. |
| **Direct play** | The original file is sent unchanged. |
| **Remux / DirectStream** | Streams are copied into a browser-friendly container without re-encoding. |
| **Transcode** | Video and/or audio is re-encoded, for example to change resolution. |
| **HLS** | HTTP Live Streaming; segmented playback served by the streamer. |
| **Stream token** | Short-lived HMAC-signed token that authorises a browser to read from the streamer. |
| **Topic** | A named live data channel on the `/api/live` WebSocket (`overview`, `streams`, `devices`, `indexer`, `shares`). |
| **Network share** | An SMB share an admin adds so its files can be used by libraries. |
| **Queue** | An indexer work queue (scan, identify, metadata, images, probe, refresh) with its own worker count. |
