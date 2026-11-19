# Pulse Grid

Two rings travel across the grid. Choose where they start, move the pointer to brighten nearby dots, or tap to send a ripple of your own.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/pulse-grid/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/pulse-grid-gl.ts

- @ui/pulse-grid.tsx

- @ui/pulse-renderer.ts

- @ui/pulse-runtime.ts

- @ui/pulse-shader.ts

- @ui/pulse-grid.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as pulse-grid.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { PulseGrid } from "@/components/ui/pulse-grid";

export default function PulseGridExample() {
  return (
    <section className="relative">
      <PulseGrid className="absolute inset-0 size-full" />
      <h2 className="relative">Recent activity</h2>
    </section>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| origin | "center" \| "top" \| "bottom" \| "left" \| "right" \| "corner" \| [number, number] | "center" | Set the origin by name or as fractions of the width and height measured from the top left. |
| flow | "outward" \| "inward" | "outward" | Spread from the origin or gather toward it. |
| interactive | boolean | true | Enable pointer highlights and ripples on click or tap. |
| color | string |  | Supply the ripple accent as a CSS color or theme token. Idle dots inherit the surrounding text color. |
| still / speed | boolean / number | false / 1 | Display a stationary pair of rings or set a positive playback multiplier. |
| className | string |  | Size and position the canvas within its host. |

## Supported states

- still

## Integration

Place the decorative grid behind the content of a sized container. Choose a ripple origin and enable pointer input only when the surface is interactive.

## Customization

Size and position the canvas within its host.

```tsx
<PulseGrid origin={[0.2, 0.7]} flow="inward" color="#6a80ff" interactive={false} />
```

## Accessibility and integration checks

- The decorative canvas is hidden from screen readers and lets pointer events reach content over it.

- Reduced motion shows a stationary double ring. Animation pauses offscreen and in hidden tabs.

- When WebGL2 is unavailable the host background stays visible.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/pulse-grid/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
