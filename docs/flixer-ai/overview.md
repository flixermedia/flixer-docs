---
sidebar_position: 1
title: Overview
description: The optional Flixer AI recommendation service.
---

# Flixer AI

[`flixer-ai`](https://github.com/flixermedia/flixer-ai) is an optional,
self-hosted recommendation service. It suggests movies and series based on
watch history, favorites, and library metadata. It does not store user data or
recommendation results.

It starts with a zero-model TF-IDF recommender and can download small ONNX
embedding models for better semantic matches. After the first model download it
works offline.

## Enable it

The service is an opt-in Compose profile. The installer asks whether to enable
AI; to add it later, run this from the Flixer deployment directory:

```bash
docker compose --profile ai up -d
```

Then open **Admin → Settings → AI** to turn recommendations on, choose a
profile, control model downloads, and view service activity.

If the profile is not running, recommendation routes return HTTP 503 and the
rest of Flixer keeps working.

## How it fits

- It listens on the private Compose network only (`http://ai:8094`).
- Browsers never call it directly. Signed-in clients use the core API
  (`POST /api/recommendations` and `POST /api/recommendations/similar/{itemId}`),
  which derives the user from the session and forwards the request.
- Service-to-service calls are authenticated with Flixer's shared app secret.
- Models are cached under `${DATA_DIR}/ai/models`.

See [Configuration and API](./configuration.md) for profiles, environment
variables, and the internal API.
