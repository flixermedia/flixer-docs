---
sidebar_position: 2
title: Configuration and deployment
description: Vite environment settings, development proxy and TLS, and the static Docker/nginx deployment.
---

# Configuration and deployment

## Vite environment

The frontend has one project-defined `VITE_*` environment variable:

| Variable | Default | Used for |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Axios base URL in `src/api.ts`; the base path used to construct `/live` and `/logs/stream` WebSocket URLs; the web Sentry-config fetch in `src/monitoring.ts`. |

Vite substitutes `VITE_*` values at build time. For local development, create a root `.env` only when you need a non-default API base. The normal local setup keeps `/api` and uses the Vite proxy. `Dockerfile` declares `ARG VITE_API_BASE_URL=/api` and passes it into the build environment; override that build argument to bake in another API base. It is not a runtime setting in the final Nginx container.

## Development server and proxy

`npm run dev` starts Vite on port `5173` and binds to `0.0.0.0`; `allowedHosts: true` is configured. Proxy targets are fixed in `vite.config.ts`:

| Browser path prefix | Development target | WebSocket |
| --- | --- | --- |
| `/api` | `http://localhost:8083` | Enabled (used by `/api/live` and other API WebSockets). |
| `/stream` | `http://localhost:8091` | Not explicitly enabled. |
| `/info` | `http://localhost:8091` | Not explicitly enabled. |
| `/hls` | `http://localhost:8091` | Not explicitly enabled. |
| `/lyrics` | `http://localhost:8091` | Not explicitly enabled. |
| `/subtitles` | `http://localhost:8091` | Not explicitly enabled. |

Each proxy sets `changeOrigin: true`. The Vite config does not rewrite these paths. Thus normal development expects the API at `localhost:8083` and flixer-streamer at `localhost:8091`, or a deliberate replacement of the Vite config for a different topology.

## HTTPS certificates for local development

Vite checks for **both** `certs/origin.pem` and `certs/origin.key` relative to the project working directory. When both exist, it reads them and configures HTTPS with that certificate/key pair. When either is absent, the `@vitejs/plugin-basic-ssl` plugin is enabled and supplies its development certificate. The configuration does not read certificate paths from environment variables. Browser trust warnings depend on how the local certificate is provisioned; passkey/WebAuthn flows also require a secure context (localhost is treated specially by browsers).

## Docker and Nginx

The multi-stage `Dockerfile` defaults to `node:26.12.0-alpine` for the build. It installs locked dependencies with `npm ci`, copies the app inputs, runs `npm run build`, then copies `dist/` into `nginx:alpine`. The runtime image uses `deploy/nginx.conf` and exposes port `80`.

`deploy/nginx.conf` serves `/usr/share/nginx/html` and falls back to `/index.html` for unknown paths, enabling Vue Router history-mode URLs. It contains **no** `/api`, `/stream`, `/info`, `/hls`, `/subtitles`, or `/lyrics` upstream locations, no TLS listener, and no WebSocket proxy. The container therefore only serves the static frontend. A production reverse proxy/ingress or companion routing layer must make the API and streamer paths available at the frontend origin (or build with an appropriate absolute `VITE_API_BASE_URL` for the API, while also arranging streamer routing). Configure HTTPS and WebSocket forwarding in that deployment layer as required by the backend topology.

The GitHub Actions workflow `.github/workflows/docker.yml` builds and publishes `ghcr.io/flixermedia/flixer-web` on pushes to `main` and manual dispatch. It tags `latest` and a `sha-*` tag, and creates the package-version tag/release when that version has not previously been published. The locales workflow separately validates translations.

## Other scripts and configuration

- `npm run preview` runs Vite's local preview server for the built `dist/` output; it is not the production Nginx configuration.
- `npm run tunnel` invokes Localtunnel on port `5173`, with the configured subdomain and local HTTPS/invalid-certificate options. It is a development convenience, not a deployment proxy configuration.
- No separate `.env.example` or backend/streamer address variables are declared in `vite.config.ts`; proxy destinations are source constants.
