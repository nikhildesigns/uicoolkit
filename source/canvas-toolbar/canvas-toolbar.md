# Canvas Toolbar

A toolbar for any design tool. Pointer and Hand come ready to use, with room for your own tools and actions, shortcut tooltips, and horizontal or vertical layouts.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/canvas-toolbar/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/canvas-toolbar-items.tsx

- @ui/canvas-toolbar-root.tsx

- @ui/canvas-toolbar-state.tsx

- @ui/canvas-toolbar.tsx

- @ui/canvas-toolbar.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as canvas-toolbar.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { CanvasToolbar, CanvasToolbarHand, CanvasToolbarPointer, CanvasToolbarTools } from "@/components/ui/canvas-toolbar";

export default function CanvasToolbarExample() {
  const [tool, setTool] = useState<string | null>("pointer");
  return (
    <CanvasToolbar className="w-fit rounded-full border border-border p-2">
      <CanvasToolbarTools value={tool} onValueChange={setTool} shortcuts>
        <CanvasToolbarPointer />
        <CanvasToolbarHand />
      </CanvasToolbarTools>
    </CanvasToolbar>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| orientation | "horizontal" \| "vertical" | "horizontal" | A row for a dock, or a column for a rail. Arrow keys and tooltips follow it. |
| variant | "floating" \| "plain" | "floating" | A raised box in either orientation, or no box when the toolbar sits inside your own container. |
| disabled / motion / container / messages | boolean / HTMLElement / object |  | Turn off every item; turn off transitions; portal tooltips elsewhere; replace the text. |
| CanvasToolbarTools value / onValueChange | string \| null |  | The chosen tool, which your app owns. Pair "hand" with Canvas Viewport's panning. |
| CanvasToolbarTools deselectable | boolean | false | Choosing the current tool again turns it off and reports null. |
| CanvasToolbarTools shortcuts | boolean | false | Listens for each tool's single-key shortcut while nobody is typing. |
| CanvasToolbarPointer / CanvasToolbarHand | parts |  | The standard tools, with their names, icons and V and H shortcuts. Any prop can be replaced. |
| CanvasToolbarTool | part |  | Your own tool: value, label, icon and shortcut. showLabel puts the name beside the icon. |
| CanvasToolbarButton | part |  | An action, or a toggle with pressed. It works as a menu trigger. |
| disabled / reason | boolean / string |  | On a tool or button: it stays focusable, and the reason replaces its tooltip. |
| CanvasToolbarSeparator / CanvasToolbarTip | parts |  | A line between sets of items, and the tooltip for your own controls. |

## Supported states

- disabled

## Integration

Wrap mutually exclusive tools in CanvasToolbarTools. Use CanvasToolbarButton for actions that run once and CanvasToolbarSeparator to group them. Supply a custom icon and label to CanvasToolbarTool.

Keep the selected tool in the host and let canvas gestures read it. Enable shortcuts when the toolbar owns the relevant keys, and scope multiple toolbars so the same shortcut does not activate competing controls.

## Customization

Use a rounded border for an inset pill or make the root full width with justify-start for a docked toolbar. Pass className to individual tools when they need different widths.

```tsx
<CanvasToolbar className="w-full justify-start border-b border-border bg-background" />
```

## Accessibility and integration checks

- The toolbar is one tab stop. Arrow keys, Home and End move between items, following its orientation.

- Tools form a radio group, so the chosen tool is announced. Enter or Space chooses the focused tool.

- Icon-only items are named, and a disabled item's reason is read as its description.

- Single-key shortcuts are opt-in and never fire while typing or with Cmd, Ctrl or Alt held.

- The hover box does not slide with reduced motion.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/canvas-toolbar/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
