# flixer-docs

Documentation for the Flixer platform (flixer, flixer-web, flixer-streamer, flixer-indexer), built with [Docusaurus](https://docusaurus.io/) and themed to match flixer-web.

```bash
npm install
npm start        # dev server with hot reload
npm run build    # static site in build/ (fails on broken links)
npm run serve    # preview the build
```

- Pages live in `docs/<area>/`; the sidebar is generated from folders, ordered by `_category_.json` and each page's `sidebar_position`.
- Theme tokens are in `src/css/custom.css` and mirror `flixer-web/src/tailwind.css`.
- Set `DOCS_URL` and `DOCS_BASE_URL` at build time when hosting somewhere else (defaults target `https://flixermedia.github.io/flixer-docs/`). For local preview at the root use `DOCS_BASE_URL=/`.

## Publishing

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and deploys it with GitHub Pages. One-time setup in the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
