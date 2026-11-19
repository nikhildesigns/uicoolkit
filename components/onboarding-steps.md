# Onboarding Steps

Name a workspace, optionally invite a teammate, and choose a starting point. The playground saves your progress on this device.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/onboarding-steps/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/onboarding-steps.tsx

- @ui/onboarding-steps.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as onboarding-steps.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { OnboardingSteps, emptyWorkspaceSetup } from "@/components/ui/onboarding-steps";

export default function OnboardingStepsExample() {
  const [setup, setSetup] = useState(emptyWorkspaceSetup);
  return <OnboardingSteps value={setup} onChange={setSetup} />;
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| value / onChange | WorkspaceSetup / (next: WorkspaceSetup) => void |  | Control the step, workspace name, teammate email and starting point. Save changes in your app to support resuming. |
| onComplete | (value: WorkspaceSetup) => void |  | Receive the final choices when Finish is pressed. The host handles workspace creation and invitations. |
| onReset | () => void |  | Called after Start over restores the empty setup. |
| motion | boolean | true | Animate step changes and progress unless reduced motion is preferred. |
| className | string |  | Style the card and override its primary color, foreground and corner radius with theme tokens. |

## Supported states

- step 1

- step 2

- step 3

- done

## Integration

Store the setup value in your app to resume after navigation. Handle workspace creation and optional invitations in the completion callback. Start over is the point to clear saved progress.

## Customization

Style the card and override its primary color, foreground and corner radius with theme tokens.

```tsx
<OnboardingSteps value={setup} onChange={saveProgress}
  onComplete={finishSetup} onReset={clearProgress} motion={false} />
```

## Accessibility and integration checks

- An ordered list identifies the current step. Forward, Back and Start over move focus to the heading.

- Inline errors describe the focused input. Skip for now bypasses the optional email field.

- Starting points use native radio buttons. Reduced motion makes progress and step changes instant.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/onboarding-steps/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
