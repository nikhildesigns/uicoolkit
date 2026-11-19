# Playback Controls

Music-player style controls for animation, video or audio your app runs: play, rewind, seek, loop, speed and volume. Compose only the parts you need.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/playback-controls/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/playback-controls-buttons.tsx

- @ui/playback-controls-root.tsx

- @ui/playback-controls-scrub.ts

- @ui/playback-controls-seek.tsx

- @ui/playback-controls-settings.tsx

- @ui/playback-controls-state.tsx

- @ui/playback-controls-time.ts

- @ui/playback-controls-volume.tsx

- @ui/playback-controls.tsx

- @ui/playback-controls.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: inspector-field@0.2.0.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as playback-controls.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { PlaybackControls } from "@/components/ui/playback-controls";

export default function PlaybackControlsExample() {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  return (
    <PlaybackControls className="rounded-xl border border-border p-3" label="Preview playback"
      playing={playing} onPlayingChange={setPlaying} duration={10} currentTime={time}
      onSeek={setTime} onSeekCommit={setTime} />
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| label | string |  | Names the controls for screen readers. |
| playing / onPlayingChange | boolean / function |  | Whether playback runs. Your app owns it and starts or stops playback. |
| currentTime | number |  | The position in seconds. Your app owns it. |
| duration | number \| null |  | The length in seconds. Seeking is off while it is null. |
| onSeekCommit | (time, detail) => void |  | Called once per finished drag, key press or button. detail names the source. |
| onSeek | (time, detail) => void |  | Live positions, and the starting position when a drag is cancelled. |
| onScrubbingChange | (scrubbing) => void |  | Called when a drag starts and ends, so your app can hold playback. |
| step / largeStep | number | 0.1 / 1 | Seconds moved by arrow keys and small step buttons, and by Rewind, Fast forward, Shift or Page keys. |
| volume / onVolumeChange / onVolumeCommit | number / functions |  | A level from 0 to 1. Passing volume shows a button that opens a vertical slider. Your app owns it. |
| muted / onMutedChange | boolean / function |  | For an app with its own mute: shows the level as 0, and raising it asks your app to unmute. |
| loop / onLoopChange | boolean / function |  | Passing loop shows the Loop button. With it on, Play never becomes Replay. |
| speed / onSpeedChange / speeds | number / function / number[] | 0.25, 0.5, 1, 2 | Passing speed shows the Speed menu. |
| formatTime | (seconds) => string |  | Replaces the 0:01.20 time format. |
| loading / disabled | boolean |  | Wait for media with a spinner, or turn the controls off. |
| container / messages | HTMLElement / object |  | Where tooltips and the menu are portalled, and replacement text. |
| PlaybackPlayButton / PlaybackRestartButton / PlaybackStepButton / PlaybackLoopButton | parts |  | The buttons. PlaybackStepButton takes direction, and size: large for Rewind and Fast forward, small for fine steps. |
| PlaybackSeek / PlaybackTime / PlaybackSpeed / PlaybackVolume / PlaybackControlsRow | parts |  | The seek bar, time readout (show: both, current or duration), speed menu, volume popup and a row to lay parts out. |
| PlaybackTransport | part |  | The full button row. On phones and in narrow spaces: Restart, Rewind, Play, Fast forward and Settings, with Volume, Loop and Speed inside Settings. |
| PlaybackOptions / PlaybackSettings | parts |  | Options that fold into Settings when narrow, and the Settings menu itself. It opens as a bottom sheet on phones. |
| formatPlaybackTime / usePlaybackControls | function / hook |  | The default time format, and the state and actions for custom parts. |

## Supported states

- loading

- disabled

## Integration

Wire playing, currentTime and duration to media or a timeline owned by the host. Compose PlaybackControlsRow and the individual buttons when the full player layout is unnecessary.

Use onSeek for scrubbing and onSeekCommit to finalize playback position. Pass loop, speed and volume state only when the host supports them. The host advances time and applies playback settings.

## Customization

Use root className to dock the controls. Put secondary actions in PlaybackOptions so narrow layouts retain touch-sized transport controls.

```tsx
<PlaybackControlsRow className="w-full justify-center rounded-full border border-border p-2" />
```

## Accessibility and integration checks

- The controls form one labelled group, and every icon button has a name.

- Play's name changes to Pause, Replay or Loading with its state. Loop reports whether it is on.

- The seek bar is a slider that reads the position and length. Arrow keys step, Shift and Page keys take larger steps, and Home and End jump to the ends.

- The volume slider reads its level as a percentage and uses the same keys.

- Escape cancels a drag and returns to the starting position or level.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/playback-controls/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
