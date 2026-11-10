---
sidebar_position: 1
title: Flixer Web
description: The browser app for browsing, playing, and managing Flixer.
---

# Flixer Web

Flixer Web is the browser app for your Flixer server. Use it to browse and
search the library, play video and music, manage your account, and open the
admin dashboard.

The web app uses the Flixer API for account, catalog, and administration
features. When you play something, the API authorizes the request and the
separate [streamer](../flixer-streamer/overview.md) serves the media.

## What users can do

- Browse, search, and view media details.
- Play video and music, save playback progress, and view subtitles or lyrics
  when available.
- Manage profile details, language, theme, and passkeys.
- Use administrator pages to manage libraries, users, providers, and services.

The interface is a Vue single-page application delivered as static files.
Offline access is limited to the cached app shell; library and playback data
still need a connection to Flixer.

## More information

- [User features](./user-features.md)
- [Video player](./video-player.md)
- [Music player](./music-player.md)
- [Admin dashboard](./admin-dashboard.md)
- [Configuration and deployment](./configuration.md)

For source and release-specific details, see the
[Flixer Web repository](https://github.com/flixermedia/flixer-web).
