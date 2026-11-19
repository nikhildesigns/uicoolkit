# Alignment Control

Align and distribute the selected layers from a compact button row, or place them in their frame with a 3×3 grid. One layer aligns to its frame, several to each other.

## Release

Version: 0.2.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/alignment-control/0.2.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/alignment-control-geometry.ts

- @ui/alignment-control-grid.tsx

- @ui/alignment-control-state.tsx

- @ui/alignment-control-toolbar.tsx

- @ui/alignment-control.tsx

- @ui/alignment-control.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as alignment-control.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { AlignmentGrid, type AlignmentPosition } from "@/components/ui/alignment-control";

export default function AlignmentControlExample() {
  const [position, setPosition] = useState<AlignmentPosition>({ x: "center", y: "center" });
  return (
    <div className="flex items-center gap-3">
      <AlignmentGrid value={position} onValueChange={setPosition} />
      <output>{position.x} / {position.y}</output>
    </div>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| selectionCount | number |  | How many layers are selected. Align needs one, distribute needs three; buttons that need more stay focusable and say why. |
| onAlign | (action, { target }) => void |  | Called with the action and what it aligns to: "parent" for one layer, "selection" for several. Your app moves the layers. |
| shortcuts | Partial<Record<action, string>> |  | Shortcut text for each action's tooltip, such as "Alt+A". Your app binds the keys. |
| disabled / motion / messages | boolean / object |  | Turn the control off, turn off tooltip transitions, or replace its text, for example to translate it. |
| AlignmentControlGroup / Button / Icon | parts |  | Boxed sets of buttons, one action each, and the action icons for your own menus. |
| AlignmentGrid value / onValueChange | { x, y } \| null |  | Where the layers sit in their frame, as start, center or end on each axis; null when they differ or sit between positions. |
| AlignmentGrid tooltips | boolean | true | Name each cell on hover, such as Top left, as the toolbar's buttons do. motion turns off the tooltip's transition. |
| alignRects / positionRect / positionOf | helpers |  | Optional geometry for your canvas: apply an action to rects, move a rect to a grid position, or read its position. |

## Supported states

- mixed

- disabled

## Customization

Use the button row to dispatch object alignment commands. The host applies them in its own coordinate space using the parent frame or selected bounds as indicated by the callback. Use the grid to capture a 3×3 placement value. Both can be styled independently, and geometry helpers are available for rectangular bounds.

~~~tsx
<AlignmentControl selectionCount={selected.length} onAlign={align} motion={false} className="gap-3 rounded-none">
  <AlignmentControlGroup>
    <AlignmentControlButton action="left" className="size-10 rounded-none" />
    <AlignmentControlButton action="right" className="size-10 rounded-none" />
  </AlignmentControlGroup>
</AlignmentControl>
~~~

Keep accessible names on icon-only actions. Verify the target with one and several selected objects, and verify that distribution is unavailable below three.

## Accessibility and integration checks

- The buttons form one toolbar: Tab reaches it once, and the arrow keys, Home and End move between buttons.

- Each button is named by its action, with its shortcut exposed, and its tooltip says when more layers are needed.

- The grid is a radio group of nine named positions; arrow keys move across and down and apply the position.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/alignment-control/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
