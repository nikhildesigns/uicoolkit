# Burning Text

Heat travels through the tops of the letters and breaks into flames. Change the word, tune the fire from a candle to a blaze, or freeze the effect.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/burning-text/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/burning-text-gl.ts

- @ui/burning-text.module.css

- @ui/burning-text.tsx

- @ui/flame-bed.ts

- @ui/flame-canvas.tsx

- @ui/flame-renderer.ts

- @ui/flame-shader.ts

- @ui/burning-text.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as burning-text.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { BurningText } from "@/components/ui/burning-text";

export default function BurningTextExample() {
  return (
    <h1>Ship <BurningText>cool</BurningText> products faster.</h1>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| children | string |  | The text that shapes the flame. |
| flame | "candle" \| "campfire" \| "blaze" | "campfire" | Candle flickers at the letter tops, Campfire rolls across the upper strokes, and Blaze burns upward from the lower strokes. |
| color | string | "#ff5b1f" | Supply a CSS color or theme token for the whole fire. |
| sparks | boolean | true | Show drifting embers. |
| still | boolean | false | Hold one frame and hide drifting embers. |
| speed | number | 1 | Set a positive playback multiplier. |
| className | string |  | Style the wrapper. The letters inherit its typography. |

## Supported states

- burning

- still

## Integration

Wrap the word in its semantic heading. Keep the CSS module beside the installed source. The native text remains readable if the canvas cannot render.

## Customization

Style the wrapper. The letters inherit its typography.

```tsx
<BurningText color="#4779ff" flame="candle" sparks={false}>glow</BurningText>
```

## Accessibility and integration checks

- The word is selectable, readable by screen readers and visible when WebGL is unavailable.

- Reduced motion holds a still flame. The canvas pauses outside the viewport and in hidden tabs.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/burning-text/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
