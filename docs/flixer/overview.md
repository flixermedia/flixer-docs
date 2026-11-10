---
sidebar_position: 1
title: Flixer backend
description: What the Flixer API does and how to configure it.
---

# Flixer backend

The Flixer backend is the center of the platform. It manages accounts,
settings, libraries, the media catalog, playback authorization, and the admin
API. It stores application data in PostgreSQL and coordinates with the
streamer and indexer.

## What it handles

- **Accounts and access:** passwords, sessions, passkeys, roles, and API keys.
- **Libraries and catalog:** media roots, library definitions, indexed items,
  and network shares.
- **Playback:** checks user access, issues playback tokens, and stores watch
  progress. The streamer delivers the media itself.
- **Administration:** users, devices, scans, service status, logging, and
  optional features.

## Configure and operate

The standard installation configures the backend through the setup wizard and
admin dashboard. For deployment-level settings, see
[Configuration](./configuration.md). Useful operator guides:

- [Authentication](./authentication.md)
- [Libraries and media](./libraries-and-media.md)
- [Playback and history](./playback-and-history.md)
- [Real-time updates](./realtime.md)
- [Flixer Logger](../flixer-logger/overview.md)
- [Plugins](../flixer-plugins/overview.md)
- [AI recommendations](../flixer-ai/overview.md)
- [Optional payments](./payments/overview-and-concepts.md)

The API source and release-specific setup are maintained in the
[Flixer repository](https://github.com/flixermedia/flixer).
