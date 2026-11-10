---
sidebar_position: 3
title: Troubleshooting
description: Quick checks for common installation, scanning, and playback problems.
---

# Troubleshooting

Start with **Admin → Overview** and the service logs:

```bash
docker compose ps
docker compose logs -f <service>
```

Run these commands from the Flixer installation directory. Check that Docker is
running and that the affected service is healthy before changing configuration.

## Can't open Flixer

- Check `docker compose ps` for stopped or unhealthy services.
- Confirm the proxy port in `.env` (default `8080`) is reachable and not used
  by another service.
- For a reverse proxy, forward the API and streamer paths and enable WebSocket
  upgrades.

## A library is empty or a scan fails

- Confirm the media folder exists and is mounted where Flixer expects it.
- Create libraries from folders inside the configured media root.
- Check that the indexer can read the same paths as Flixer and that Redis is
  healthy.
- For SMB, verify the share is connected and that the required Docker mount
  configuration is enabled.

## Playback does not start

- Confirm the streamer can read the media folder.
- Check the streamer logs for FFmpeg or FFprobe errors.
- Make sure Flixer and the streamer use the same `APP_SECRET`.
- Check the **Admin → Streams** panel and configured transcode limit.

## Passkeys or email do not work

- Passkeys need HTTPS and matching `APP_URL`, `PASSKEY_RP_ID`, and
  `PASSKEY_ORIGINS` values.
- Email verification requires a working SMTP configuration in the admin
  settings.

For service-specific settings, see the relevant
[configuration guide](./environment-variables.md) or the service's README.
