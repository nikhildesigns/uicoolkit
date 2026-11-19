# XY Pad

Set two related numbers with one drag, such as a shadow offset or focal point. Each axis has its own range, and a Number Field for exact values.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/xy-pad/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/xy-pad-drag.ts

- @ui/xy-pad-fields.tsx

- @ui/xy-pad-math.ts

- @ui/xy-pad-parts.tsx

- @ui/xy-pad-root.tsx

- @ui/xy-pad-state.tsx

- @ui/xy-pad.tsx

- @ui/xy-pad.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: number-field@0.2.0.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as xy-pad.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { XYPad, type XYPadValue } from "@/components/ui/xy-pad";

export default function XYPadExample() {
  const [value, setValue] = useState<XYPadValue>({ x: 0, y: 0 });
  return (
    <XYPad className="max-w-64 rounded-xl border border-border p-4" label="Shadow offset" value={value}
      xAxis={{ label: "Offset X", min: -24, max: 24, unit: "px" }}
      yAxis={{ label: "Offset Y", min: -24, max: 24, unit: "px" }}
      onValueChange={setValue} onValueCommit={setValue} />
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| value | { x, y } |  | The committed value. An axis can be null for a mixed selection. |
| onValueCommit | (value, detail) => void |  | Called once per finished drag, key press or field edit. detail names the changed axes and the source. |
| onValueChange | (value, detail) => void |  | Live values, and the starting value when a drag is cancelled. |
| xAxis / yAxis | object |  | Each sets label, shortLabel, min, max, step, largeStep, precision and unit. |
| yDirection | "down" \| "up" | "down" | Which way larger Y values run. Use up for charts and spring settings. |
| label | string |  | The pad's name, shown above the surface and read by screen readers. |
| disabled / readOnly / motion / messages | boolean / boolean / boolean / object |  | Turn off or lock editing; turn off the point's press transition; replace the text. |
| XYPadLabel | part |  | The pad's visible name. Place it above the surface. |
| XYPadSurface | part |  | The square area you press and drag. It fills the pad, which is 160 px wide unless you set its width. Defaults to the grid, origin dot and point. |
| XYPadGrid / XYPadOrigin / XYPadThumb | parts |  | Equal grid cells (set cells to change how many, 6 by default), a dot at zero or the middle, and the point. Place them inside the surface. |
| XYPadFields / XYPadField | parts |  | Number Fields for both axes, or one with axis set to x or y. |
| useXYPad | hook |  | The live value, axes and state, for custom parts. |

## Supported states

- mixed

- disabled

## Integration

Supply xAxis and yAxis labels, bounds, steps and units. Use XYPadSurface and XYPadFields separately when the point and the numeric inputs belong in different spaces.

Connect onValueChange to a live preview and onValueCommit to saved state. Supply a controlled value to synchronize another editor with the same two numbers.

## Customization

Use a narrow root for an inspector row or give the surface a different aspect ratio with className. Change the theme primary token to restyle the point.

```tsx
<XYPadSurface className="aspect-video rounded-2xl bg-muted" />
```

## Accessibility and integration checks

- The point is one slider tab stop. Arrow keys change X and Y, Shift takes a larger step, and Home and End go to the X limits.

- Both values are read with the point, and each key press commits once.

- Escape cancels a drag and restores the starting value.

- The pad's border shows keyboard focus, and Number Fields give an exact alternative to dragging.

- The point's short press transition turns off with reduced motion.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/xy-pad/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
