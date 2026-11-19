# Sortable List

Reorder rows by dragging a handle or with Move up and Move down. Your app owns the order and gets each finished move once; if saving fails, the list offers to retry.

## Release

Version: 0.1.3. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/sortable-list/0.1.3.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/sortable-list-content.tsx

- @ui/sortable-list-controls.tsx

- @ui/sortable-list-retry.tsx

- @ui/sortable-list-root.tsx

- @ui/sortable-list-state.tsx

- @ui/sortable-list.tsx

- @ui/sortable-list.md

Npm dependencies: motion@14.6.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as sortable-list.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { SortableList, SortableListContent, SortableListItem, SortableListHandle, SortableListMoveUp, SortableListMoveDown, SortableListEmpty, SortableListError } from "@/components/ui/sortable-list";

type Item = { id: string; title: string };

export default function SortableListExample() {
  const [items, setItems] = useState<Item[]>([{ id: "a", title: "Draft" }, { id: "b", title: "Review" }]);
  return (
    <SortableList items={items} getId={item => item.id} getLabel={item => item.title}
      onOrderChange={async next => { setItems(next); }}>
      <SortableListContent>
        {(item: Item) => (
          <SortableListItem>
            <SortableListHandle />
            <span className="flex-1">{item.title}</span>
            <SortableListMoveUp />
            <SortableListMoveDown />
          </SortableListItem>
        )}
      </SortableListContent>
      <SortableListEmpty>No items yet.</SortableListEmpty>
      <SortableListError />
    </SortableList>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| items | T[] |  | Your ordered items. The list shows them in this order and never reorders them itself. |
| getId | (item: T) => string \| number |  | A stable identity for each item. Never derived from position. |
| getLabel | (item: T) => string |  | Name used in button labels and announcements, such as a task title. |
| onOrderChange | (items: T[], move: { item, from, to }) => void \| Promise<unknown> |  | Called once per completed move. Save it and update items. A returned promise shows saving; rejecting restores your order and offers Retry. |
| isLocked | (item: T) => boolean |  | Items that cannot be moved; their handle and move buttons are unavailable. |
| disabled | boolean | false | Shows the list without allowing moves. |
| motion | boolean | true | Layout and lift animation. Reduced motion is always honored. |
| messages | { handle, moveUp, moveDown, moved, restored } |  | Replace button labels and screen reader announcements, for example to translate them. Each is a function of the item's label (and position). |
| SortableListContent | (item, index) => ReactNode |  | The list. Its render function returns a SortableListItem for each item. |
| Handle, MoveUp, MoveDown | parts |  | Drag from the handle (arrows, Home and End also work on it), or move one place with the buttons. Unavailable moves are aria-disabled so focus stays put. |
| Empty, Error | parts |  | Shown when there are no items, and after a rejected save with a Retry button. |
| className | string |  | Every part accepts className, merged after defaults so yours win. Rows expose data-dragging and data-locked; the root exposes data-status. |
| useSortableList() | hook |  | Displayed items, status, failure, move(id, to), retry and dismiss, for building your own parts. |

## Supported states

- empty

- single

- saving

- error

- disabled

## Styling and replaced content

The list is generic over your item type; use stable IDs rather than array positions. Its content render function lets your row contain real icons, metadata and actions. Every part accepts native attributes, className and a forwarded ref.

~~~tsx
<SortableList items={items} getId={item => item.id} getLabel={item => item.title}
  onOrderChange={persistOrder} motion={false} className="rounded-2xl border p-4">
  <SortableListContent>
    {(item: Item) => (
      <SortableListItem className="rounded-xl border p-3">
        <SortableListHandle />
        <strong className="flex-1">{item.title}</strong>
        <SortableListMoveUp>Earlier</SortableListMoveUp>
        <SortableListMoveDown>Later</SortableListMoveDown>
      </SortableListItem>
    )}
  </SortableListContent>
  <SortableListEmpty>Add a step to get started.</SortableListEmpty>
  <SortableListError />
</SortableList>
~~~

Use the complete imports and Item type from the minimal example. persistOrder is your application callback.

## State, saving and recovery

The app owns items. A drag previews a candidate order and one completed move calls onOrderChange once, with the new list and move information. Await persistence before committing the new items to state. Rejection restores the authoritative order, announces recovery and exposes Retry. Include SortableListError, or provide an equivalent failure surface through useSortableList.

Retry reapplies the failed item’s placement relative to the nearest surviving neighbor in the current app order. New rows, current object data, removals and unrelated row ordering are preserved; callback positions describe the current move. Retry is unavailable while disabled or pending, when the moved item is gone or the placement is already applied, or when it would move a locked item. Re-enable/unlock to retry, make a new move, or dismiss the old failure through useSortableList.

isLocked keeps an item in its slot. disabled prevents changes to the entire list. Movement controls stay focusable when unavailable. Replace messages to localize handle labels and move/restoration announcements.

~~~tsx
<SortableList items={items} getId={item => item.id} getLabel={item => item.title}
  onOrderChange={async next => {
    await api.saveOrder(next.map(item => item.id));
    setItems(next);
  }}
  messages={{ moveUp: label => "Move " + label + " earlier" }}>
  {children}
</SortableList>
~~~

The api and children in this integration fragment belong to the host app. Do not add artificial success timers to delivered source.

## Motion and boundaries

Set motion={false} to turn off optional lift/layout animation. Reduced motion is honored. Drag only from the handle so the rest of the row can scroll and receive actions. Keep move buttons for non-drag operation.

One vertical list only. Nested trees, multiple containers, Kanban, virtualization and cross-window dragging are outside this release; use representative real content before adopting it for very large lists.

## Accessibility and integration checks

- Every move has a non-drag route: Move up and Move down buttons, plus arrows, Home and End on the handle.

- Each completed move is announced once with the item's name and new position; a failed save announces where it returned.

- Focus stays on the control you used, even when the row reaches the top or bottom.

- Escape during a drag cancels it and keeps the original order.

- Dragging starts only from the handle, so touch scrolling on the rest of the row still works.

- Layout animation is skipped with reduced motion or motion={false}.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/sortable-list/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
