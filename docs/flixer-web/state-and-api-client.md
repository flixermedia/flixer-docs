---
sidebar_position: 9
title: State and API client
description: Axios configuration, bearer-token storage, account/session state, UI composables, and error behavior.
---

# State and API client

## Axios client and endpoint domains

`src/api.ts` exports one Axios instance, `api`, with `baseURL: import.meta.env.VITE_API_BASE_URL || '/api'`, JSON content type, and a 15-second default timeout. Its request interceptor adds the stored bearer access token to API requests. The module also exports typed endpoint helpers so views/components do not assemble most JSON API calls themselves.

Common API groups include:

- **Authentication and account:** `/auth/login`, `/auth/register`, `/auth/sessions`, `/auth/me`, `/auth/passkeys/...`, `/preferences`, and `/settings/...`.
- **Library browsing and playback progress:** `/media/home`, `/media/browse/:kind`, `/media/search`, `/media/items/:id`, image and `/progress` paths.
- **Playback session creation:** `/playback/items/:id/playback-info` (and sample-player endpoints).
- **Administration:** `/admin/overview`, `/admin/streams`, `/admin/media-libraries`, `/admin/network-shares`, `/admin/media/items`, `/admin/indexer/...`, `/admin/users`, `/admin/devices`, and `/admin/api-keys`.

The streamer is not called through the API Axios instance: `getStreamInfo`, subtitle/lyrics fetchers, and the video/audio element use streamer URLs returned in playback information. The Vite development proxy makes streamer prefixes same-origin; production needs equivalent deployment routing. See [Configuration](./configuration.md).

## Access-token lifecycle and auth failures

The access-token key is `flixer.accessToken`. `getAccessToken()` reads `localStorage` first and migrates a legacy value from `sessionStorage`; `saveAccessToken()` writes local storage; `clearAccessToken()` removes it from both. This keeps the token across PWA closure (the source comment explains that session storage did not survive force-close reliably).

The router validates stored sessions against `GET /auth/sessions` when online and requires a session marked `current`. It trusts an existing token for offline rendering. The Axios response interceptor clears the token on most 401 responses and dispatches `flixer:auth-invalid`; expected credential/verification operations are exempted from the global invalidation behavior so their own forms can handle the response. The sessions endpoint is special-cased from event dispatch because the route guard handles its result. `src/main.ts` listens for the invalid event and replaces the current route with `/login` unless already there.

`logout()` calls `/auth/logout` then clears local tokens. `useSignOut()` clears shared profile state and navigates to login on success. Login/register store the returned token through the authentication components; passkey sign-in uses SimpleWebAuthn browser functions and the same auth result.

## Shared state composables

There is no Pinia store in the checked-in package. Shared state currently uses module-level Vue refs inside composables:

- `useProfile()` shares one `UserProfile` ref so header and settings stay synchronized, coalesces concurrent profile loads into one promise, and exposes set/clear helpers.
- `useTheme()` shares the theme preference and applies it to the document root; `initTheme()` is called before app mount.
- `useAudioPlayer()` exposes a single app-wide audio element, queue, playback state, volume, repeat/shuffle, and lyrics state.
- `useLiveTopic()` manages shared realtime admin topics; `useLiveLogs()` manages the separate log stream.
- `useOnlineStatus.ts` and the global `OfflineBanner.vue` present connectivity status.
- `notify` wraps Vue3Toastify success/error/info toasts. `confirmAction` opens the shared `ConfirmModal.vue` through `@kolirt/vue-modal` and resolves true only after confirmation.

`@kolirt/vue-modal` is installed once in `src/main.ts`, with a default modal group and the root modal overlay/target rendered by `App.vue`. Feature dialogs (profile deletion, passkeys, admin editors) use `openModal` and typed results rather than browser `alert`/`confirm` dialogs.

## Errors

`describeRequestError()` in `useProfile.ts` returns an API response's `message` when available, a translated network error when Axios has no response, or a caller-provided translated fallback. For non-Axios `Error`s it uses the error message, otherwise the fallback. Components generally catch errors locally and show toasts or inline error messages; abortable search/browse requests ignore Axios cancellation errors.

The API client timeout is 15 seconds by default; some streamer info/subtitle/lyrics requests use 20 seconds, and subtitle provider search/download use 70 seconds. `src/monitoring.ts` fetches `/sentry/config/web` without blocking app startup, retries for up to 60 seconds with 5-second request timeouts, and initializes Sentry only when the API returns `enabled` and a DSN. It also forwards console errors to Sentry once enabled.
