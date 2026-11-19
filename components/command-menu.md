# Command Menu

Search grouped commands by label or keyword. Run a match with Enter or a tap, from a desktop dialog or a phone bottom sheet.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/command-menu/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/command-menu.tsx

- @ui/command-results.tsx

- @ui/command-search.ts

- @ui/command-menu.md

Npm dependencies: @base-ui/react@1.9.0, lucide-react@1.61.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as command-menu.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { CommandMenu } from "@/components/ui/command-menu";

export default function CommandMenuExample() {
  const [screen, setScreen] = useState("Projects");
  return <>
    <CommandMenu groups={[{ id: "screens", label: "Screens", items:
      ["Projects", "Settings"].map(label => ({ id: label, label, onSelect: () => setScreen(label) })) }]} />
    <p role="status">{screen}</p>
  </>;
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| groups | CommandGroup[] |  | Named groups with uniquely identified commands, labels, optional keywords and icons, and an onSelect callback. |
| filter | (query, item) => number |  | Return a positive score to include and rank a command. By default exact and prefix matches rank above fuzzy matches. |
| open / defaultOpen / onOpenChange | boolean / boolean / callback |  | Control the dialog from your app or choose its initial state. The app owns global shortcuts. |
| trigger / title / placeholder | ReactNode / string / string |  | Customize the trigger content, accessible dialog name, and search prompt. |
| loading / initialQuery | boolean / string |  | Show loading feedback or seed a newly opened search. |
| motion / sheet | boolean / boolean |  | Disable transitions or override responsive presentation. Phones use a sheet by default. |
| className / triggerClassName / optionClassName | string |  | Style the popup, trigger, and result rows. |

## Supported states

- open

- empty

- loading

## Integration

Build groups from screens and commands the user can access. Give each command a stable ID. Connect its selection callback to navigation or a workspace action.

## Customization

Style the popup, trigger, and result rows.

```tsx
<CommandMenu groups={commands} open={open} onOpenChange={setOpen}
  trigger="Quick actions" title="Quick actions" placeholder="Find an action…"
  className="rounded-lg bg-secondary" optionClassName="aria-selected:bg-primary aria-selected:text-primary-foreground"
/>
```

## Accessibility and integration checks

- Arrow keys move the active option while focus stays in the search field. Enter, click, and tap invoke the same command.

- Focus stays in the open dialog. Escape, the close button, and backdrop dismissal return focus to the trigger.

- Phone sheets take initial focus without opening the keyboard. Reduced motion suppresses transitions.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/command-menu/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
