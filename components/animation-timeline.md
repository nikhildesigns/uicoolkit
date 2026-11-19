# Animation Timeline

Arrange when things animate with clips and keyframes on tracks. Drag, resize and snap them, scrub the ruler, and let your app run playback. Each edit commits once.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/animation-timeline/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/animation-timeline-drag.ts

- @ui/animation-timeline-items.tsx

- @ui/animation-timeline-math.ts

- @ui/animation-timeline-root.tsx

- @ui/animation-timeline-state.tsx

- @ui/animation-timeline-toolbar.tsx

- @ui/animation-timeline-tracks.tsx

- @ui/animation-timeline-view.ts

- @ui/animation-timeline.tsx

- @ui/animation-timeline.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: context-menu@0.1.2, inspector-field@0.2.0, playback-controls@0.1.0.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as animation-timeline.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { AnimationTimeline, type TimelineItem } from "@/components/ui/animation-timeline";

const tracks = [{ id: "title", label: "Title" }];

export default function AnimationTimelineExample() {
  const [items, setItems] = useState<TimelineItem[]>([{ id: "enter", kind: "clip", trackId: "title", label: "Enter", start: 0, duration: 1.5 }]);
  const [selection, setSelection] = useState<string[]>([]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  return (
    <AnimationTimeline className="rounded-xl border border-border p-3" label="Title animation"
      tracks={tracks} items={items} duration={4} selection={selection} onSelectionChange={setSelection}
      onItemsCommit={setItems} currentTime={time} onSeek={setTime} onSeekCommit={setTime}
      playing={playing} onPlayingChange={setPlaying} />
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| tracks | { id, label, hidden?, locked? }[] |  | Rows from top to bottom. Your app owns them. |
| items | TimelineItem[] |  | Clips with start and duration, and keyframes with time. Each names its trackId. |
| duration | number |  | The timeline's length in seconds. |
| selection / onSelectionChange | string[] / function |  | Selected item ids. Your app owns them. |
| onItemsCommit | (items, detail) => void |  | Called once per finished drag or key press. detail names the action and ids. |
| onItemsChange | (items, detail) => void |  | Live items while dragging, and the starting items when a drag is cancelled. |
| currentTime / onSeek / onSeekCommit | number / functions |  | The playhead in seconds, live moves and finished moves. |
| playing / onPlayingChange | boolean / function |  | Playback state. Your app runs playback. |
| loop / onLoopChange | boolean / function |  | Passing loop shows the Loop button. |
| onTrackHiddenChange / onTrackLockedChange | functions |  | Each shows that action for every track. |
| onDuplicate / onDelete | (ids) => void |  | Each adds its action to the item menu. Your app changes the items. |
| step / largeStep | number | 0.1 / 1 | Seconds moved by arrow keys, and with Shift. |
| minClipDuration | number | 0.1 | The shortest a clip can be, in seconds. |
| snap | boolean | true | Snap to the playhead, item edges and ruler ticks. Hold Alt while dragging to turn it off. |
| defaultZoom | "fit" \| number | "fit" | The starting zoom. Fit shows the whole timeline; a percent zooms in from it and scrolls sideways. |
| zoomLevels | number[] | [150, 200, 300, 400] | Zoomed-in choices after Fit, in percent of Fit. |
| pixelsPerSecond / maxZoom | number | 80 / 800 | The scale until the space is measured, and the limit for Ctrl or Cmd + scroll. |
| formatTime / container / disabled / messages | function / HTMLElement / boolean / object |  | Replace the time format, choose where menus portal, turn off editing, replace the text. |
| AnimationTimelineToolbar / Zoom / Body / Ruler / Item | parts |  | Compose your own toolbar or arrangement. |
| useAnimationTimeline | hook |  | Live items, time and scale, for custom parts. |

## Supported states

- empty

- locked

- disabled

## Integration

Give each track and timeline item an id. Each clip has a starting time and duration, while each keyframe has a time. Supply a duration in seconds and keep selection and items in the host.

Route onItemsChange to live preview and onItemsCommit to a single history entry. Update currentTime from your host clock or media player and wire onSeekCommit to its seek operation.

## Customization

Style the root for a docked timeline and compose AnimationTimelineToolbar, AnimationTimelineBody and the row parts for custom arrangements. Set zoomLevels to values that suit the host duration.

```tsx
<AnimationTimelineToolbar className="border-b border-border bg-muted p-2" />
```

## Accessibility and integration checks

- Each clip and keyframe is a labelled button that says its track and time, and Enter or Space selects it.

- Arrow keys move the selection through time and between tracks, and Shift moves further. Each press commits once.

- Alt with Left or Right changes a clip's end; adding Shift changes its start.

- Delete and Ctrl or Cmd + D run those actions, and the menu key opens the item menu.

- The ruler is a slider for the playhead. Escape cancels a drag.

- On touch, a short hold starts a drag, so scrolling never moves a clip.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/animation-timeline/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
