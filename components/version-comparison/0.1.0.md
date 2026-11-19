# Version Comparison

Name design versions and compare any two side by side, with a swipe divider or as an overlay. Your app draws each version and applies the one you choose.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/version-comparison/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/version-comparison-divider.tsx

- @ui/version-comparison-label.tsx

- @ui/version-comparison-root.tsx

- @ui/version-comparison-stage.tsx

- @ui/version-comparison-state.tsx

- @ui/version-comparison-toolbar.tsx

- @ui/version-comparison.tsx

- @ui/version-comparison.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: context-menu@0.1.2, inline-edit@0.1.3, inspector-field@0.2.0, number-field@0.2.0.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as version-comparison.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { VersionComparison, type ComparisonPair } from "@/components/ui/version-comparison";

const versions = [{ id: "a", name: "Original" }, { id: "b", name: "Review" }];

export default function VersionComparisonExample() {
  const [pair, setPair] = useState<ComparisonPair>({ a: "a", b: "b" });
  return (
    <VersionComparison className="rounded-xl border border-border p-3" label="Homepage revisions"
      versions={versions} compare={pair} onCompareChange={setPair}
      renderVersion={(version) => <div className="grid h-full place-items-center bg-muted">{version.name}</div>} />
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| versions | { id, name, current?, status? }[] |  | The alternatives. status is ready, loading or error. |
| compare / onCompareChange | { a, b } / function |  | The two version ids being compared. Your app owns them. |
| renderVersion | (version, { slot, size }) => ReactNode |  | Draws a version for the stage, or as a small thumbnail in the A and B menus. |
| changes | { label, before, after }[] |  | What differs between A and B. Passing it shows the list. |
| onUse | (id) => void |  | Shows Use on each version that can be chosen. Your app applies it. |
| onRename / onDuplicate / onDelete | functions |  | Each adds that action. The current version cannot be deleted. |
| onRetry | (id) => void |  | Offers Retry on a version that failed to load. |
| defaultMode | "side" \| "swipe" \| "overlay" |  | The starting mode. Phones start on Swipe, other screens on Side by side. |
| onDividerChange / onDividerCommit | (position) => void |  | Live and finished divider positions from 0 to 1. |
| onOpacityChange / onOpacityCommit | (opacity) => void |  | Live and finished overlay opacity from 0 to 1. |
| aspectRatio | string | "16 / 10" | The shape of the stage and thumbnails. |
| container / disabled / messages | HTMLElement / boolean / object |  | Choose where menus portal, turn off actions, replace the text. |
| VersionComparisonToolbar / Stage / Opacity / Changes / Label | parts |  | Compose or reorder the panel. |
| useVersionComparison | hook |  | The compared versions and view state, for custom parts. |

## Supported states

- empty

- loading

- error

- disabled

## Integration

Keep the versions and A/B pair in the host. renderVersion receives a stage or thumbnail size so heavy previews can use small static thumbnails in selectors.

Apply, rename, duplicate, or delete versions through app-owned callbacks. Pass changes when you already know what differs, and handle retry when a version fails to load.

## Customization

Use aspectRatio to match your material and defaultMode to suit your typical comparison. Style the root and replace the rendered content with any app-specific image or screen.

```tsx
<VersionComparison aspectRatio="4 / 3" defaultMode="overlay" className="rounded-2xl bg-muted p-4" />
```

## Accessibility and integration checks

- The A and B selects and the mode switch work from the keyboard, and each mode has a name.

- The swipe divider is a slider: arrow keys move it, Shift moves further, and Escape cancels a drag.

- The A and B menus list every version by name, with Current marked.

- Every menu action opens from a visible button, the menu key or Shift + F10.

- Loading versions announce their state, and failed versions say so in text.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/version-comparison/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
