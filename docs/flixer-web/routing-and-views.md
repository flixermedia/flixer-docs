---
sidebar_position: 3
title: Routing and views
description: Every Vue Router path, its view or redirect, and the authentication and administrator guards.
---

# Routing and views

Routes are declared in `src/router/index.ts`. View components are lazy-imported except for redirect-only paths. The router uses HTML5 history based on Vite's `BASE_URL`; Nginx must therefore fall back to `index.html` for route paths.

| Path | Route name | View / behavior | Access |
| --- | --- | --- | --- |
| `/login` | `login` | `src/views/LoginView.vue`; login form and passkey/second-factor flow. | Public when signed out; a valid signed-in session redirects to `/`. |
| `/register` | `register` | `src/views/LoginView.vue`; the view selects registration based on the route. | Public when signed out; a valid signed-in session redirects to `/`. |
| `/verify-email` | `verify-email` | `src/views/VerifyEmailView.vue`; email-verification flow. | No `requiresAuth` meta; publicly reachable. |
| `/` | `home` | `src/views/HomeView.vue`; featured, library, recent, and continue-watching content. | Requires a saved token and (when online) a valid current API session. |
| `/media/:id` | `media-item` | `src/views/MediaItemView.vue`; movie, series, episode, album, track, or other item detail. | Requires auth. |
| `/settings` | `settings` | `src/views/SettingsView.vue`; profile, passkey, and language tabs. | Requires auth. |
| `/admin` | `admin` | `src/views/AdminView.vue`; admin dashboard panels selected by `?tab=`. | Requires auth and `profile.role === 'admin'`. |
| `/movies` | `movies` | `src/views/BrowseView.vue` with `kind="movies"`. | Requires auth. |
| `/tv` | `tv` | `src/views/BrowseView.vue` with `kind="tv"`. | Requires auth. |
| `/music` | `music` | `src/views/BrowseView.vue` with `kind="music"`. | Requires auth. |
| `/search` | `search` | `src/views/SearchView.vue`. | Requires auth. |
| `/player-test` | `player-test` | `src/views/PlayerTestView.vue`; player test/sample page. | Requires auth. |
| `/passkeys` | — | Redirects to `/settings?tab=passkeys`. | The redirect target is protected by the settings route guard. |
| `/:pathMatch(.*)*` | — | Redirects unknown paths to `/`. | The home route then applies its auth guard. |

## Navigation guard

The guard reads `flixer.accessToken` through `getAccessToken()`. A protected destination without a token redirects to `/login?redirect=<requested-full-path>`. When a token exists and the browser is online, the guard calls `/auth/sessions` and considers it valid only if one returned session has `current: true`. A failed/invalid session clears the token; invalid sessions return the user to login. For `/admin`, it then loads the shared profile and redirects non-admin users to `/`.

When offline, a stored token is trusted so that the cached app can render without waiting for the API. This is a rendering fallback, not an authorization guarantee for server requests. If session validation fails for a reason other than a confirmed 401, the guard redirects to login with `sessionCheck=unavailable`; the login route explicitly allows that state. A valid token visiting `/login` or `/register` returns to home. See [State and API client](./state-and-api-client.md) for token and 401 behavior.

`/verify-email` is not marked protected in router metadata. A special `sessionCheck=unavailable` query on the login/register routes also bypasses the normal authentication-route handling so users can reach the sign-in UI when the backend cannot be checked.

## Query tabs and scrolling

`/settings?tab=profile|passkeys|language` selects a settings panel; `/admin?tab=...` selects one of the admin dashboard tabs. Both views replace the query when switching tabs and default unknown tab values to their overview/default tab. The router preserves scroll position for same-path query changes, restores saved history position where available, scrolls to hash anchors, and otherwise smoothly scrolls to the top. Route titles are localized in the `afterEach` hook.

The music lyrics experience is an overlay rendered by `src/App.vue`, not a router route. The video player is also rendered as a modal-like full-screen overlay from the media detail page.
