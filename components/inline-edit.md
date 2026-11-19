# Inline Edit

Click a value to edit it where it sits. Enter saves, Escape cancels, and clicking away never saves by accident. The Ghost variant edits on top of the text with no buttons.

## Release

Version: 0.1.3. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/inline-edit/0.1.3.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/inline-edit-feedback.tsx

- @ui/inline-edit-field.tsx

- @ui/inline-edit-root.tsx

- @ui/inline-edit-state.tsx

- @ui/inline-edit.tsx

- @ui/inline-edit.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as inline-edit.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { InlineEdit, InlineEditPreview, InlineEditEditor, InlineEditInput, InlineEditSave, InlineEditCancel, InlineEditError, InlineEditConflict } from "@/components/ui/inline-edit";

export default function InlineEditExample() {
  const [name, setName] = useState("Launch notes");
  return (
    <InlineEdit label="Document name" value={name} onSave={async next => { setName(next); }}
      validate={next => next.trim() ? null : "Enter a name."}>
      <InlineEditPreview placeholder="Untitled" />
      <InlineEditEditor>
        <InlineEditInput />
        <InlineEditSave />
        <InlineEditCancel />
      </InlineEditEditor>
      <InlineEditError />
      <InlineEditConflict />
    </InlineEdit>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| value | string |  | The committed value. Your app owns it and updates it after a successful save. |
| onSave | (draft: string) => void \| Promise<unknown> |  | Persist the draft. A returned promise shows pending; rejecting keeps the draft and offers retry. |
| label | string |  | Accessible name of the field, such as “Task name”. |
| validate | (draft: string) => string \| null \| undefined |  | Return a message to reject the draft before saving. |
| editing / defaultEditing | boolean |  | Control edit mode yourself, or set where it starts. |
| onEditingChange | (editing: boolean) => void |  | Called when the user starts or finishes editing. |
| onCancel | () => void |  | Called after the user cancels an edit. |
| disabled | boolean | false | Shows the value without allowing edits. |
| motion | boolean | true | Entrance transitions for the editor and messages. Reduced motion is always honored. |
| variant | "default" \| "ghost" | "default" | Ghost edits on top of the text itself: a line draws in under it, there are no Save or Cancel buttons, Enter saves and Escape cancels. |
| saveOnBlur | boolean | true for ghost | Leaving the field saves a valid change; an unchanged or invalid one reverts. Off by default for the default variant, where leaving never saves. |
| className | string |  | Every part accepts className, merged after defaults so yours win. Parts expose data-editing, data-status, data-invalid and data-conflict. |
| useInlineEdit() | hook |  | State and actions of the nearest InlineEdit, for building your own parts. |

## Supported states

- editing

- invalid

- pending

- error

- conflict

- disabled

## Styling and replaced content

Each part accepts native attributes, a forwarded ref and className merged after defaults. Keep the root's label meaningful. Replace the preview, action labels, error content or conflict content through children and render functions.

~~~tsx
<InlineEdit label="Workspace name" value={name} onSave={saveName}
  className="rounded-2xl border p-4" motion={false}>
  <InlineEditPreview className="font-semibold">
    {value => <strong>{value || "Untitled workspace"}</strong>}
  </InlineEditPreview>
  <InlineEditEditor>
    <InlineEditInput className="rounded-full" />
    <InlineEditSave>{status => status === "pending" ? "Updating…" : "Update"}</InlineEditSave>
    <InlineEditCancel>Keep original</InlineEditCancel>
  </InlineEditEditor>
  <InlineEditError />
  <InlineEditConflict />
</InlineEdit>
~~~

Use the complete imports and application state pattern from the minimal example. This styling example changes both the appearance and content without patching internals.

## State and persistence

The value prop is committed application state. Return the save promise and update value only after successful persistence; reject to retain the draft and show retry. Validate synchronously with validate. A changed external value during a dirty edit creates a conflict; include InlineEditConflict so the user can choose the latest value or keep the draft.

Default mode uses explicit Save/Cancel and does not save when focus leaves. Ghost mode uses variant="ghost", omits action buttons when you choose, saves valid changes on blur by default and still supports Enter/Escape. Set saveOnBlur explicitly to change that policy.

Use editing/onEditingChange for externally controlled edit mode, defaultEditing for an initial uncontrolled session, and useInlineEdit inside the root to build custom parts. Consumer handlers run before internal behavior where documented; preventDefault cancels the corresponding internal action.

## Motion and boundaries

Set motion={false} to disable optional transitions. Reduced motion is honored independently. Single-line text only; no rich text, multiline editor or collaboration backend is provided. Pending saves remain focusable and cannot be submitted twice.

## Accessibility and integration checks

- The value is a native button; activating it focuses the input and selects its text.

- Enter saves unless an input method is composing; Escape cancels. Leaving the field never saves in the default variant; in ghost it saves a valid change and reverts an invalid one.

- Validation and save errors use role=alert and are linked to the input with aria-describedby.

- Save stays focusable while pending (aria-disabled, aria-busy), and focus returns to the value after save or cancel.

- Entrance transitions are skipped with reduced motion or motion={false}.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/inline-edit/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
