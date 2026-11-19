# Browser Bar

Browser controls for web previews and embedded pages: back, forward, reload, an address field and an action button. It adapts as it narrows, then floats.

## Release

Version: 0.1.1. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/browser-bar/0.1.1.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/browser-bar-parts.tsx

- @ui/browser-bar-root.tsx

- @ui/browser-bar.tsx

- @ui/browser-bar.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as browser-bar.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { BrowserBar, BrowserBarAddress, BrowserBarBack } from "@/components/ui/browser-bar";

export default function BrowserBarExample() {
  const home = "https://example.com";
  const [url, setUrl] = useState(home);
  return (
    <BrowserBar className="rounded-xl border border-border p-2">
      <BrowserBarBack disabled={url === home} onClick={() => setUrl(home)} />
      <BrowserBarAddress value={url} onValueCommit={setUrl} />
    </BrowserBar>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| variant | "standalone" \| "attached" | "standalone" | A complete rounded bar, or one that joins the top of the content below it. Below 240px either becomes a floating bar. |
| disabled / motion / container / messages | boolean / HTMLElement / object |  | Turn off every control; turn off transitions; portal tooltips elsewhere; replace the text. |
| BrowserBarBack / Forward / Reload | parts |  | Named icon buttons with tooltips. Your app handles each click and disables what is unavailable. |
| BrowserBarButton | part |  | Your own icon button, with a label, icon and optional shortcut. |
| BrowserBarAddress value / onValueCommit | string / (address) => void |  | The current address. Enter commits a changed address; Escape or leaving the field restores it. |
| BrowserBarAction active | boolean | false | A filled button such as Run and Stop. active shows it as on. A narrow bar shows only its icon and keeps its name for screen readers. |
| --browser-stroke | CSS variable |  | The outline colour, for matching a selected frame or your own surface. |

## Supported states

- disabled

## Integration

Compose the address field with the navigation and action buttons your host supports. The bar calls your callbacks. Connect them to your own history, reload, and run controls.

One tap focuses the native address field. On touch browsers the keyboard uses the URL layout and Go commits the address. Keep the committed address in host state. Validate and normalize submitted URLs before navigating, and keep navigation controls disabled when there is nowhere to go.

## Customization

Give the root a rounded border for a card header. Use className on BrowserBarAddress for a quieter address field and the action icon slot for a host-specific action.

```tsx
<BrowserBarAddress className="rounded-full bg-muted" value={url} onValueCommit={setUrl} />
```

## Accessibility and integration checks

- The bar is a named group of labelled controls, each with a tooltip.

- Escape in the address field restores the current address and leaves the field.

- An action keeps its name for screen readers when only its icon shows.

- Hidden controls leave the tab order as the bar narrows.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/browser-bar/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
