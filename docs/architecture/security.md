---
sidebar_position: 4
title: Security model
description: Secrets, tokens and trust boundaries.
---

# Security model

## Secrets

| Secret | Used for | Shared with |
| --- | --- | --- |
| `JWT_SECRET` | Signing user access tokens | flixer only |
| `APP_SECRET` | Signing stream tokens and service-to-service requests; deriving the key that encrypts saved SMB share passwords | flixer, flixer-streamer, flixer-indexer |

:::warning
Changing `APP_SECRET` invalidates saved SMB share passwords; re-enter them afterwards.
:::

## Trust boundaries

- **Browser to API**: bearer access tokens; admin endpoints require an admin session.
- **Browser to streamer**: stream tokens only. The streamer has no user database.
- **Between services**: requests are signed with `APP_SECRET`. Internal ports (`8081`, `8091`, `8092`) should not be exposed publicly except through the proxy.
- **WebSockets**: browsers cannot set headers on a WebSocket, so the client sends an `auth` message first. The server closes with `4401` (unauthorized) or `4403` (not an admin) and revalidates periodically.
- **Folders**: libraries can only be built from folders under the configured root folders.

See [Authentication](../flixer/authentication.md) for passkeys, API keys and email verification.
