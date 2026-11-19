# Layers Panel

A design tool's layer tree with frames nested to any depth. Search by name, select like a canvas, rename in place, drag layers between frames, and hide or lock them.

## Release

Version: 0.2.0. Status: experimental. License: MIT.

## Migration

Remove messages.count from message overrides. Replace useLayersPanel().total with a count derived from the app-owned layer tree. To keep a count in the header, render it as a LayersPanelHeader child.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/layers-panel/0.2.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/layers-panel-children.tsx

- @ui/layers-panel-root.tsx

- @ui/layers-panel-row.tsx

- @ui/layers-panel-state.tsx

- @ui/layers-panel-tree.tsx

- @ui/layers-panel.tsx

- @ui/layers-panel.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: context-menu@0.1.2, inline-edit@0.1.3.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as layers-panel.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import {
  LayersPanel, LayersPanelEmpty, LayersPanelHeader, LayersPanelIcon, LayersPanelName, LayersPanelSearch,
  LayersPanelTree, moveLayer, type LayersPanelLayer,
} from "@/components/ui/layers-panel";

const initial: LayersPanelLayer[] = [
  { id: "home", name: "Home", children: [{ id: "title", name: "Title" }] },
  { id: "settings", name: "Settings" },
];

export default function LayersPanelExample() {
  const [layers, setLayers] = useState(initial);
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <LayersPanel
      className="h-64"
      layers={layers}
      selected={selected}
      onSelectedChange={setSelected}
      onMove={move => setLayers(current => moveLayer(current, move))}
    >
      <LayersPanelHeader />
      <LayersPanelSearch />
      <LayersPanelTree>
        {layer => <><LayersPanelIcon kind={layer.children ? "frame" : "text"} /><LayersPanelName /></>}
      </LayersPanelTree>
      <LayersPanelEmpty />
    </LayersPanel>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| layers | { id, name, children?, hidden?, locked? }[] |  | The top-level layers, each holding its own children to any depth. The panel never changes them itself. |
| selected / onSelectedChange | string[] / (ids) => void |  | The selected ids, and the selection a click asks for: one layer, Cmd/Ctrl to add or remove, Shift for a range of visible layers. |
| onRename / validate | (layer, name) => void \| Promise |  | Saves a new name; a rejected promise keeps editing with an error. Omit onRename to turn renaming off. |
| onMove | ({ layer, from, to }) => void |  | Saves a finished move, within a frame or into another, once per drop or key press. moveLayer(layers, move) applies it to your tree. Moving pauses while searching. |
| onHiddenChange / onLockedChange | (layer, value) => void |  | Show and save the hide and lock toggles. Active toggles stay visible; others appear on hover or focus. |
| actions | (layer) => ReactNode |  | Extra right-click menu items for a layer, after Rename, the moves and the toggles. |
| defaultCollapsed | string[] |  | Ids of layers whose children start collapsed. |
| childrenStatus | "unloaded" \| "loading" \| "failed" |  | Set on a layer whose children your app loads on demand. It shows a chevron before they exist; clear it once they load. |
| onExpandedChange / onRetryChildren | (layer, expanded) => void / (layer) => void |  | Report each open or close, for loading children, and add Retry to a group that failed to load. |
| LayersPanelTree / Icon / Name / Toggles / Status | parts |  | The scrolling tree and its row parts. Icon shows the layer's kind and becomes the drag handle on hover. rowClassName styles every row through its data-selected, data-hidden, data-locked and data-drop attributes. |
| disabled / motion / container | boolean / HTMLElement |  | Turn off every interaction; turn off transitions (reduced motion is always honored); portal menus and tooltips elsewhere. |
| messages | { label, search, empty, noResults, … } |  | Replace the panel's text, for example to translate it. |

## Supported states

- empty

- error

- disabled

## Customization

Use stable IDs for every layer, including descendants. Keep selection and the layer tree in app state. Apply move requests with `moveLayer` or the host's equivalent tree operation. Persist rename, visibility and lock in their respective callbacks. Render app-specific row content alongside the supplied name, icon and toggle parts.

~~~tsx
<LayersPanel layers={layers} selected={selected} onSelectedChange={select} className="h-72 rounded-none font-mono" motion={false}>
  <LayersPanelSearch />
  <LayersPanelTree>{() => <LayersPanelName />}</LayersPanelTree>
  <LayersPanelEmpty />
</LayersPanel>
~~~

For large or remote trees, set `childrenStatus: "unloaded"` on a group and load its children from `onExpandedChange`. Set it to `"loading"` or `"failed"` while that runs, pass `onRetryChildren` to offer Retry, and clear it once `children` is ready. An empty frame without a status has no chevron.

Preserve focus and test a keyboard move between frames, filtering, and the locked-layer restriction alongside pointer dragging.

## Accessibility and integration checks

- The panel is a region named “Layers”; the search field is a labelled search box, and Escape clears it.

- Each name is a toggle button that reports whether the layer is selected; F2 or a double click renames it.

- Frames have disclosure buttons named “Expand” or “Collapse”; collapsed layers are inert, so Tab skips them.

- Groups that load on demand announce loading and failure, and Retry names the group.

- Hide and lock are toggle buttons with the layer's name; they are also in the right-click menu.

- Moving never needs a drag: on the handle, Up and Down move among siblings, Left moves out of the frame and Right into the frame above; the menu offers the same moves. Each move is announced.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/layers-panel/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
