# Contour Field

Contours drift across the terrain, with every fifth line picked out in color. Move the pointer to raise a hill, or pause the field to adjust the spacing.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/contour-field/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/contour-field-gl.ts

- @ui/contour-field.tsx

- @ui/contour-renderer.ts

- @ui/contour-runtime.ts

- @ui/contour-shader.ts

- @ui/contour-field.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as contour-field.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { ContourField } from "@/components/ui/contour-field";

export default function ContourFieldExample() {
  return (
    <section className="relative">
      <ContourField className="absolute inset-0 size-full" />
      <h2 className="relative">Field notes</h2>
    </section>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| density | number | 1 | Set a positive multiplier for the number of contours. Higher values place lines closer together. |
| color | string | var(--primary, #ff5a1f) | Set the accent for index contours and the pointer hill. Other lines inherit the container’s text color. |
| still | boolean | false | Hold the current terrain and pointer hill while editing color or density. |
| speed | number | 1 | Set the playback multiplier for the terrain’s drift. |
| interactive | boolean | true | Raise a hill under the pointer during playback. |
| className | string |  | Size and position the canvas inside its container. |

## Supported states

- still

## Integration

Position the decorative field behind the section content. Use density to adjust line spacing and Still to display a static field.

## Customization

Size and position the canvas inside its container.

```tsx
<ContourField color="#456ff0" density={1.5} still />
```

## Accessibility and integration checks

- The decorative canvas is hidden from screen readers and lets pointer events reach controls layered over it.

- Reduced motion holds the current terrain. Animation pauses offscreen and in hidden tabs.

- The surrounding background stays visible when WebGL2 is unavailable.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/contour-field/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
