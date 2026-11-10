---
sidebar_position: 5
title: Authentication
description: How Flixer authorizes playback and how the streamer protects media.
---

# Authentication

The streamer does not manage user accounts. Flixer checks the user's access
and issues a short-lived signed token for playback. The browser sends that
token to the streamer, which verifies it before opening a file.

The token contains an encrypted media locator rather than an arbitrary
filesystem path. The streamer resolves it only against media roots supplied
by Flixer and rejects paths outside those roots.

## Shared secret

Set the same strong `APP_SECRET` for Flixer, the streamer, and the indexer.
The services use it to authenticate requests and protect playback data. Keep
it private, do not log tokenized playback URLs, and use HTTPS when traffic
crosses an untrusted network.

The streamer's admin-session endpoints use a separate key derived from the
same secret. Keep those endpoints on the internal service network; do not
publish them through a public reverse proxy.

For exact token claims and signing details, use the
[streamer source](https://github.com/flixermedia/flixer-streamer) and the
[Flixer playback implementation](https://github.com/flixermedia/flixer/tree/main/src/api/playback).
