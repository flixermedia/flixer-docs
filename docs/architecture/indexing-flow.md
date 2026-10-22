---
sidebar_position: 3
title: Indexing flow
description: How a library becomes browsable media items.
---

# Indexing flow

```mermaid
flowchart LR
  A["Admin presses Scan"] --> B["flixer asks indexer to scan library"]
  B --> C["Indexer lists library folders from flixer"]
  C --> D["Discover files"]
  D --> E["Identify + probe"]
  E --> F["Fetch metadata and artwork"]
  F --> G["Write items to flixer"]
  G --> H[("Postgres")]
  G -.->|"429 backpressure, retried"| F
```

1. flixer sends a scan request to the indexer for a library; the library's folders come from the database.
2. The indexer works through queues with configurable worker counts. Admins can pause queues and change concurrency from the dashboard.
3. Results are written back through flixer's indexer endpoints. When too many writes are in flight flixer answers 429 and the indexer retries.
4. Progress is exposed as scan states and surfaced live in the dashboard over the `indexer` WebSocket topic.

Details: [Scanning pipeline](../flixer-indexer/scanning-pipeline.md), [Queues and workers](../flixer-indexer/queues-and-workers.md), [Metadata providers](../flixer-indexer/metadata-providers.md).
