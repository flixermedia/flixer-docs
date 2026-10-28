<div align="center">

<img src="https://raw.githubusercontent.com/flixermedia/flixer/main/resources/logo/flixer-logo.png" alt="Flixer logo" width="112" />

# Flixer Docs

**One home for Flixer knowledge.**

[![Stars](https://img.shields.io/github/stars/flixermedia/flixer-docs?style=flat-square)](https://github.com/flixermedia/flixer-docs/stargazers) [![Issues](https://img.shields.io/github/issues/flixermedia/flixer-docs?style=flat-square)](https://github.com/flixermedia/flixer-docs/issues)

[Flixer](https://github.com/flixermedia/flixer) · [Documentation](https://github.com/flixermedia/flixer-docs) · [Report an issue](https://github.com/flixermedia/flixer-docs/issues)

</div>

---

> [!WARNING]
> **Under active development.** Flixer components and integration contracts may change. Check current source and release notes before upgrading production installations.

> [!NOTE]
> **Role in Flixer:** The Docusaurus source for Flixer platform documentation. For an end-to-end deployment, start with the [Flixer backend repository](https://github.com/flixermedia/flixer).

## ✨ Features

- **Unified docs:** Cover the backend, web client, streamer and indexer.
- **Docusaurus:** Static website with hot-reload development and production builds.
- **Organised navigation:** Documentation grouped by area and ordered with sidebar metadata.
- **Shared visual language:** CSS tokens align the docs with Flixer Web.
- **GitHub Pages deployment:** Automated publishing from the `main` branch.

## 🏗️ Architecture

Flixer separates application logic from its web UI, media indexing, media delivery, update management, plugins and documentation. **Flixer Docs** owns the following responsibility: the Docusaurus source for Flixer platform documentation.

For the full platform, the API coordinates services; the browser interacts with the backend and the streamer receives authorised playback requests. Components should be operated as part of the supported Flixer stack unless you are developing or testing them directly.

## 🚀 Getting started

### Run locally

Requires Node.js and npm.

```bash
git clone https://github.com/flixermedia/flixer-docs.git
cd flixer-docs
npm install
npm start
```

### Build and preview

```bash
npm run build
npm run serve
```

Production output is written to `build/`. Build-time `DOCS_URL` and `DOCS_BASE_URL` configure alternate hosting; the existing default targets `https://flixermedia.github.io/flixer-docs/`. For root-level local preview, set `DOCS_BASE_URL=/`.

## 📁 Where documentation lives

```text
flixer-docs/
├── docs/                     # Guides and reference pages by area
├── src/css/custom.css        # Visual theme tokens
├── static/img/               # Site assets
├── sidebars.ts               # Sidebar configuration
├── docusaurus.config.ts      # Site configuration
└── .github/workflows/        # GitHub Pages deployment
```

Documentation pages are placed under `docs/<area>/`. Use `_category_.json` and page `sidebar_position` values to manage navigation. The custom CSS mirrors design tokens in `flixer-web/src/tailwind.css`.

## 🚀 Publishing

Push to `main` to trigger `.github/workflows/deploy.yml`. The repository must have **Settings → Pages → Build and deployment → Source: GitHub Actions** enabled. Production builds fail on broken links, so run `npm run build` before merging.

## ✍️ Writing guidelines

Document real, currently implemented behaviours; link to relevant source repositories for service-specific configuration; call out experimental or proposed features explicitly; and include reproduction steps for commands or troubleshooting procedures.

## 🧩 Flixer ecosystem

| Repository | Purpose |
| --- | --- |
| [Flixer](https://github.com/flixermedia/flixer) | The self-hosted backend API, authentication, libraries, and administration service. |
| [Flixer Web](https://github.com/flixermedia/flixer-web) | The Vue 3 application that powers browsing, sign-in, discovery, and playback interfaces. |
| [Flixer Streamer](https://github.com/flixermedia/flixer-streamer) | The Go service responsible for authorised media delivery and FFmpeg processing. |
| [Flixer Indexer](https://github.com/flixermedia/flixer-indexer) | The Go worker and API service for discovering, identifying, probing, and enriching media. |
| [Flixer Updater](https://github.com/flixermedia/flixer-updater) | The Go sidecar that orchestrates Docker Compose updates and restores. |
| [Flixer Plugins](https://github.com/flixermedia/flixer-plugins) | The official versioned catalogue of Flixer plugins and plugin schemas. |
| [Flixer Docs](https://github.com/flixermedia/flixer-docs) | The Docusaurus source for Flixer platform documentation. |

## 🤝 Contributing

Contributions, bug reports and documentation improvements are welcome. Open an [issue](https://github.com/flixermedia/flixer-docs/issues) with reproduction steps or a focused proposal, then submit a pull request against the repository. Keep configuration, examples and documentation aligned with implemented code. For backend contributions, also see the [main contribution guidelines](https://github.com/flixermedia/flixer/blob/main/CONTRIBUTING.md).

## 📄 Licence

Check this repository's [`LICENSE`](LICENSE) file, if present, for the authoritative licensing terms. The [main Flixer backend](https://github.com/flixermedia/flixer/blob/main/LICENSE) uses MIT; licensing for separate components should be verified individually before redistribution.

---

<div align="center">

**Your media. Your server. Your rules.**

Made for the [Flixer](https://github.com/flixermedia) ecosystem.

</div>
