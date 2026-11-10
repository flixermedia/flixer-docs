---
sidebar_position: 2
title: Configuration and API
description: Recommendation profiles, environment variables, internal API, logging, and development.
---

# Configuration and API

Most settings are managed in **Admin → Settings → AI** and are applied when the
service starts and whenever they change. The environment variables below are
defaults used if Flixer is unavailable at startup.

## Profiles

| Profile | Used when |
| --- | --- |
| `classic` | TF-IDF only, no model download. Lowest memory use. |
| `micro` | Small embedding model; at least 512 MiB available. |
| `mini` | Larger embedding model; at least 1.2 GiB available. |
| `auto` (default) | Picks `mini`, `micro`, or `classic` from available memory, respecting container limits. |

If a model cannot be downloaded or loaded, the next smaller profile is tried,
ending at `classic`.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8094` | HTTP listen port. |
| `DATA_DIR` | `/data` | Persistent Flixer data mount. |
| `MODELS_DIR` | `${DATA_DIR}/ai/models` | Model cache location. |
| `AI_ENABLED` | `false` | Enable recommendations when runtime settings cannot be loaded. |
| `RECOMMENDER_PROFILE` | `auto` | `auto`, `classic`, `micro`, or `mini`. |
| `ALLOW_DOWNLOADS` | `true` | Set `false` to disable first-use model downloads. |
| `FLIXER_URL` | `http://flixer:8080` | Core Flixer API origin. |
| `FLIXER_INTERNAL_TOKEN` / `FLIXER_INTERNAL_TOKEN_FILE` | file: `/run/flixer-secrets/app-secret` | Shared Flixer app secret. |
| `SENTRY_ENVIRONMENT` | `production` | Error-reporting environment label. |

Error reporting is configured in **Admin → General → Error Monitoring** (both
the global and AI switches plus the AI DSN) and takes effect after a restart.
Reports exclude request data, stack traces, user information, and
recommendations.

## Internal API

These endpoints are for trusted Flixer services on the Compose network.

| Route | Purpose |
| --- | --- |
| `GET /healthz` | Unauthenticated liveness check. |
| `GET /status` | Active profile and model-loading state. |
| `POST /v1/recommend` | Recommendations for `user_id`, with `limit` and optional `filters`. |
| `POST /v1/similar` | Titles similar to `item_id`. |

Recommendation endpoints require the `X-Flixer-Internal-Token` header. Both
return `{"items":[{"id":"...","score":0.92}]}` with scores from 0 to 1 in
descending order. The service reads data from signed internal Flixer endpoints
and accepts no database credentials.

## Logging

When Flixer is paired with [Flixer Logger](../flixer-logger/overview.md), AI
enrolls automatically over Flixer's signed internal connection and exports
request duration, HTTP status, and a trace ID shared with Flixer's own logs.
Request paths and bodies are not exported. Standard output logging stays on.
Advanced manual credentials are described in the
[flixer-ai README](https://github.com/flixermedia/flixer-ai#experimental-flixer-logger-export).

## Development

Use Python 3.12:

```bash
pip install -e '.[test]'
uvicorn flixer_ai.main:app --reload --port 8094
pytest
```

Set `FLIXER_URL` and `FLIXER_INTERNAL_TOKEN` (or the `_FILE` variant) before
calling `/v1/*`. `FLIXER_DEVELOPMENT_BUILD=true` appends `-dev` to the version
reported by the health endpoint.
