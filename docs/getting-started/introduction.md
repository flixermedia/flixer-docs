---
sidebar_position: 1
title: Introduction
description: What Flixer does and where to find the guides you need.
---

# Introduction

Flixer is a self-hosted media server for organizing and watching your own
movies, shows, and music. It scans folders you choose, builds a library, and
serves playback through a web app.

## What makes up Flixer

The self-hosted application uses the Flixer API, web app, streamer, and
indexer, plus PostgreSQL, Redis, Meilisearch, [Logger](../flixer-logger/overview.md), and the
updater. [AI recommendations](../flixer-ai/overview.md) and a TURN relay for
calls are optional Compose services. [Plugins](../flixer-plugins/overview.md)
are managed by Flixer, and Flixer Cloud is a separate website rather
than a dependency of the self-hosted server.

See the [ecosystem guide](../ecosystem.md) for all repositories and their
roles.

## Choose a guide

- **New installation:** [Quick start](./quick-start.md)
- **Configure or maintain a server:** [Operations](../operations/deployment.md)
- **Understand how services work together:** [Architecture](../architecture/overview.md)
- **Develop Flixer:** [Local development](./local-development.md)

For installation, use the official installer at
[get.flixer.dev](https://get.flixer.dev).
