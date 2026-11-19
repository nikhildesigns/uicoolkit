# Context Menu

Right click, long press, the menu key or a button open the same actions for the object under them, with groups, icons, shortcut hints and disabled actions.

## Release

Version: 0.1.2. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/context-menu/0.1.2.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/context-menu-items.tsx

- @ui/context-menu-popup.tsx

- @ui/context-menu-responsive.tsx

- @ui/context-menu-state.tsx

- @ui/context-menu-triggers.tsx

- @ui/context-menu.tsx

- @ui/context-menu.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as context-menu.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { ContextMenu, ContextMenuTarget, ContextMenuButton, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut } from "@/components/ui/context-menu";

export default function ContextMenuExample() {
  const [message, setMessage] = useState("Choose a document action.");
  return (
    <div>
      <ContextMenu>
        <ContextMenuTarget className="flex items-center justify-between rounded-lg border p-4">
          Launch notes <ContextMenuButton />
        </ContextMenuTarget>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setMessage("Renaming document")}>
            Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setMessage("Document duplicated")}>Duplicate</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status">{message}</p>
    </div>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| open / defaultOpen | boolean |  | Control whether the menu is open, or set where it starts. Open it from the target or button so it has a position. |
| onOpenChange | (open: boolean) => void |  | Called when the menu opens or closes. |
| disabled | boolean | false | Leaves the browser's own menu in place and disables the button. |
| motion | boolean | true | Open and close transitions. Reduced motion is always honored. |
| ContextMenuTarget | div |  | The area that opens the menu on right click, long press, the menu key or Shift+F10. |
| ContextMenuButton | button |  | Visible button that opens the same menu below itself. Defaults to a ••• icon labelled “More actions”. |
| ContextMenuContent | container, positionMethod, collisionPadding |  | The popup. Portalled to document.body unless you pass a container; flips and shifts to stay on screen. |
| ContextMenuItem | onClick, disabled, variant |  | An action. Choosing it closes the menu; your app does the work in onClick. variant="destructive" for removals. |
| Group, GroupLabel, Separator, Shortcut | parts |  | Structure the menu. Shortcut only displays a hint; register the key yourself. |
| className | string |  | Every part accepts className, merged after defaults so yours win. Parts expose data-highlighted, data-disabled and data-variant. |
| useContextMenu() | hook |  | open and disabled state of the nearest ContextMenu, for building your own parts. |

## Supported states

- open

- disabled

## Styling and replaced content

Compose the target, visible trigger, grouped actions, separators and shortcut hints. Each wrapper forwards its ref and native attributes. Use className on individual parts; a displayed shortcut does not register that keyboard command.

~~~tsx
<ContextMenu motion={false}>
  <ContextMenuTarget className="rounded-2xl border p-6">
    Project brief <ContextMenuButton aria-label="Project actions">Actions</ContextMenuButton>
  </ContextMenuTarget>
  <ContextMenuContent className="rounded-2xl">
    <ContextMenuItem onClick={archiveProject}>Archive project</ContextMenuItem>
    <ContextMenuItem disabled>Move to team</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive" onClick={requestDelete}>Delete…</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
~~~

Use the complete imports from the minimal example and connect archiveProject/requestDelete to your application. This restyle replaces the trigger and action content while retaining keyboard behavior.

## State and application actions

Use open/onOpenChange for controlled state or defaultOpen for an uncontrolled initial state. Normally open through ContextMenuTarget or ContextMenuButton so the menu has an anchor. disabled leaves the browser context menu available and disables the visible trigger. useContextMenu reads the nearest root for custom parts.

Selecting an item closes the menu. Your app owns asynchronous work, pending/error feedback, permissions and destructive confirmation. Keep a visible action button; touch and keyboard users must not depend on a hidden right-click gesture.

## Portal, phone and motion

Content portals to document.body by default. Pass container when rendering within an isolated theme boundary or preview; keep that container mounted while open. positionMethod and collisionPadding let a host adjust positioning. On phones content opens as a bottom sheet with focus on the sheet and visible dismissal; verify it on actual touch devices after changing layout.

Set motion={false} to disable the optional reveal and highlight transitions. Reduced motion remains honored. Flat menus only: nested submenus and command search are outside this release.

## Phone presentation

Below 640px, actions open as a bottom sheet with a backdrop, safe-area padding, focus on the menu itself and a visible Cancel action. Set cancelLabel on ContextMenuContent to localize it. Escape, choosing an action or tapping outside dismisses; desktop retains the anchored popup and keyboard-first action focus. Sheet motion slides up and can be disabled with motion={false}; reduced motion is respected.

## Accessibility and integration checks

- Right click, long press, the menu key, Shift+F10 and a visible button all open the same menu; touch users never depend on long press.

- Keyboard-opened menus appear beside the focused element and start on the first available action.

- Arrow keys, Home/End and typeahead move between actions; Enter or Space chooses; Escape closes and returns focus.

- The button announces its menu with aria-haspopup and aria-expanded; disabled actions stay visible and are skipped.

- Open and close transitions are skipped with reduced motion or motion={false}.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/context-menu/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
