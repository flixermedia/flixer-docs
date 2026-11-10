---
sidebar_position: 1
title: Flixer Indexer
description: The service that scans media and adds it to the Flixer catalog.
---

# Flixer Indexer

The indexer scans folders configured in Flixer, identifies media, reads local
metadata, and can fetch information and artwork from enabled providers. It
sends the results to the Flixer API; Flixer remains the source of truth for
libraries and catalog data.

Scanning is started from **Admin → Libraries**. Work runs through Redis-backed
queues, and administrators can monitor progress and adjust queue concurrency
in the dashboard. A scan is not a continuous folder watcher: run another scan
to discover new files.

The indexer needs access to the same media paths Flixer reports. If you use
containers or network shares, make sure the files are available to the
indexer as well as the API.

## More information

- [Scanning pipeline](./scanning-pipeline.md)
- [Metadata providers](./metadata-providers.md)
- [Queues and workers](./queues-and-workers.md)
- [Network shares](./network-shares.md)
- [Configuration](./configuration.md)

For source and release-specific details, see the
[Flixer Indexer repository](https://github.com/flixermedia/flixer-indexer).
