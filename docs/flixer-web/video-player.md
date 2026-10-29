---
sidebar_position: 5
title: Video player
description: Video delivery modes, quality changes, keyframe-aware seeking, watch progress, subtitles, and keyboard controls.
---

# Video player

The full-screen player is `src/components/player/VideoPlayer.vue`, mounted by `PlayerOverlay.vue` from a playable media detail. The overlay requests item playback info from the Flixer API, gets stream capabilities from flixer-streamer, then gives the stream URL and metadata to the player. The stream URL is an expiring credential-bearing URL; the browser uses it for streamer requests.

## Direct play, direct stream, transcode, and HLS

`StreamInfo.playMethod` describes the source path: `DirectPlay`, `DirectStream`, or `Transcode`. Height `0` represents original quality; the quality menu also offers the streamer's available output heights. Selecting a height above zero requests a transcoded stream. Changing quality restarts from the current timeline position and resumes only if playback was not paused.

For a progressive stream the player builds a `/streamer/stream/` URL, optionally with `height` and `start` query parameters. On browsers that can natively play HLS (WebKit detection; Chromium/Chrome/Edge are excluded), a non-DirectPlay stream uses `/streamer/hls/.../index.m3u8`; DirectPlay remains on its normal stream URL. DirectPlay and native HLS use the media element's native clock and seeking. The streamer handles remuxing/transcoding and stream delivery; the web app does not transcode media itself.

## Seeking and subtitle time alignment

Native streams seek by assigning the target to the video element's `currentTime`. For non-native progressive remux/transcode sources, the player treats the element's time as **local to the requested segment** and tracks a separate absolute `offset`. If the requested time is already inside the current buffered range, it seeks locally. Otherwise it creates a new stream from that point.

A stream-copy/direct-stream seek may need to start at the preceding keyframe. Before requesting an original-height remux at a non-zero position, the player calls the streamer's `/info` endpoint with that start value and uses `keyframeStart` when it is numeric and not later than the requested time. The actual snapped start becomes the player offset; playback's reported absolute position is `offset + local currentTime`. Subtitle cues use that same playhead for non-native segment streams, so their timing remains aligned when the stream restarts before the desired frame. There is no separate user-adjustable subtitle offset slider in this player.

## Progress reporting

The overlay best-effort fetches the stored item position before showing the player. During playback, the player emits progress every 15 seconds; it also emits on pause, end, and teardown when playback had started and is not waiting. The overlay saves those values with `PUT /media/items/:id/progress`. Position and duration are floored to whole seconds by the API helper. Failure to load saved progress starts from zero; save failures are intentionally ignored so playback is uninterrupted.

## Subtitles

Subtitle tracks are fetched from the streamer using the stream URL. A 404 track-list response is treated as no subtitles. The settings menu lets the user choose Off or a listed track. The player retrieves WebVTT text, parses cue time ranges, strips markup/ASS override fragments and supported entities to plain text, and draws active cue text as an overlay rather than using browser-native caption rendering. Multiple overlapping cues are displayed together.

The selection is remembered in local storage under `flixer.player.subtitles` as a language code or `off`. On a later stream, the player selects the first track whose language matches that stored preference. Admin subtitle download/removal from a media item's edit modal is a separate library-management feature.

## Controls and keyboard shortcuts

The on-screen controls include play/pause, seeking/scrubbing, volume/mute, fullscreen, quality and subtitle settings, buffering/error feedback, and retry. Controls hide after three seconds while playing; pointer/touch activity reveals them. Fullscreen attempts to lock landscape orientation where supported; iOS Safari falls back to video-element fullscreen.

Keyboard shortcuts are ignored while typing in an input/select/textarea, activating a button with Space/Enter, or holding Ctrl/Meta/Alt:

| Key | Action |
| --- | --- |
| `Space`, `k` | Play/pause. |
| `Left`, `j` | Seek backward 10 seconds. |
| `Right`, `l` | Seek forward 10 seconds. |
| `Up` / `Down` | Raise/lower volume by 5%. |
| `m` | Toggle mute. |
| `f` | Toggle fullscreen. |
| `Home` | Seek to the beginning. |
| `0`–`9` | Seek to the corresponding 0–90% position. |
| `Escape` | Close the player settings menu; otherwise browser fullscreen behavior is preserved, and the overlay closes only when not in fullscreen. |

When the component is removed, it drops the video `src` and reloads the element; this closes the streamer connection so an ffmpeg process can stop.
