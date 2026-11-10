---
sidebar_position: 3
title: Local development
description: Run the Flixer services from source.
---

# Local development

This guide is for contributors. For a normal server, use the
[installer](./quick-start.md).

## What you need

- The Flixer repositories checked out side by side.
- Node.js and npm for the backend, web app, and docs.
- Go, Redis, PostgreSQL, FFmpeg, and FFprobe for the services that need them.
- A development `APP_SECRET` shared by the backend, streamer, and indexer.

## Start the services

Run the database and Redis first. Then start the API, streamer, indexer, and
web app from their respective repositories:

```bash
# flixer
npm install
npm start

# flixer-streamer
go run ./cmd/flixer-streamer

# flixer-indexer
go run ./cmd/flixer-indexer

# flixer-web
npm ci
npm run dev
```

By default, the API listens on `8083`, the streamer on `8091`, the indexer on
`8092`, and Vite on `5173`. Check each repository's `.env.example` for the
variables needed to connect local services. Meilisearch is optional; the
backend can fall back to PostgreSQL search.

Run the documentation site separately from this repository with `npm ci` and
`npm start`.

The repositories' READMEs and test commands are the current source for
contributor workflows. The production Compose stack is not a substitute for
the local development configuration.
