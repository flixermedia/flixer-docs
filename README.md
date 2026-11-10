# Flixer Docs

The source for the Flixer documentation site, built with Docusaurus and
published to GitHub Pages.

## Run locally

Requires Node.js 20 or later.

```bash
npm ci
npm start
```

Open the local URL printed by Docusaurus. To build and preview the production
site:

```bash
npm run build
npm run serve
```

The build is written to `build/`. `DOCS_URL` and `DOCS_BASE_URL` can override
the site URL and base path when needed.

## Where things live

- `docs/` — guides and service references.
- `src/pages/index.tsx` — documentation landing page.
- `src/css/custom.css` — site theme.
- `docusaurus.config.ts` and `sidebars.ts` — site and navigation settings.
- `.github/workflows/deploy.yml` — GitHub Pages build and deployment.

Edit the source in `docs/`; `build/` is generated and should not be committed.
Before submitting changes, run `npm run build` to catch broken links.

For product installation and administration, start with the
[Flixer quick start](https://docs.flixer.dev/getting-started/quick-start).
The official installers are served from
[get.flixer.dev](https://get.flixer.dev). For source code and the complete
component list, see the [Flixer ecosystem guide](https://docs.flixer.dev/ecosystem)
and the relevant repositories:
[Flixer](https://github.com/flixermedia/flixer),
[Web](https://github.com/flixermedia/flixer-web),
[Streamer](https://github.com/flixermedia/flixer-streamer),
[Indexer](https://github.com/flixermedia/flixer-indexer),
[Updater](https://github.com/flixermedia/flixer-updater),
[AI](https://github.com/flixermedia/flixer-ai),
[Plugins](https://github.com/flixermedia/flixer-plugins), and
[Logger](https://github.com/flixermedia/flixer-logger), plus the independent
[Flixer Cloud](https://github.com/flixermedia/flixer-cloud) website.
