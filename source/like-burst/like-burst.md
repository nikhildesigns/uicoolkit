# Like Burst

Tap to fill the icon and send a burst of particles from its center. Show a rolling count for reactions or use the icon alone for favorites.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/like-burst/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/like-burst.tsx

- @ui/like-burst.md

Npm dependencies: lucide-react@1.61.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as like-burst.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { LikeBurst } from "@/components/ui/like-burst";

export default function LikeBurstExample() {
  const [liked, setLiked] = useState(false);
  return <LikeBurst pressed={liked} onPressedChange={setLiked} count={128 + Number(liked)} />;
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| pressed / defaultPressed | boolean |  | Control the pressed state or set its initial value. |
| onPressedChange | (next: boolean) => void |  | Receives the requested toggle state. |
| count | number |  | The total to display, supplied by your app. Omit for an icon-only toggle. |
| icon / label | SVG component / string | Heart / Like | Set the outline icon and its accessible action name. |
| particles | number \| false | 8 | Number of dots (0–64), or false to disable the burst. |
| motion / duration | boolean / number | true / 500 | Enable animation and set its duration in milliseconds. |
| className | string |  | Style the button and set --like-burst-accent for the selected icon and particles. |

## Supported states

- off

- on

- disabled

## Integration

Keep the selected state and count in the host. If a server write fails, restore the last confirmed state and show the error in the host UI.

## Customization

Style the button and set --like-burst-accent for the selected icon and particles.

```tsx
<LikeBurst icon={Star} label="Favorite" particles={5}
  className="rounded-md bg-secondary shadow-none [--like-burst-accent:goldenrod]" />
```

## Accessibility and integration checks

- Enter and Space toggle the native button. Its accessible name stays stable and aria-pressed exposes the selection.

- The optional count is an accessible description. Decorative particles and digit strips are hidden from screen readers.

- Reduced motion and Motion off update the icon and count immediately.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/like-burst/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
