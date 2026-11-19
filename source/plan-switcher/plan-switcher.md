# Plan Switcher

Switch billing periods to compare prices, annual savings and included features. Choose a plan when you’re ready.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/plan-switcher/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/plan-switcher.tsx

- @ui/plan-switcher.md

Npm dependencies: none beyond the host React/shadcn setup.

Pinned registry dependencies: number-ticker@0.1.0.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as plan-switcher.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import { PlanSwitcher, type BillingPeriod, type PlanSelection } from "@/components/ui/plan-switcher";

export default function PlanSwitcherExample() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [current, setCurrent] = useState<PlanSelection>({ planId: "starter", period: "monthly" });
  return <PlanSwitcher plans={[
    { id: "starter", name: "Starter", monthlyPrice: 12, annualPrice: 108, features: ["1 workspace", "3 projects"] },
    { id: "studio", name: "Studio", monthlyPrice: 29, annualPrice: 288, features: ["5 workspaces", "Unlimited projects"], featured: true },
  ]} period={period} onPeriodChange={setPeriod} currentPlan={current} onChoose={setCurrent} />;
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| plans | readonly PricingPlan[] |  | Supply an ID, name, feature list, monthly charge and full annual charge in major currency units. Set featured to highlight a plan independently of the current subscription. |
| period / onPeriodChange | BillingPeriod / (period: BillingPeriod) => void |  | Control the monthly or yearly comparison independently of the current subscription. |
| currentPlan / onChoose | PlanSelection / (selection: PlanSelection) => void |  | Mark the current plan ID and billing period. An explicit choice sends both values to your app. |
| currency / locale | string / string | USD / en-US | Format prices, annual charges and savings for your customers. |
| motion / className | boolean / string |  | Toggle price and switch animations, or style the block and its theme tokens. |

## Supported states

- monthly

- yearly

## Integration

Supply the full annual charge and one-month charge for each plan in major currency units. Comparing periods only changes the displayed prices. Send an explicit choice through the host billing flow and update the current subscription after confirmation.

## Customization

Toggle price and switch animations, or style the block and its theme tokens.

```tsx
<PlanSwitcher plans={plans} period={period} onPeriodChange={setPeriod}
  currentPlan={subscription} onChoose={handlePlanChoice} />
```

## Accessibility and integration checks

- The billing-period radios support Tab, arrow keys and visible keyboard focus. One polite status region announces the new prices per switch.

- Each card names the plan, lists its features and labels its action. Motion off and reduced motion display new values immediately.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/plan-switcher/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
