# Inspector Field

One property row for a design tool inspector: a label and its value as text, a select, segments, toggle buttons or a Number Field, with mixed, locked and unavailable states.

## Release

Version: 0.2.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/inspector-field/0.2.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/inspector-field-checkbox.tsx

- @ui/inspector-field-icons.tsx

- @ui/inspector-field-lock.tsx

- @ui/inspector-field-parts.tsx

- @ui/inspector-field-root.tsx

- @ui/inspector-field-segments.tsx

- @ui/inspector-field-select.tsx

- @ui/inspector-field-state.tsx

- @ui/inspector-field-text.tsx

- @ui/inspector-field-toggle.tsx

- @ui/inspector-field.tsx

- @ui/inspector-field.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as inspector-field.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import {
  InspectorField, InspectorFieldLabel, InspectorFieldMessage, InspectorFieldText, InspectorFieldToggle,
} from "@/components/ui/inspector-field";

export default function InspectorFieldExample() {
  const [name, setName] = useState("Home");
  const [clip, setClip] = useState(false);
  return (
    <div className="grid gap-2">
      <InspectorField label="Name">
        <InspectorFieldLabel />
        <InspectorFieldText value={name} onCommit={setName} />
        <InspectorFieldMessage />
      </InspectorField>
      <InspectorField label="Clip content">
        <InspectorFieldLabel />
        <InspectorFieldToggle checked={clip} onCommit={setClip} />
      </InspectorField>
    </div>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| label | string |  | Name of the property, such as “Width”. Labels the control. |
| mixed | boolean | false | The selection holds different values. Controls show a Mixed placeholder; a typed value applies to every item. |
| readOnly / locked / unavailable | boolean | false | Shown but not editable; controlled by something else (the control is disabled with a lock inside it); or not applicable (a disabled field with a dash). |
| reason | string |  | Why the property is locked or unavailable. Shown in a tooltip while the row is hovered, and always read with its control. |
| disabled / pending | boolean | false | Disabled cannot be focused. Pending makes the control wait while a change applies. |
| hint | string |  | Short guidance below the row when there is no reason or error to show. |
| InspectorFieldText | { value, onCommit, validate, variant } |  | Built-in text control, boxed (default) or ghost. Enter or leaving commits once; Escape reverts; rejected text stays with an alert. |
| InspectorFieldSelect | { value, options, onCommit, container, searchable, renderOption } |  | Built-in select with a themed list (Base UI): keyboard and typeahead, a bottom sheet on phones, and the Mixed placeholder. searchable adds a search field and option groups for long lists. |
| inspectorFieldFontOption | renderOption |  | A preset that draws each font family in its own face, falling back to the system sans-serif when it isn't installed. |
| InspectorFieldToggle | { checked, onCommit } |  | Built-in Off/On toggle: a radio group whose highlight slides to the chosen side; mixed highlights neither. |
| InspectorFieldSegments | { value, options, onCommit } |  | Built-in segmented choice of 2 to 5 options, each text or an icon. Icon segments fill the column and name themselves in a tooltip; text stays compact. Off/On is this with two text options. |
| InspectorFieldToggleButton | { pressed, label, icon, onCommit } |  | Built-in on/off icon button for a stored state, such as Lock aspect ratio, with a tooltip. pressed null is Mixed, and pressing a Mixed button turns it on. |
| InspectorFieldActions / ActionButton | { label, icon, onAction, shortcut } |  | A joined toolbar of one-shot actions, such as Rotate 90° and the flips. Each press reports one action and nothing stays pressed; tooltips show the label and shortcut. |
| InspectorFieldCheckbox | { checked, onCommit, shortcut } |  | Built-in checkbox row, such as Clip content: the box and the row's label across the row, with an optional shortcut. checked null is Mixed (a dash), and checking a Mixed box turns it on. |
| InspectorFieldControls / inspectorFieldIcons | part / icons |  | Puts controls side by side in the control column, such as segments with a button beside them; and ready-made icons for direction, wrap, text alignment, rotate, flips and lock aspect ratio. |
| InspectorFieldControl | (control) => ReactNode |  | Hosts another control. Spread control.props onto it (label, disabled, readOnly, placeholder) and pass control.describedBy to its input. Unavailable rows render the label and a dash instead. While control.locked is true, show InspectorFieldLock in place of the hosted control's adjust buttons. |
| messages | { mixed, unavailable, locked, off, on, search, noResults } |  | Replace the Mixed placeholder, the unavailable and locked names, the toggle labels and a searchable select's search and empty text. |
| labelPosition | "outside" \| "inside" | "outside" | Outside gives the label its own column beside the control. Inside draws one box around the row with the label at its start; built-in controls and a hosted Number Field drop their own box. |
| align | "start" \| "end" | "end" | Where values sit inside the built-in text, select and read-only controls. Hosted controls receive it as control.align to apply themselves. |
| --inspector-label-width | CSS variable | 6rem | Width of the label column, so rows line up. |
| className | string |  | Every part accepts className. The root exposes data-mixed, data-locked, data-unavailable, data-pending and data-invalid. |
| useInspectorField() | hook |  | State of the nearest InspectorField, for custom parts and controls. |

## Supported states

- mixed

- locked

- unavailable

- invalid

- pending

- read-only

- disabled

## Customization

Supply control values and persist edits through each control's commit callback. Compose text, select, toggle, segments or checkbox parts, or use `InspectorFieldControl` to pass the row's state and labeling to a custom control. Install Number Field separately when using it in that slot. Pass a portal container when the inspector lives in a modal or scoped theme.

~~~tsx
<InspectorField label="Name" labelPosition="inside" className="rounded-none font-mono">
  <InspectorFieldLabel />
  <InspectorFieldText value={name} onCommit={rename} />
  <InspectorFieldMessage />
</InspectorField>
~~~

Use a reason for a locked or unavailable row. Keep its label connected when swapping the visual control.

## Accessibility and integration checks

- A searchable select's search field takes focus when the list opens on desktop and is named Search; the first match is highlighted, so Enter picks it. On phones the sheet takes focus first, so the keyboard waits for a tap.

- The label names the control; the reason, hint or error below the row is its accessible description.

- Rejected text uses role=alert, sets aria-invalid and stays in the field. Enter commits unless an input method is composing; Escape reverts.

- Segments are a radio group with one tab stop and arrow keys; icon segments and toggle buttons are named by their labels, and a toggle button reads as pressed, not pressed or mixed.

- Locked rows show a lock with an accessible name inside the control; unavailable rows read “Not available” instead of a dash, and locked or unavailable rows keep their reason as the control's description, although it only shows on hover.

- Locked controls are disabled, so their reason is read with the row's label rather than reached by Tab.

- Pending rows set aria-busy and keep the control read-only.

- Entrance transitions are skipped with reduced motion or motion={false}.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/inspector-field/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
