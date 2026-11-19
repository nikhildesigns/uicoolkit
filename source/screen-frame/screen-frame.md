# Screen Frame

An app screen on a design canvas: its name above a preview, with a status icon. Click to select, double-click the name to rename it, and right-click for actions.

## Release

Version: 0.1.2. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/screen-frame/0.1.2.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/screen-frame-header.tsx

- @ui/screen-frame-preview.tsx

- @ui/screen-frame-root.tsx

- @ui/screen-frame-state.tsx

- @ui/screen-frame-status.tsx

- @ui/screen-frame.tsx

- @ui/screen-frame.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: context-menu@0.1.2, inline-edit@0.1.3.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as screen-frame.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { ScreenFrame, ScreenFrameHeader, ScreenFrameName, ScreenFramePreview, ScreenFrameStatus } from "@/components/ui/screen-frame";

export default function ScreenFrameExample() {
  const [name, setName] = useState("Home");
  const [selected, setSelected] = useState(false);
  return (
    <ScreenFrame name={name} selected={selected} onSelect={() => setSelected(true)} onRename={setName}>
      <ScreenFrameHeader><ScreenFrameName /><ScreenFrameStatus label="Ready" tone="success" /></ScreenFrameHeader>
      <ScreenFramePreview><div className="grid aspect-video place-items-center bg-muted">Home screen</div></ScreenFramePreview>
    </ScreenFrame>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| name | string |  | The screen's committed name. Your app owns it. |
| selected / onSelect | boolean / (details) => void |  | Your app owns selection. onSelect receives { additive, range } for Cmd/Ctrl and Shift, so you can toggle or extend it. |
| onRename / validate | (name) => void \| Promise / (name) => string \| null |  | Enables rename by double click, F2 or the menu (Inline Edit's ghost variant). Return a promise to show pending; return a message from validate to reject a name. |
| actions | ReactNode |  | Extra Context Menu items, shown after Rename. The menu opens on right click, long press, the menu key or Shift+F10; there is no visible menu button. |
| ScreenFrameStatus label / tone / persistent | string / "neutral" \| "info" \| "success" \| "warning" \| "danger" / boolean | — / "neutral" / false | A status icon at the right edge; its label shows in a tooltip and is read by screen readers. It appears on hover or focus unless persistent. Pass children to use your own icon. |
| ScreenFramePreview state / aspectRatio | "ready" \| "loading" \| "error" / number | "ready" / 9 / 19.5 | Shows your thumbnail, a busy placeholder or an unavailable message, at the screen's shape. |
| disabled / motion | boolean |  | Disabled cannot be selected, renamed or opened. Motion controls the selection, menu and rename transitions; reduced motion is always honored. |
| container | HTMLElement |  | Where the menu and status tooltips are portalled. Defaults to document.body. |
| messages | { nameLabel, select, rename, loading, error } |  | Replace the names and messages; select receives the screen's name. |
| className | string |  | Every part accepts className. The root exposes data-selected, data-renaming and data-disabled; the preview data-state; the status data-tone and data-persistent. |
| useScreenFrame() | hook |  | State and actions of the nearest ScreenFrame, for building your own parts. |

## Supported states

- selected

- loading

- error

- disabled

## Customization

Keep the frame name and canvas selection in the host. Route selection modifiers to the canvas selection model. Return a promise from `onRename` for asynchronous saving, and add Context Menu items for app actions. Supply a thumbnail, iframe or other preview content and choose its loading or error state through the preview part.

~~~tsx
<ScreenFrame name={name} onRename={rename} className="font-mono" motion={false}>
  <ScreenFrameHeader className="border-b"><ScreenFrameName /></ScreenFrameHeader>
  <ScreenFramePreview className="rounded-xl">{thumbnail}</ScreenFramePreview>
</ScreenFrame>
~~~

Keep the frame selectable by keyboard and retain F2 and the context menu for rename when changing the header.

## Accessibility and integration checks

- The frame is a group named by the screen. The preview is a toggle button (“Select Home”, aria-pressed) that selects on click, Enter or Space.

- A single click on the name selects; double click or F2 renames it in place, with no underline, Enter to save and Escape to cancel.

- Actions open with right click, long press, the menu key or Shift+F10 on the focused preview; on phones the menu is a bottom sheet.

- The status icon is named by its label for screen readers, so it is announced even while visually hidden; the tooltip repeats it for pointer users.

- A loading preview sets aria-busy and reads “Loading preview”; an unavailable one shows its message.

- Transitions are skipped with reduced motion or motion={false}.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/screen-frame/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
