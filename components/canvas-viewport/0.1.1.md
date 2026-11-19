# Canvas Viewport

An infinite canvas for design tools and editors. Scroll to pan, pinch or Cmd+scroll to zoom at the pointer, and drag with a hand tool, Space or the middle button.

## Release

Version: 0.1.1. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/canvas-viewport/0.1.1.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/canvas-viewport-gestures.ts

- @ui/canvas-viewport-math.ts

- @ui/canvas-viewport-parts.tsx

- @ui/canvas-viewport-root.tsx

- @ui/canvas-viewport-state.tsx

- @ui/canvas-viewport.tsx

- @ui/canvas-viewport.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as canvas-viewport.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { CanvasOverlay, CanvasSelection, CanvasViewport, CanvasWorld } from "@/components/ui/canvas-viewport";

const rect = { x: 32, y: 32, width: 144, height: 96 };

export default function CanvasViewportExample() {
  const [transform, setTransform] = useState({ panX: 0, panY: 0, zoom: 1 });
  return (
    <CanvasViewport className="h-64 rounded-xl border border-border" transform={transform} onTransformChange={setTransform} panning>
      <CanvasWorld>
        <div className="absolute bg-muted p-4" style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}>Welcome</div>
      </CanvasWorld>
      <CanvasOverlay><CanvasSelection rect={rect} title="Welcome screen" /></CanvasOverlay>
    </CanvasViewport>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| transform / defaultTransform / onTransformChange | { panX, panY, zoom } |  | Where the canvas sits. Pass transform to own it, or defaultTransform to let the canvas keep it. |
| panning | boolean | false | Drag anywhere to pan, for a hand tool. Space and the middle button pan at any time. |
| onPanningChange | (panning) => void |  | Reports whether the canvas owns the pointer: the hand tool, or a pan in progress. Holding Space alone does not count. |
| minZoom / maxZoom | number | 0.1 / 4 | How far the canvas can zoom. |
| disabled / messages | boolean / object |  | Turn off panning and zooming; replace the canvas's text. |
| CanvasWorld / CanvasOverlay | parts |  | Content in canvas units, and screen-space content above it. Controls in the overlay need pointer-events-auto. |
| CanvasSelection | part |  | An outline for a canvas rect, with an optional title, label and corner marks. Its line stays the same size at any zoom; set --canvas-selection-fill to change the marks' fill. |
| CanvasViewportEmpty | part |  | An icon with short text, centred in the canvas. |
| useCanvasViewport | hook |  | transform, setTransform, zoomTo, zoomBy and fit, for zoom controls inside the canvas. |
| fitRects / zoomAt / toScreenRect / toCanvasPoint | functions |  | The canvas maths, for positioning your own content. |
| data-canvas-no-pan | attribute |  | Add to anything that should keep its own pointer actions. Buttons, links and form fields already do. |

## Supported states

- empty

- disabled

## Integration

Place world elements in CanvasWorld using your own coordinates. Draw screen-space marks in CanvasOverlay and use CanvasSelection or the exported coordinate helpers to line them up with world objects.

Store pan and zoom in the host when they need to survive navigation. Set panning from your active tool to enable one-finger drag. Two-finger pinch works with either tool. Mark interactive descendants with data-canvas-no-pan when they must receive their own gestures.

## Customization

Use a fixed-height region for an embedded canvas, or give it flex-1 and min-h-0 inside a full-height editor. Override CanvasSelection className for a different selection color.

```tsx
<CanvasViewport className="h-72 rounded-xl bg-muted" panning={tool === "hand"} />
```

## Accessibility and integration checks

- The canvas is a focusable, named group. While it has focus, arrow keys pan, Shift makes the step larger, + and − zoom and 0 returns to 100%.

- Zoom changes from the keyboard and from zoom controls are announced.

- Controls on the canvas stay usable, and Space never takes over a text field.

- Nothing animates, so reduced motion needs no separate behaviour.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/canvas-viewport/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
