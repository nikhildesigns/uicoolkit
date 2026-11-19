# Motion Inspector

Edit how a selected item animates with an easing curve or a spring set by time or physics. Each edit commits once, and Replay lets your app play the result.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/motion-inspector/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/motion-inspector-editors.tsx

- @ui/motion-inspector-math.ts

- @ui/motion-inspector-parts.tsx

- @ui/motion-inspector-root.tsx

- @ui/motion-inspector-state.tsx

- @ui/motion-inspector.tsx

- @ui/motion-inspector.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: easing-curve-editor@0.1.0, inspector-field@0.2.0, number-field@0.2.0.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as motion-inspector.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { MotionInspector, type MotionValue } from "@/components/ui/motion-inspector";

export default function MotionInspectorExample() {
  const [value, setValue] = useState<MotionValue>({ type: "spring", definedBy: "time", duration: 0.5, bounce: 0.2 });
  return <MotionInspector className="max-w-sm rounded-xl border border-border p-4" label="Entrance transition" value={value} onValueCommit={setValue} />;
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| value | MotionValue \| null |  | The committed easing or spring, or null when nothing is selected. Your app owns it. Include delay to show the Delay field. |
| onValueCommit | (value, detail) => void |  | Called once per finished edit. detail names the field that changed. |
| onValueChange | (value, detail) => void |  | Live values while dragging, and the committed value when a drag is cancelled. |
| onReplay | () => void |  | Shows Replay. Your app plays the transition; the panel runs no animation. |
| label | string |  | The panel's visible and accessible name. |
| mixed | boolean | false | Selected items differ. Fields show Mixed, value is where editing starts, and the first edit commits a complete value for all of them. |
| ranges | Partial<MotionRanges> |  | Limits, steps and units for Duration, Delay, Bounce, Stiffness, Damping and Mass. |
| container | HTMLElement |  | Where the preset menu and tooltip are portalled. |
| disabled / readOnly / messages | boolean / boolean / object |  | Turn off or lock editing; replace the text. |
| MotionInspectorHeader / Mode / Easing / Spring / Delay / Empty / Replay | parts |  | Compose only what you need, or reorder the panel. |
| MotionInspectorSpringGraph | part |  | A read-only curve of a spring. |
| springAt / springSettleTime / motionDuration | functions |  | Read a spring's progress and length, for your own playback. |
| springToPhysics / springToTime | functions |  | Convert a spring between its two forms. |
| useMotionInspector | hook |  | The value and state, for custom parts. |

## Supported states

- empty

- mixed

- disabled

## Integration

Represent a transition as MotionValue and pass null when nothing is selected. Set mixed for multiple selected transitions with different values and use commit detail to apply only the edited property.

Wire onReplay to the host animation. Use onValueChange for a live preview and onValueCommit for a single saved edit. Respect reduced motion in the host preview.

## Customization

Dock the editor in an inspector or place it next to a preview. Use the className prop for width and surface, and messages to give host-specific names to motion modes.

```tsx
<MotionInspector label="Entrance" value={transition} onValueCommit={save} className="max-w-xs rounded-2xl bg-muted p-3" />
```

## Accessibility and integration checks

- The Animation and Type switches are radio groups operated with the arrow keys.

- Every value is a slider that also accepts typing, and each key press commits once.

- Escape cancels a drag and restores the committed value.

- The spring curve has a text name, and its values stay available in the fields beside it.

- Replay is a named button, and your app decides how to honor reduced motion when it plays.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/motion-inspector/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
