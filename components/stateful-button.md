# Stateful Button

Show progress and announce the outcome of an async action. Keep a stable width across labels or animate the button to fit each state.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/stateful-button/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/stateful-button.tsx

- @ui/stateful-button.md

Npm dependencies: motion@14.6.0, lucide-react@1.61.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as stateful-button.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { StatefulButton } from "@/components/ui/stateful-button";

export default function StatefulButtonExample() {
  async function saveSettings() {
    const response = await fetch("/api/settings", { method: "POST", body: JSON.stringify({ compact: true }), headers: { "Content-Type": "application/json" } });
    if (!response.ok) throw new Error("Save failed");
  }
  return <StatefulButton action={saveSettings} labels={{ idle: "Save settings", success: "Saved" }} />;
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| action | () => Promise<unknown> |  | Resolve to confirm or reject to offer retry. Pending clicks are ignored. |
| status / defaultStatus | ButtonStatus |  | Drive the current state from your app or choose an initial state. |
| widthMode | "stable" \| "animated" | stable | Reserve the widest label and icon, or resize for each state. |
| labels / icons | Partial<Record<ButtonStatus, ReactNode>> |  | Replace state content. Pass null to remove an icon. |
| announcements | Partial<Record<'success' \| 'error', string>> |  | Override the spoken outcome for rich labels or a retry prompt. |
| motion / duration | boolean / number | true / 200 | Enable transitions and set their duration in milliseconds. Reduced motion disables animation. |
| resetAfter | number \| false | 1800 | Milliseconds to keep a successful result. False keeps it until the next action. |
| className | string |  | Styles the native button. Target data-state for state-specific styles. |

## Supported states

- idle

- loading

- success

- error

- disabled

## Integration

Connect the action to your save handler. Resolve after a successful write and reject on failure so the user can retry. The example expects your app to provide /api/settings.

## Customization

Styles the native button. Target data-state for state-specific styles.

```tsx
<StatefulButton
  action={upgradePlan}
  widthMode="animated"
  labels={{ idle: "Upgrade plan", loading: "Upgrading…", success: "Welcome aboard" }}
  className="rounded-full border bg-secondary font-mono text-secondary-foreground"
/>
```

## Accessibility and integration checks

- Enter and Space activate the native button. Loading keeps focus and prevents duplicate submissions.

- A polite status region announces the configured outcome.

- Reduced motion and Motion off stop transitions and the spinner.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/stateful-button/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
