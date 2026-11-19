# Resize Handles

Handles for resizing a selected object on a canvas. Shift keeps proportions, Alt resizes from the centre, and each resize commits once, so it is one undo step.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/resize-handles/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/resize-handles-math.ts

- @ui/resize-handles-parts.tsx

- @ui/resize-handles-root.tsx

- @ui/resize-handles-state.tsx

- @ui/resize-handles.tsx

- @ui/resize-handles.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as resize-handles.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { ResizeHandles, ResizeHandlesLabel } from "@/components/ui/resize-handles";

export default function ResizeHandlesExample() {
  const [rect, setRect] = useState({ x: 24, y: 24, width: 128, height: 80 });
  return (
    <div className="relative h-56 rounded-xl bg-muted">
      <div className="absolute grid place-items-center bg-background" style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}>Card</div>
      <ResizeHandles rect={rect} minWidth={64} minHeight={36} onRectChange={setRect} onRectCommit={setRect}>
        <ResizeHandlesLabel />
      </ResizeHandles>
    </div>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| rect | { x, y, width, height } |  | The object's position and size. Your app owns it. |
| onRectChange | (rect, detail) => void |  | Live rects while resizing, and the starting rect when a drag is cancelled. |
| onRectCommit | (rect, detail) => void |  | Called once per finished drag or key press, for saving and undo. |
| onResizingChange | (resizing) => void |  | Reports when a drag starts and ends. |
| transform | { panX, panY, zoom } |  | Maps the rect to the screen, so handles keep their size at any zoom. Pass Canvas Viewport's transform. |
| handles | "all" \| "corners" \| "edges" \| string[] | "all" | Which handles to show, such as ["n", "s"] for an object with a fixed width. |
| minWidth / minHeight / maxWidth / maxHeight | number | 1 / 1 / none / none | Size limits. Dragging past the opposite edge stops at the minimum and never flips. |
| aspectRatio | number |  | Locks width divided by height. Without it, Shift keeps the starting proportions. |
| step | number | 1 | Places dragged edges on multiples of this value. Arrow keys move by it, and by ten times it with Shift. |
| snap | (edges, handle) => edges |  | Moves dragged edges, for example to your alignment guides. Limits still apply afterwards. |
| disabled / messages | boolean / object |  | Keep the outline without resizing; replace the text. |
| renderHandle / handleClassName | function / string |  | Replace a handle's mark or style its pointer target. Handles carry data-handle with their name; set --resize-handle-fill to change the marks' idle fill. |
| ResizeHandlesLabel | part |  | The live size below the outline. Pass children to replace the text. |
| resizeRect | function |  | The resize calculation, for your own gestures. |
| useResizeHandles | hook |  | The current rect, resizing state and messages, for custom parts. |

## Supported states

- disabled

## Integration

Place the handles in a positioned overlay. Pass a world-space rect and the canvas transform for a zoomable surface, or use local coordinates in a static surface.

Use onRectChange for previews and onRectCommit for the saved change or undo entry. Set min sizes before connecting selection. Use snap for guides and handles to limit allowed edges.

## Customization

Set the selection color with the primary theme token at the root. Replace ResizeHandlesLabel content with a host-specific measurement while keeping the handle labels useful.

```tsx
<ResizeHandles className="[--primary:var(--ring)]" rect={rect} handles="corners" onRectCommit={saveRect} />
```

## Accessibility and integration checks

- The selection is one named tab stop. Arrow keys change width and height from the top-left, Shift takes larger steps, and each press commits once.

- The new size is announced after every keyboard or pointer resize.

- Escape cancels a drag and restores the starting size.

- Touch targets are larger than the visible handles, and nothing animates, so reduced motion needs no separate behaviour.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/resize-handles/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
