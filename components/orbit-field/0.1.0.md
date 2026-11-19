# Orbit Field

Place a logo at the center of a field of orbiting dots or icons. Hover to pulse the accent dots or light a ring around each icon.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/orbit-field/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/orbit-field.tsx

- @ui/use-orbit-motion.ts

- @ui/orbit-field.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as orbit-field.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { OrbitField } from "@/components/ui/orbit-field";

export default function OrbitFieldExample() {
  return (
    <OrbitField />
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| rings | number \| readonly OrbitRing[] | 3 | Choose one to six rings or supply their radii and dot counts. Radii use a 260-unit square. Offset sets the starting angle in degrees. |
| center | ReactNode |  | Replace the center dot with a logo, avatar or icon. |
| renderNode | (node: OrbitNode) => ReactNode |  | Use the zero-based ring and dot index and the ring’s dot count to replace selected dots. Icons stay upright. Return null to keep a dot. |
| synchronized | boolean | false | Rotate rings together at the same speed to preserve angular spacing between icons. |
| still / speed | boolean / number | false / 1 | Freeze and resume the current pose, or change the rotation rate. |
| interactive | boolean | true | Pulse accent dots on pointer entry, or show a dim white glow that follows each orbiting icon’s silhouette while hovered. |
| color / className | string |  | Set the accent color, width or placement of the square field. |
| label | string |  | Give an informative illustration a single accessible name. |

## Supported states

- still

## Integration

Use a decorative field behind content or provide an accessible label for an informative illustration. Supply your own center mark and node content for connected apps.

## Customization

Set the accent color, width or placement of the square field.

```tsx
<OrbitField center={<ProductMark />} label="Product and connected apps"
  renderNode={({ ring, index }) => ring === 2 && index === 0 ? <AppIcon /> : null} />
```

## Accessibility and integration checks

- The field is decorative by default. Supply a label to expose it as an image. Use non-interactive content for the center and orbiting icons.

- Still and reduced motion pause rotation and disable hover feedback. Playback pauses offscreen and in hidden tabs.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/orbit-field/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
