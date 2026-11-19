# Number Field

Edit a number the way design tools do: type it, step it, or drag its label or number, as an input or a slider. Drags preview live and commit once when you let go.

## Release

Version: 0.2.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/number-field/0.2.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/number-field-input.tsx

- @ui/number-field-keyword.tsx

- @ui/number-field-root.tsx

- @ui/number-field-scrub.tsx

- @ui/number-field-slider-parts.tsx

- @ui/number-field-slider.tsx

- @ui/number-field-state.tsx

- @ui/number-field-stepper.tsx

- @ui/number-field-value.tsx

- @ui/number-field.tsx

- @ui/number-field.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as number-field.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import {
  NumberField, NumberFieldDecrement, NumberFieldError, NumberFieldGroup, NumberFieldIncrement,
  NumberFieldInput, NumberFieldLabel, NumberFieldScrubArea, NumberFieldStepper, NumberFieldUnit,
} from "@/components/ui/number-field";

export default function NumberFieldExample() {
  const [width, setWidth] = useState<number | null>(320);
  return (
    <NumberField label="Width" value={width} onValueCommit={setWidth} min={0} max={1440} unit="px">
      <NumberFieldScrubArea><NumberFieldLabel /></NumberFieldScrubArea>
      <NumberFieldGroup>
        <NumberFieldInput />
        <NumberFieldUnit />
        <NumberFieldStepper><NumberFieldIncrement /><NumberFieldDecrement /></NumberFieldStepper>
      </NumberFieldGroup>
      <NumberFieldError />
    </NumberField>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| value | number \| keyword \| null |  | The committed value: a number, or one of your keywords. Your app owns it; null means there is none, such as a mixed selection. |
| onValueCommit | (value: number \| keyword) => void |  | Called once per finished change: a typed value, a step, the end of a drag, or a keyword. |
| onValueChange | (value: number) => void |  | Called with every change, including live values while dragging. A cancelled drag sends the committed value back. |
| label | string |  | Accessible name of the field, such as “Width”. |
| min / max | number |  | Limits. A typed value outside them is rejected with a message naming the limit; stepping and dragging stop at them. The slider needs both. |
| step / largeStep | number | 1 / step × 10 | Arrow keys and buttons move by step; Shift and Page Up/Down by largeStep. |
| precision | number | decimals of step | Decimal places kept and shown. |
| unit | string |  | Shown after the value and read with it, such as “px”. Typing the unit is accepted. |
| format / parse | (value: number) => string / (text: string) => number |  | Replace how values are shown and read. Return NaN from parse to reject text. |
| validate | (value: number) => string \| null \| undefined |  | Return a message to reject a typed value; the text stays for fixing. |
| keywords | { value, label, resolved? }[] |  | Named values the field can also hold, such as Auto, Hug or Fill. One with a resolved number shows it beside its name; typing a keyword's name selects it. |
| keywordFallback | number | min, or 0 | Where stepping or dragging starts from a keyword with no resolved number. Adjusting a keyword always turns it into a number. |
| NumberFieldKeywordMenu | { compact } |  | The menu at the end of the group: Fixed and your keywords. Opens as a bottom sheet on phones; container sets where it is portalled. compact shows only the arrow for Fixed, for narrow fields. |
| submitText / editText | (text) => true \| string \| void / string |  | Read your own typed forms before the field parses a number, such as a list of values: return true when applied or a message to reject. editText is what typing starts from when the value is empty. |
| placeholder | string |  | Shown when value is null, such as “Mixed”. Stepping and dragging need a value; typing sets one. |
| disabled / readOnly | boolean | false | Disabled cannot be focused; read-only shows the value and can be focused. |
| sensitivity | number | 4 | Pixels of drag per step on a scrub area. |
| stepperLayout | "auto" \| "stacked" \| "split" | "auto" | Where the stepper's buttons go: small up/down arrows at the end, or larger − and + on either side. Auto chooses split on touch screens, in CSS, so it never flashes. Parts expose data-layout for styling. |
| motion | boolean | true | The slider fill glides between stepped values. Reduced motion is always honored. |
| messages | { invalid, tooLow, tooHigh, increment, decrement, fixed, mode } |  | Replace the invalid-number and limit messages ({min} and {max} become the formatted limit with its unit), the step buttons' names and the keyword menu's text. |
| className | string |  | Every part accepts className, merged after defaults so yours win. Parts expose data-dragging, data-typing, data-invalid, data-empty, data-disabled and data-readonly. |
| NumberFieldSliderSteps markClassName | string |  | Styles each step mark; marks under the fill have data-filled. Marks show while adjusting and use large steps when there would be more than 40. |
| useNumberField() | hook |  | State and actions of the nearest NumberField, for building your own parts. |

## Supported states

- mixed

- invalid

- disabled

- read-only

## Customization

Keep the committed number in application state. Use `onValueChange` for drag or slider previews and `onValueCommit` for updates to the stored value. Clear any temporary preview after cancellation. Use a keyword configuration for values such as Auto or Fill and keep the chosen keyword in the host model.

~~~tsx
<NumberField label="Width" defaultValue={320} className="rounded-none font-mono" motion={false}>
  <NumberFieldGroup className="border-dashed"><NumberFieldInput /></NumberFieldGroup>
  <NumberFieldError />
</NumberField>
~~~

Keep the error part near the input, and give a standalone scrub area or slider an accessible label.

## Accessibility and integration checks

- The input is a spin button and the slider presentation a slider, both named by label, with the unit in their value text.

- Enter commits a typed value unless an input method is composing; Escape reverts it. Invalid text stays with a role=alert message linked by aria-describedby.

- Arrow keys step, Shift and Page Up/Down take large steps; on the slider, Home and End go to the limits and Enter or F2 opens typing.

- Dragging is never the only way to change a value. Escape cancels a drag; on touch, vertical movement scrolls the page.

- The stepper arrows stay out of the tab order because the arrow keys do the same thing, and pressing them keeps focus in the input. Holding one repeats, previewing live and committing once on release.

- Fill transitions are skipped with reduced motion or motion={false}.

- A keyword is read with the value, such as 240 px, Hug. The keyword menu is a labelled select (Width mode), and a keyword can also be typed.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/number-field/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
