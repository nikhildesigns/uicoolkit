# Split Number Field

Edit a value that splits into parts, such as padding into its sides or radius into its corners. Merged parts list values that differ; each part types, steps and drags like a Number Field.

## Release

Version: 0.2.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/split-number-field/0.2.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/split-number-field-presets.tsx

- @ui/split-number-field-root.tsx

- @ui/split-number-field-state.tsx

- @ui/split-number-field.tsx

- @ui/split-number-field.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: number-field@0.2.0.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as split-number-field.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { sidesPreset, SplitNumberField, SplitNumberFieldParts, SplitNumberFieldToggle, type SplitNumberValue } from "@/components/ui/split-number-field";

export default function SplitNumberFieldExample() {
  const [padding, setPadding] = useState<SplitNumberValue>({ left: 12, right: 12, top: 8, bottom: 8 });
  return (
    <SplitNumberField label="Padding" preset={sidesPreset} value={padding} onValueCommit={setPadding} unit="px" min={0}>
      <SplitNumberFieldParts />
      <SplitNumberFieldToggle />
    </SplitNumberField>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| preset | { levels, toggleLabel, toggleIcon } |  | How the value splits. sidesPreset goes horizontal/vertical → four sides (padding, margin); allSidesPreset goes one value → four sides (border width); cornersPreset goes one value → four corners. Define your own levels, labels and icons. |
| value | Record<part, number \| null> |  | Every finest part, such as left, top, right and bottom, even while merged. null is Mixed, for a selection with different values. |
| onValueCommit | (value, { changed }) => void |  | Called once per finished edit with every part and the ones it changed, so a selection can apply only those. |
| Typed lists | "8, 20" |  | A merged part whose sides differ starts editing from its list. Type as many values as it shows to replace each one, as many as it covers to set them in order, or one value for all. |
| onValueChange | (value, { changed }) => void |  | Live values while dragging a part, for previewing on your canvas. |
| level / defaultLevel / onLevelChange | number |  | Which level shows. By default it starts at the first level that hides no difference. |
| align | "start" \| "end" | "start" | Where values sit in each part: after the icon, or at the end beside the unit, as Inspector Field's align. |
| unit / min / max / step / validate / … | Number Field props |  | Passed to every part, so margin can allow negatives and limits reject typed values with a message. |
| SplitNumberFieldParts / Toggle | parts |  | The current level's Number Fields in a two-column grid, and the button that splits or merges them. |
| messages | { mixed, values, part, listCount, listRange } |  | Replace the Mixed text, how differing values are listed, how each part is named and the typed-list messages, for example to translate them. |

## Supported states

- mixed

- disabled

- read-only

## Customization

Use a supplied sides or corners preset, or define the grouped and expanded parts for your own value. Pass a value keyed by the preset's parts. Apply only the keys listed in the commit's `changed` array to multi-selection edits. A differing set of values on one item is distinct from mixed values across items.

~~~tsx
<SplitNumberField label="Radius" preset={cornersPreset} value={radius} onValueCommit={commit} min={0} unit="px" motion={false} className="font-mono">
  <SplitNumberFieldParts />
  <SplitNumberFieldToggle />
</SplitNumberField>
~~~

Check that expansion keeps the intended part names and that editing one part preserves the others.

## Accessibility and integration checks

- The field is a group named by its label; each part is a spin button named with it, such as Padding top.

- Every part can be typed, stepped with the arrow keys (Shift for 10) or dragged; dragging is never the only way.

- A merged part reads its differing values, and they can be edited as a typed list; a list that cannot apply is rejected with a message.

- The toggle is a pressed button named for its preset, such as Individual sides.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/split-number-field/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
