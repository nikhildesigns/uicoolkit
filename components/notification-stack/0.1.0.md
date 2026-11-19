# Notification Stack

Keep the newest notification in front. Fan out the deck to read each message, dismiss one at a time, or open the full list.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/notification-stack/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/notification-card.tsx

- @ui/notification-layout.ts

- @ui/notification-stack.tsx

- @ui/notification-timer.tsx

- @ui/notification-stack.md

Npm dependencies: lucide-react@1.61.0, motion@14.6.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as notification-stack.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { NotificationStack, type StackNotification } from "@/components/ui/notification-stack";

export default function NotificationStackExample() {
  const [items, setItems] = useState<StackNotification[]>([]);
  return <>
    <NotificationStack items={items} onDismiss={id => setItems(previous => previous.filter(item => item.id !== id))} />
    <button type="button" onClick={() => setItems(previous => [...previous, { id: crypto.randomUUID(), title: "Changes saved" }])}>Notify</button>
  </>;
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| items / onDismiss | StackNotification[] / (id: string) => void |  | Supply active messages oldest first with stable unique IDs. Remove a message when the stack requests dismissal by button or timeout. |
| title / description / icon / tone | Item fields |  | Give each message a title, optional details and icon. Set tone to error for urgent announcements. |
| duration | number | 5000 | Milliseconds before dismissal. Override per item, or use 0 to keep it until dismissed. Each timer resumes with its remaining time. |
| visible / position | number / "top" \| "bottom" |  | The compact deck shows the newest three messages by default. Position chooses which edge holds the newest card. The host places the stack. |
| defaultExpanded / motion | boolean |  | Start with the full list open, or turn off the deck's layout animation. |
| className / cardClassName / emptyIcon | string / string / ReactNode |  | The deck reserves 20rem and expands upward from its base. Lists taller than 75% of the viewport scroll. Override the reserved height, style cards, or supply the empty state's icon. |

## Supported states

- stacked

- expanded

- empty

## Integration

Keep notification data in host state and append new items with stable IDs. Remove the requested ID in the dismissal callback. Give persistent messages a duration of zero.

## Customization

The deck reserves 20rem and expands upward from its base. Lists taller than 75% of the viewport scroll. Override the reserved height, style cards, or supply the empty state's icon.

```tsx
<NotificationStack items={items} onDismiss={dismiss}
  duration={0} visible={4} position="top" motion={false}
  className="max-w-md" cardClassName="rounded-md bg-secondary"
/>
```

## Accessibility and integration checks

- Show all works with keyboard, mouse and touch. Each dismiss button names its notification.

- Hover and focus pause dismissal. Regular arrivals are announced politely. Errors use a separate assertive region and arrivals never take focus.

- Cards wrap long text and follow system reduced-motion settings.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/notification-stack/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
