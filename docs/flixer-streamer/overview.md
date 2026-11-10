---
sidebar_position: 1
title: Flixer Streamer
description: The service that reads media and delivers playback.
---

# Flixer Streamer

The streamer is the Flixer service that reads media files and sends playback
to the web app. Flixer authorizes playback and issues a short-lived token; the
streamer validates it and serves the requested media.

Depending on the file and client, the streamer can serve the original file,
remux it, transcode it, or deliver HLS. It also serves supported subtitle,
lyrics, and trickplay files. FFmpeg and FFprobe are used for processed
playback.

The streamer reads only media roots supplied by Flixer. In a container
deployment, those paths must be mounted and readable inside the streamer
container. Keep its internal administration endpoints private.

## More information

- [Playback modes](./playback-modes.md)
- [Authentication](./authentication.md)
- [Configuration](./configuration.md)
- [Deployment](./deployment.md)
- [HTTP API](./http-api.md)

For source and release-specific details, see the
[Flixer Streamer repository](https://github.com/flixermedia/flixer-streamer).
