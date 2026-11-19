# Ember Glow

Wisps of color rise from the lower edge and drift gently toward the pointer. Adjust the glow or freeze the smoke to use it as a still backdrop.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/ember-glow/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/ember-glow-gl.ts

- @ui/ember-glow.tsx

- @ui/ember-renderer.ts

- @ui/ember-runtime.ts

- @ui/ember-shader.ts

- @ui/ember-glow.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as ember-glow.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { EmberGlow } from "@/components/ui/ember-glow";

export default function EmberGlowExample() {
  return (
    <section className="relative">
      <EmberGlow className="absolute inset-0 size-full" />
      <h2 className="relative">Featured work</h2>
    </section>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| intensity | number | 1 | Multiply the glow strength. Zero makes the canvas transparent. |
| color | string | var(--primary, #ff5a1f) | Choose a CSS color or theme token for the glow. |
| still | boolean | false | Freeze the smoke and grain while keeping color and intensity editable. |
| speed | number | 1 | Set the playback multiplier for the drift. |
| interactive | boolean | true | Let the pointer bend the smoke during playback. |
| className | string |  | Size or position the canvas in its container. |

## Supported states

- still

## Integration

Give the container a size and layer its content above the decorative canvas. Adjust intensity to suit the foreground contrast.

## Customization

Size or position the canvas in its container.

```tsx
<EmberGlow color="#39be91" intensity={0.75} still />
```

## Accessibility and integration checks

- The decorative canvas is hidden from screen readers. Controls and links layered over it receive pointer events.

- Reduced motion freezes the smoke and grain. Animation pauses offscreen and in hidden tabs.

- The surrounding background stays visible when WebGL2 is unavailable.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/ember-glow/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
