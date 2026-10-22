---
sidebar_position: 6
title: Music player
description: The persistent app-wide audio queue, mini-player, lyrics overlay, synced LRC parsing, and mobile controls.
---

# Music player

Music playback is owned by `src/composables/useAudioPlayer.ts`. It creates one HTML `Audio` element for the application, and keeps queue/playback state in module-level Vue refs. Since the mini-player is mounted in `src/App.vue` outside `RouterView`, audio can continue while navigating between pages.

## Starting music and queue behavior

From an album detail, `MediaItemView.vue` builds a queue from the album's child tracks. The track play buttons start at the selected track. On a track's own detail page, the view attempts to load the parent album and queues its tracks starting at that track; if that fails, it falls back to a one-track queue. `useAudioPlayer` requests `/playback/items/:id/playback-info` from the Flixer API and sets the returned `mediaSource.streamUrl` as the audio element source.

The player exposes previous/next, shuffle, repeat (`off`, `all`, `one`), seek, and volume. Shuffle rebuilds the play order while retaining the current track. Previous restarts the current track after it has played more than three seconds (or when already at queue position zero); otherwise it moves back. Repeat-one restarts on automatic end, and repeat-all wraps to the beginning. Volume is persisted in `flixer.volume`. Where supported, Media Session metadata and play/pause/previous/next actions are registered for OS/browser media controls.

## Mini-player

`src/components/player/MiniPlayer.vue` displays the current track's artwork, title, artist/album, transport controls, seek bar, shuffle/repeat, lyrics action, volume, and close/stop action. It is hidden when there is no current track and while the lyrics screen is open. Its visibility toggles `html.has-mini-player`; CSS reserves bottom space so it does not cover page content. On narrow screens the bar sits above the mobile tab bar, shows a compact set of controls and a thin progress indicator; wider screens expose the full seek controls and additional actions.

## Lyrics screen

Lyrics are requested from the streamer at the `/lyrics/` path derived from the current stream URL. A 404 means no lyrics are available. `src/composables/lrc.ts` parses LRC timestamps, multiple timestamps on one line, and the optional `[offset:]` tag; untimed text is shown as plain unsynced lyrics. `LyricsView.vue` is a fixed full-screen overlay, not a router page. Synced lines follow the audio playhead, and selecting a timestamped line seeks playback. Scrolling by hand pauses auto-follow for four seconds. Escape or the close button dismisses the lyrics without stopping music.

The full view keeps a dark visual treatment and blurred artwork behind the lyrics. It rearranges the artwork/track information, lyrics scroller, seek bar, and transport controls for mobile versus desktop, including safe-area padding. If the queue is stopped or cleared, the lyrics overlay also closes.
