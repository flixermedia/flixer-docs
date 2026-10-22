---
sidebar_position: 4
title: User-facing features
description: Home discovery, browsing and search, media details, account settings, playback progress, and appearance controls.
---

# User-facing features

## Home and discovery

`src/views/HomeView.vue` fetches `/media/home` once on mount and presents the response through the components in `src/components/home/`:

- **Featured hero:** `HeroCarousel.vue` displays featured items with their artwork and descriptive metadata.
- **My Media:** library cards route to the matching `/movies`, `/tv`, or `/music` browser based on library type.
- **Continue Watching:** landscape cards show the saved playback percentage and link to the media item.
- **Recently added rows:** separate rows show recent movies, TV shows, and albums when the API returns entries.
- Empty libraries and load errors have explicit messages; the error state offers a retry. The shared `Header.vue` and `MobileTabBar.vue` provide navigation and mobile tabs.

## Browse and search

`BrowseView.vue` serves `/movies`, `/tv`, and `/music`. It requests `/media/browse/{kind}` with a sort (`added`, `title`, or `year`), offset, and a page size of 48. It displays poster cards (square artwork for music), fetches additional pages with **Load more**, and cancels superseded requests when filters/routes change.

`SearchView.vue` reads the query from `?q=`, focuses the search field on mount, and writes edits back into the URL. Search starts at two trimmed characters, is debounced by 250 ms, and is sent to `/media/search?q=...`; changing the query aborts the previous request. The input is capped at 100 characters. Results show the item type/year and link to media details.

## Media details

`MediaItemView.vue` loads `/media/items/:id`. It renders available artwork and metadata (tagline, overview, rating, genres, studios, runtime, technical details, and cast), then adapts its child list to the item:

- A series presents season tabs and episode lists; an episode can be opened or played.
- An album lists tracks and can start a queue; a track page can resolve its parent album and start from that track.
- A movie, episode, or video can open the full-screen `PlayerOverlay.vue`.
- Administrators see a subtitle-management action for playable movie/episode/video items; it opens `SubtitleModal.vue`.

## Profile, credentials, and devices

`/settings?tab=profile` is implemented by `ProfileSection.vue`, `AvatarUploader.vue`, and `PasswordSection.vue`. Users can change display name and email, upload/remove an avatar, change their password, and delete their account. Email changes can be pending verification; the profile UI reports the pending address. The account deletion modal confirms before calling the API and signing the user out locally.

The passkey tab (`PasskeysSection.vue`) lists, adds, and removes WebAuthn credentials and can require a passkey for sign-in. Registration/removal and disabling the requirement use confirmation/password dialogs as needed. Browser support is checked with SimpleWebAuthn; the browser credential API requires a secure context. Passkey login and second-factor flows are presented in the authentication UI.

There is no ordinary-user device-management tab in `/settings`. The **administrator** Devices panel at `/admin?tab=devices` lists sessions for all users, can sign out another device, and manages API keys; see [Admin dashboard](./admin-dashboard.md).

## Watch progress and history

The player overlay best-effort loads `/media/items/:id/progress` before playback and passes the saved position as the start time. While playing, progress is sent to `PUT /media/items/:id/progress` every 15 seconds and on pause, end, or player teardown. The home API supplies `continueWatching` cards from the user's saved progress. The Admin Overview also displays recent playback activity. There is **no separate watch-history route or history screen** in the current router.

## Theme and language

The account menu exposes theme and language pickers. Theme choices are dark, light, and auto (follow operating-system preference); the choice is stored locally. Language is available from the account menu and the Settings Language tab. Locale selection applies immediately, persists in local storage, and—when signed in and online—syncs the preference to the account. See [Theming](./theming.md) and [Internationalization](./internationalization.md).

## Responsive layout and offline state

Home, browsing, media details, settings, and admin layouts adapt for mobile, including the bottom tab bar. An offline banner is mounted globally in `App.vue`. The service worker caches the app shell and selected static assets; authenticated API requests remain network-only. Offline mode does not provide a general local copy of library data.
