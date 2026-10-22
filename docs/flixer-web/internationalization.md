---
sidebar_position: 11
title: Internationalization
description: vue-i18n locale discovery, fallback, Weblate workflow, message conventions, and translation validation.
---

# Internationalization

The UI uses `vue-i18n` in Composition API mode. Setup and locale selection live in `src/i18n/index.ts`; translation catalogs are nested JSON files under `src/locales/`. The checked-in catalogs are `en.json` (source), `de.json`, and `es.json`. English is loaded with the app; other catalogs are discovered from `src/locales/*.json` and loaded on demand. Missing translations fall back to English.

## How locale selection works

On startup, `initLocale()` applies the stored `flixer.locale` value if it matches an available locale. Otherwise it selects an exact browser language, then its base language (for example `pt-BR` then `pt`), then English. Applying a locale updates vue-i18n, `<html lang>`, and local storage. `main.ts` waits for initial locale loading before mounting the app.

The account menu opens the language modal; Settings also provides a Language tab. `setLocale()` applies the choice immediately and, if the user is signed in and online, best-effort saves it through `/preferences`. `syncLocaleFromAccount()` runs after app startup and applies a valid account preference or uploads the current local choice. Offline/backend errors leave the local language in place.

## Add or update translations

1. **Developers edit only `src/locales/en.json`.** Add the English string at the appropriate nested key. Do not hand-edit translated catalogs; Weblate is the translation workflow.
2. Use descriptive nested keys that follow the existing feature namespace, such as `settings.tabs.profile` or `admin.indexer.queuesTitle`. Look up existing messages first and put related text together.
3. Use named placeholders (`{name}`, `{count}`) instead of concatenating sentence fragments. Preserve every placeholder exactly in translations.
4. For plural forms, use vue-i18n's pipe syntax as described by `docs/TRANSLATING.md`, for example `"no items | one item | {count} items"`. ICU message format is not used/configured.
5. For a new language, add `src/locales/<BCP47-code>.json` using `en.json` as the template. The locale glob discovers it; Settings language options are generated from discovered file names. Missing keys are allowed and fall back to English. Weblate should own translated-file updates.

In a component, call `const { t } = useI18n()` and use `t('namespace.key')` in script/templates. Outside components, use `i18n.global.t(...)`. Language display names are derived using `Intl.DisplayNames`; the locale helper computes country flags where a region is available, with a small set of country overrides.

## Validation and Weblate

`npm run i18n:check` runs `scripts/check-locales.mjs`. It parses each non-English JSON catalog, rejects invalid JSON, keys not present in English, and mismatched `{placeholders}`. Missing or empty translations are accepted because runtime fallback is intentional. `.github/workflows/locales.yml` runs the check for locale changes in pull requests and pushes to `main` (the workflow also watches changes to the checker on pull requests).

`docs/TRANSLATING.md` documents the Weblate configuration: JSON nested structure, `src/locales/*.json` file mask, `en.json` source/template, BCP47-style file names, blank translation flags, and GitHub PR push/webhook workflow. Translators should preserve placeholders and use Weblate rather than editing catalogs directly.
