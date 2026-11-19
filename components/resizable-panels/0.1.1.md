# Resizable Panels

Resize sidebars and split views by pixel. Each panel keeps its own limits, handles work by pointer or keyboard, Escape cancels a drag, and collapsed panels keep their size.

## Release

Version: 0.1.1. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/resizable-panels/0.1.1.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/resizable-panels-handle.tsx

- @ui/resizable-panels-root.tsx

- @ui/resizable-panels-state.tsx

- @ui/resizable-panels.tsx

- @ui/resizable-panels.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as resizable-panels.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanels } from "@/components/ui/resizable-panels";

export default function ResizablePanelsExample() {
  const [width, setWidth] = useState(160);
  return (
    <ResizablePanels className="h-48 rounded-xl border border-border" minFillSize={160}>
      <ResizablePanel size={width} minSize={96} maxSize={240} onSizeChange={setWidth}>
        <div className="p-4">Layers</div>
        <ResizableHandle aria-label="Resize layers panel" />
      </ResizablePanel>
      <ResizablePanel><div className="bg-muted p-4">Canvas</div></ResizablePanel>
    </ResizablePanels>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| direction | "horizontal" \| "vertical" | "horizontal" | Places panels side by side or stacks them. |
| minFillSize | number | 0 | Pixels always left for the panel that fills. |
| disabled / motion | boolean |  | Turn off every handle; turn off the collapse transition. |
| ResizablePanel size / defaultSize | number |  | The panel's size in pixels, owned by your app or by the panel. Leave out both for a panel that fills the remaining space. |
| minSize / maxSize | number |  | The panel's limits. Available space can lower the maximum. |
| onSizeChange / onSizeCommit | (size) => void |  | Live sizes while resizing, and one final size per drag or key press for saving. |
| collapsed | boolean | false | Hides the panel and keeps its size for when it returns. |
| onResizingChange | (resizing) => void |  | Reports when a drag starts and ends. |
| ResizableHandle side | "start" \| "end" | "end" | The panel edge the handle sits on. Name it with aria-label. |
| ResizableHandle step / largeStep | number | 10 / 50 | Pixels moved by an arrow key, and with Shift held. |

## Supported states

- disabled

## Integration

Use one flexing ResizablePanel and give the fixed panels a size, minimum, and maximum. Put a ResizableHandle in each resizable panel and give it an accessible name.

Use onSizeChange to render the live result and onSizeCommit to persist the final size. Keep collapsed state in the app when a toolbar button should restore a panel.

## Customization

Set the group height for a dock and give panels distinct surfaces through className. Customize the handle color while keeping a usable pointer and keyboard target.

```tsx
<ResizableHandle aria-label="Resize inspector" className="bg-primary/25" />
```

## Accessibility and integration checks

- Each handle is a focusable separator that reports its panel, current size and limits.

- Arrow keys along the layout resize the panel, Shift takes larger steps, and Home and End go to its limits.

- Escape cancels a drag and restores the size it started from.

- A collapsed panel is inert, so Tab skips its content.

- The collapse transition is skipped with reduced motion or motion={false}.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/resizable-panels/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
