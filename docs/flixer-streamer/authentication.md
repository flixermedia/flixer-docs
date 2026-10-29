---
sidebar_position: 5
title: Authentication
description: HS256 stream-token requirements, encrypted locators, expiry checks, and admin bearer authentication.
---

# Authentication

`internal/token/token.go` validates stream tokens and decrypts the file locator. The service does not authenticate end users or issue playback tokens; a trusted Flixer integration must authorize the user and provide a token that satisfies this contract. The shared secret is configured as `APP_SECRET` (or the legacy fallback `JWT_SECRET`) and must be at least 32 bytes.

## Stream token

A request token is a compact JWT in the route path, for example `/streamer/stream/{token}`. It must use an unpadded base64url encoding and the following header:

```json
{"alg":"HS256","typ":"JWT"}
```

The signature is HMAC-SHA256 over the exact ASCII bytes of `base64url(header) + "." + base64url(payload)`, keyed by the shared secret. The validator requires these claims:

| Claim | Requirement |
| --- | --- |
| `iss` | Exactly `flixer`. |
| `aud` | Exactly `flixer-streamer`. |
| `sub`, `userId` | Both non-empty and equal. |
| `mediaItemId`, `mediaSourceId`, `playSessionId` | Non-empty identifiers. `playSessionId` is used for admin cancellation/tracking. |
| `mediaLocator` | Non-empty AES-256-GCM encrypted locator. |
| `iat`, `exp` | Positive integer Unix timestamps; `exp` must be after `iat`. The token is rejected when current Unix time is greater than or equal to `exp`; `exp - iat` cannot exceed four hours. |
| `jti` | Non-empty token ID. It is required but the current validator does not maintain a replay/revocation database for tokens. |

Optional parsed claims are `nbf`, `startTimeTicks`, `audioStreamIndex`, `subtitleStreamIndex`, `allowedBitrates`, `allowedVideoCodecs`, and `allowedAudioCodecs`. Their presence does not currently change the streamer's playback-mode decision. Tokens with `iat` or `nbf` more than 30 seconds in the future are rejected. The token parser caps the encoded token at 16 KiB. Token validation rejects malformed encoding, other algorithm/type values, invalid signature, issuer/audience mismatch, missing claims, and expiry violations with HTTP `401 invalid_token` from the HTTP API.

## Encrypted media locator

The plaintext locator is JSON containing a root ID and a root-relative path:

```json
{"rootId":"movies","relativePath":"Example/movie.mp4"}
```

The issuer encrypts its UTF-8 JSON bytes with AES-256-GCM. The 32-byte key is `SHA256(UTF8("flixer-streamer:media-locator:v1") || 0x00 || secretBytes)`. The exact UTF-8 string `flixer-streamer:media-locator:v1` is the GCM additional authenticated data. The encoded `mediaLocator` is unpadded base64url of `12-byte nonce || ciphertext || 16-byte GCM tag` (the implementation uses Go's standard AES-GCM nonce/tag sizes). The decrypted root ID and relative path are then checked against Flixer-provided roots by `internal/media`; traversal, absolute paths, invalid roots, and paths escaping the canonical root are rejected.

Use a cryptographically random secret, share it only with trusted Flixer/streamer components, and do not reuse it for unrelated signing. Configure HTTPS in deployment because the bearer-like token is in the URL and must be protected in transit. Do not log full tokenized URLs.

## Admin bearer key

The `/streamer/admin/sessions` endpoints use a derived key rather than the stream JWT. Derive the key as lowercase hex of `HMAC-SHA256(secret, "flixer-streamer:admin:v1")`; send it as `Authorization: Bearer <derived-key>`. `internal/httpserver/admin.go` compares it in constant time. No additional admin secret setting exists. Restrict these endpoints to trusted backend/management networks; do not expose them through a public reverse proxy.

## Flixer integration status

The streamer expects tokens but does not request them from Flixer. `examples/flixer.env.example` labels the backend token/playback-info variables as proposed settings and says Flixer does not currently issue streamer tokens. Integrators should not mistake the examples in `DESIGN.md` for a deployed backend endpoint.