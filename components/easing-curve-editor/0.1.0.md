# Easing Curve Editor

Shape a transition's timing by dragging two handles on a cubic Bézier curve, or start from a preset and type exact values. Each change commits once.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/easing-curve-editor/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/easing-curve-editor-controls.tsx

- @ui/easing-curve-editor-drag.ts

- @ui/easing-curve-editor-math.ts

- @ui/easing-curve-editor-parts.tsx

- @ui/easing-curve-editor-root.tsx

- @ui/easing-curve-editor-state.tsx

- @ui/easing-curve-editor.tsx

- @ui/easing-curve-editor.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: inspector-field@0.2.0, number-field@0.2.0.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as easing-curve-editor.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { EasingCurveEditor, formatCubicBezier, type EasingCurveValue } from "@/components/ui/easing-curve-editor";

export default function EasingCurveEditorExample() {
  const [curve, setCurve] = useState<EasingCurveValue>([0.25, 0.1, 0.25, 1]);
  return (
    <div className="grid max-w-sm gap-2 rounded-xl border border-border p-4">
      <EasingCurveEditor label="Entrance easing" value={curve} onValueChange={setCurve} onValueCommit={setCurve} />
      <output className="text-xs">{formatCubicBezier(curve)}</output>
    </div>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| value | [x1, y1, x2, y2] |  | The committed curve. Your app owns it. |
| onValueCommit | (value, detail) => void |  | Called once per finished drag, key press, field edit or preset. detail names the handle and source. |
| onValueChange | (value, detail) => void |  | Live curves, and the starting curve when a drag is cancelled. |
| label | string |  | The name shown above the curve and read by screen readers. |
| range | [min, max] | [-0.25, 1.25] | The progress handles can reach. X always stays from 0 to 1. |
| step | number | 0.01 | How far handles move. Shift moves ten steps. |
| presets | { value, label, curve }[] |  | Replaces the preset list. Linear, Ease, Ease in, Ease out and Ease in-out by default. |
| duration / onDurationChange / onDurationCommit | number / functions |  | Passing duration shows the Duration slider. Your app owns the value. |
| durationRange | { min, max, step, unit } | 0 to 2, 0.01, s | The Duration slider's limits, step and unit. |
| container | HTMLElement |  | Where the preset menu is portalled. |
| mixed | boolean | false | The selection holds different curves. Fields show Mixed, value is where editing starts, and the first edit commits. |
| disabled / readOnly / motion / messages | boolean / boolean / boolean / object |  | Turn off or lock editing; turn off the handles' press transition; replace the text. |
| EasingCurveLabel / EasingCurvePresets / EasingCurveSurface / EasingCurveFields | parts |  | Compose only what you need, such as the surface without fields. |
| EasingCurveGrid / EasingCurveLine / EasingCurveHandlePoint | parts |  | The grid, curve and a handle, placed inside the surface. |
| EasingCurveEaseField / EasingCurveDurationField | parts |  | All four numbers in one field, which also accepts cubic-bezier() and CSS keywords, and the Duration slider. |
| EasingCurveGraph | part |  | A read-only graph of any easing function, such as a spring your app calculates. |
| formatCubicBezier / parseCubicBezier / cubicBezierAt | functions |  | Convert to and from CSS, and read the progress at a moment. |
| useEasingCurveEditor | hook |  | The live curve and state, for custom parts. |

## Supported states

- disabled

## Integration

Store the cubic Bézier as a tuple and use formatCubicBezier for CSS. Compose the surface, presets and numeric fields where they fit the host. EasingCurveGraph also supports read-only rendering.

Use onValueChange for a live preview and onValueCommit for undo or persistence. Run any animation separately in the host and honor its reduced-motion settings.

## Customization

Style the graph independently of the fields with their className props. Supply your own preset list to match the motion tokens used in your application.

```tsx
<EasingCurveSurface className="h-32 rounded-2xl bg-muted" />
```

## Accessibility and integration checks

- Each handle is a slider with its own tab stop. Arrow keys move it by 0.01, Shift by 0.1, and each press commits once.

- A handle's time and progress are read together.

- Escape cancels a drag and restores the starting curve.

- The Ease field gives an exact alternative to dragging, and the handles' press transition turns off with reduced motion.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/easing-curve-editor/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
