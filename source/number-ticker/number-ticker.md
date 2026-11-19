# Number Ticker

Each digit rolls to its new value. Show a full count or a compact figure, with separators and units formatted for the reader’s locale.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/number-ticker/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/number-ticker.tsx

- @ui/number-ticker.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as number-ticker.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { NumberTicker } from "@/components/ui/number-ticker";

export default function NumberTickerExample() {
  const [value, setValue] = useState(1250);
  return <button type="button" onClick={() => setValue(value + 25)}>Total <NumberTicker value={value} /></button>;
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| value | number |  | The numeric target supplied by your app. |
| locale / format | string / Intl.NumberFormatOptions | en-US / standard | Set the locale and number format, including compact notation, currency, or fractional digits. |
| motion / duration | boolean / number | true / 600 | Enable rolling and set its duration in milliseconds. |
| className | string |  | Style the number’s typeface, size and color. |

## Supported states

- settled

## Integration

Pass the latest numeric value directly from your application. Keep its label and units adjacent to the number or configure a locale-aware format.

## Customization

Style the number’s typeface, size and color.

```tsx
<NumberTicker value={weeklyInstalls} locale="en-US"
  format={{ notation: "compact", maximumFractionDigits: 1 }} duration={350} />
```

## Accessibility and integration checks

- Screen readers can read the formatted target as a single number. The individual digit strips are hidden from assistive technology.

- With reduced motion or Motion off, each new value appears immediately.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/number-ticker/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
