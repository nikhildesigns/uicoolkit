# Color Picker

Edit a colour from a compact row: its swatch opens a picker with an area, hue and opacity sliders, Hex, RGB or HSL entry with opacity, an eyedropper and swatches.

## Release

Version: 0.2.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/color-picker/0.2.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/color-picker-color.ts

- @ui/color-picker-content.tsx

- @ui/color-picker-inputs.tsx

- @ui/color-picker-root.tsx

- @ui/color-picker-state.tsx

- @ui/color-picker.tsx

- @ui/color-picker.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as color-picker.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import {
  ColorPicker, ColorPickerArea, ColorPickerContent, ColorPickerError, ColorPickerField, ColorPickerFormatSwitch,
  ColorPickerHexInput, ColorPickerLabel, ColorPickerSlider, ColorPickerSwatches, ColorPickerTrigger, ColorPickerValue, type ColorValue,
} from "@/components/ui/color-picker";

export default function ColorPickerExample() {
  const [fill, setFill] = useState<ColorValue>({ hex: "#5684ff", alpha: 1 });
  return (
    <ColorPicker label="Fill" value={fill} onValueCommit={setFill}>
      <ColorPickerField><ColorPickerLabel /><ColorPickerHexInput /><ColorPickerTrigger /></ColorPickerField>
      <ColorPickerError />
      <ColorPickerContent>
        <ColorPickerFormatSwitch />
        <ColorPickerValue />
        <ColorPickerArea />
        <ColorPickerSlider channel="hue" />
        <ColorPickerSlider channel="alpha" />
        <ColorPickerSwatches />
      </ColorPickerContent>
    </ColorPicker>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| value | { hex, alpha } \| null |  | The committed colour, as six-digit hex and opacity from 0 to 1; null when a selection holds different colours. |
| onValueCommit | (value) => void |  | Called once per finished change: a released drag, a typed value, a swatch or the eyedropper. |
| onValueChange | (value) => void |  | Live values while dragging the area or a slider, for previewing on your canvas. |
| label | string |  | Names the colour, such as Fill. Labels the swatch, inputs and picker. |
| swatches | (string \| { hex, alpha })[] |  | Colours your app offers, such as the document's colours. |
| recent / onRecentChange / recentLimit | { hex, alpha }[] |  | The last colours chosen, newest first. Pass recent and onRecentChange to store them; otherwise the picker keeps them. |
| format / defaultFormat / onFormatChange | "hex" \| "rgb" \| "hsl" | "hex" | The format the picker's inputs show. Your app always receives hex and opacity. |
| disabled / readOnly / motion / container | boolean / HTMLElement |  | Turn off editing or opening; turn off transitions; portal the picker elsewhere. |
| ColorPickerContent side / align | "bottom" \| "top" \| "left" \| "right" | "bottom" | Where the picker opens against the row. It flips, then moves to the other axis, rather than cover the row. |
| ColorPickerContent anchor | Element |  | What the picker opens beside. Defaults to the row; when the row is laid out as contents, such as in an inspector's columns, the nearest box around it. |
| ColorPickerField / Label | parts |  | The field's box and the colour's name. Put the label inside the field or before it; pressing anywhere in the field except the swatch selects the hex value. |
| ColorPickerAlphaInput | part |  | Opacity as a percentage. It sits in the picker's value row; add it to the row too if opacity should show without opening the picker. |
| messages | { mixed, open, area, hue, opacity, formats, … } |  | Replace the picker's text, for example to translate it. |

## Supported states

- mixed

- invalid

- read-only

- disabled

## Customization

Keep the committed fill in the host. Use change callbacks for live previews and the commit callback for updates to the document. Supply document swatches and your preferred picker parts. Eyedropper availability depends on the browser and a secure context. Keep direct color entry available.

~~~tsx
<ColorPicker label="Fill" value={fill} onValueCommit={setFill} className="font-mono" motion={false}>
  <ColorPickerField className="rounded-none"><ColorPickerLabel /><ColorPickerHexInput /><ColorPickerTrigger /></ColorPickerField>
  <ColorPickerContent className="rounded-none"><ColorPickerFields /><ColorPickerSwatches /></ColorPickerContent>
</ColorPicker>
~~~

Preserve keyboard access to the trigger and direct input. Verify alpha and format switching when wiring a custom parser or document color model.

## Accessibility and integration checks

- The swatch is a button named with the colour's label and value; the picker opens as a popover, or a bottom sheet on phones.

- The area and the hue and opacity sliders are sliders with readable values; arrow keys step them, Shift steps by 10, Home and End go to the ends.

- Every value can be typed: hex, red, green, blue, hue, saturation, lightness and opacity. A rejected value stays with a message.

- The eyedropper only appears where the browser supports it; it is never the only way to choose a colour.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/color-picker/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
