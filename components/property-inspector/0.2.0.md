# Property Inspector

Grouped properties for whatever is selected on your canvas. Shared values show as they are, differing ones as Mixed, and an edit applies to every selected item.

## Release

Version: 0.2.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/property-inspector/0.2.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/property-inspector-controls.tsx

- @ui/property-inspector-fields.tsx

- @ui/property-inspector-group.tsx

- @ui/property-inspector-list.tsx

- @ui/property-inspector-property.tsx

- @ui/property-inspector-root.tsx

- @ui/property-inspector-state.tsx

- @ui/property-inspector.tsx

- @ui/property-inspector.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: alignment-control@0.2.0, color-picker@0.2.0, image-picker@0.2.0, inspector-field@0.2.0, number-field@0.2.0, split-number-field@0.2.0.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as property-inspector.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import {
  applyPropertyChange, PropertyInspector, PropertyInspectorEmpty, PropertyInspectorGrid,
  PropertyInspectorGroup, PropertyInspectorHeader, PropertyInspectorNumber, PropertyInspectorText,
} from "@/components/ui/property-inspector";

export default function PropertyInspectorExample() {
  const [items, setItems] = useState([{ id: "home", name: "Home", width: 320 }]);
  return (
    <PropertyInspector items={items} onCommit={change => setItems(current => current.map(item => applyPropertyChange(item, change)))}>
      <PropertyInspectorHeader />
      <PropertyInspectorEmpty />
      <PropertyInspectorGroup title="Layout">
        <PropertyInspectorGrid>
          <PropertyInspectorText property="name" label="Name" single />
          <PropertyInspectorNumber property="width" label="Width" unit="px" min={1} />
        </PropertyInspectorGrid>
      </PropertyInspectorGroup>
    </PropertyInspector>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| items | { id: string }[] |  | The current selection. Your app owns it and the values; rows read each item's properties by key. |
| onCommit | ({ ids, property, value, changed?, insert?, remove? }) => void |  | Called once per finished edit with every selected id, so one edit is one undo step. property may be a path into a list, such as fills.0.color; changed names the parts set, insert and remove add or drop one list entry. |
| onPreview | ({ ids, property, value, changed? }) => void |  | Live values while a value is dragged or held, for moving or resizing on your canvas before the commit. |
| applyPropertyChange(item, change) | function |  | Returns the item with a change applied: at its path, part by part when it names parts, or as one added or removed list entry, so each item keeps the rest. |
| PropertyInspectorGroup | { title, defaultOpen, open, onOpenChange, actions } |  | A collapsible group; closed groups keep their fields out of the tab order. actions puts buttons in its header. A group inside a group is a sub-group. |
| Optional group | { present, onAdd, onRemove } |  | present says whether an item has the group, such as Flex. Its fields read and edit only those items; + and − report the ids that lack or have it. |
| PropertyInspectorGroupAction | { label, icon, onAction } |  | A small icon button for a group's header, such as + to add another fill, with a tooltip. |
| PropertyInspectorGrid | { columns } |  | The compact form: rows become cells of a grid (three columns by default) with their labels inside. A group can mix a grid and plain rows. |
| PropertyInspectorList | { property, label, create, visibleKey, shared, actions, children } |  | A list such as Fills, Borders or Shadows: + adds create() on top; entries have hide and remove. shared holds rows every entry shares, such as a border's width. Lists that differ in length show a note, and + replaces them. |
| PropertyInspectorSettings | { label, variant, summary, leading, children } |  | Settings in a popover, or a bottom sheet on phones: a row showing a summary such as Drop shadow, or with variant "icon" a header button, such as a border's position and style. Rows inside edit the same item or entry. |
| PropertyInspectorRow | part |  | Places related fields side by side in one line, such as X and Y or W and H; without it, fields stack. Each field keeps its own label and message. |
| Row options | { property, label, parts, single, locked, reason, hint, readOnly } |  | Every row takes these. parts reads a property part by part, so only differing parts show Mixed; single makes a property unavailable for several items, such as a name. |
| Grid options | { shortLabel, span, rowSpan } |  | In a grid: the short label or icon shown inside the field (the full label is still read, and an icon shows it in a tooltip on hover), and how many columns and rows the cell covers. |
| PropertyInspectorField | { children: (binding) => ReactNode, ownLabel } |  | The generic row: hosts any control with the property's value (null when Mixed), mixedParts, preview and commit, inside an Inspector Field. |
| PropertyInspectorText / Number / Value | row |  | A text, number (unit, min, max, step and keywords such as Auto or Hug) or read-only row. |
| PropertyInspectorSelect | { options, searchable, renderOption } |  | A choice from a list, such as Weight; searchable adds a search field for long lists such as Font family, with inspectorFieldFontOption showing each font in its face. |
| PropertyInspectorSegments / Toggle / ToggleButton / Checkbox | row |  | Built-in rows for a few choices, on/off segments, an icon button that stays pressed, and a checkbox with an optional shortcut. |
| Icon column | layout |  | Every group keeps two 32px icon slots at the right, so fields end on one line: visibility and remove, + and the chevron, and Split Number Field's expand button sit in them. Popovers have none. |
| PropertyInspectorSplitNumber / Alignment / Color | row |  | Built-in rows for a value made of parts (a Split Number Field preset), a 3×3 Alignment Grid and a colour that opens the Color Picker. |
| PropertyInspectorActions / Action | { label } / { label, icon, shortcut, onAction } |  | One-shot actions on the selection, such as Rotate 90° and the flips. Each press calls onAction once with every selected id; nothing stays pressed. |
| PropertyInspectorHeader / Empty | parts |  | The selection's title (the item's name or “2 selected”) and the empty state shown when nothing is selected. |
| labelPosition | "outside" \| "inside" |  | Where every row's label sits: its own column (the default), or inside one box per row, as many design tools do. |
| container | HTMLElement \| null |  | Where pickers and menus are portalled. Defaults to document.body. |
| density | "default" \| "compact" |  | Compact uses 28px filled fields and body-style group titles. The --uicoolkit-field-* CSS variables fine-tune either density. |
| disabled / motion | boolean |  | Disable every field; turn off group and field transitions. Reduced motion is always honored. |
| messages | { label, empty, mixed, multiple, single, add, remove, hide, show, mixedList } |  | Replace the panel's text: its name, the empty state, Mixed, the multiple-selection title, the single-item reason, + and −, a list entry's hide and show names, and the note for lists that differ. |
| usePropertyInspectorProperty() | hook |  | The binding the generic row uses, for building a row of your own around any control. |

## Supported states

- locked

- disabled

## Customization

Pass the host's current selection to `items` and choose which groups and controls to render. Use `onPreview` for ephemeral canvas feedback and `onCommit` to apply the final change once to the affected IDs. `applyPropertyChange` is available for immutable updates. Use the grid for mixed-width cells, list parts for repeatable entries, and custom field bindings for application-specific data. Image rows receive the host's upload callback and image library.

~~~tsx
<PropertyInspector items={selection} onCommit={commit} motion={false} className="max-w-sm rounded-none">
  <PropertyInspectorHeader />
  <PropertyInspectorEmpty />
  <PropertyInspectorGroup title="Spacing" className="border-t border-dashed">
    <PropertyInspectorNumber property="gap" label="Gap" unit="px" min={0} />
  </PropertyInspectorGroup>
</PropertyInspector>
~~~

Use `density="compact"` for dense panels. To match your own fields, set these CSS variables on the inspector or any ancestor: `--uicoolkit-field-height`, `--uicoolkit-field-bg`, `--uicoolkit-field-border`, `--uicoolkit-field-shadow`, `--uicoolkit-field-icon-bg`, `--uicoolkit-field-icon-border` and `--uicoolkit-field-icon-width`. Inner controls follow the field height. Inspector Field, Number Field, Alignment Control, Color Picker and Split Number Field read the same variables when used on their own.

Test an empty selection, matching values, mixed values and edits to a subset of the selection. Keep locked reasons available when supplying custom rows.

## Accessibility and integration checks

- The inspector is a region named “Properties”; the selection title updates politely when the selection changes.

- Groups are disclosure buttons with aria-expanded; collapsed content is inert, so hidden fields are skipped by Tab.

- Every row is an Inspector Field: labels name their controls, and Mixed, locked and unavailable states are announced with their reasons.

- A property made of parts shows Mixed only in the parts that differ, and each part is named with the property, such as “Padding top”.

- In the compact grid a field may show only “X” or an icon, but it is still named in full, such as “Rotation”; one-shot actions form a toolbar with one tab stop.

- An optional group's + and − are named, such as “Add Flex” and “Remove Flex”, with tooltips; a group with no items hides its fields from the tab order.

- Each list entry is a group named such as “Fill 2”, with named hide, show and remove buttons; a hidden entry stays editable. A settings row opens a dialog named after it, and Escape returns focus to the row.

- Numbers can be typed, stepped with the arrow keys or dragged; dragging is never the only way to change a value.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/property-inspector/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
