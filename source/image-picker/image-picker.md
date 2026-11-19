# Image Picker

An image row whose picker takes a chosen, dropped or pasted file, a link or a library image. Your app stores it; the picker shows progress, Cancel and Retry.

## Release

Version: 0.2.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/image-picker/0.2.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/image-picker-parts.tsx

- @ui/image-picker-root.tsx

- @ui/image-picker-state.tsx

- @ui/image-picker.tsx

- @ui/image-picker.md

Npm dependencies: @base-ui/react@1.9.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as image-picker.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { useState } from "react";
import {
  ImagePicker, ImagePickerContent, ImagePickerError, ImagePickerField, ImagePickerLabel, ImagePickerLibrary,
  ImagePickerName, ImagePickerThumbnail, ImagePickerUrlInput, type ImageValue,
} from "@/components/ui/image-picker";

export default function ImagePickerExample() {
  const [image, setImage] = useState<ImageValue | null>(null);
  return (
    <ImagePicker label="Fill image" value={image} onValueCommit={setImage}>
      <ImagePickerField><ImagePickerLabel /><ImagePickerName /><ImagePickerThumbnail /></ImagePickerField>
      <ImagePickerContent>
        <ImagePickerLibrary><ImagePickerUrlInput /></ImagePickerLibrary>
        <ImagePickerError />
      </ImagePickerContent>
    </ImagePicker>
  );
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| value | { src, name?, width?, height? } \| null |  | The committed image, or null for none. Your app owns it. |
| mixed | boolean |  | The selection holds different images; the row shows Mixed. |
| onValueCommit | (value) => void |  | Called once per finished change: an upload, a link, a library image, or null when removed. |
| onUpload | (file, { signal, onProgress }) => Promise<image> |  | Stores the file and resolves with where it lives. Report progress from 0 to 1, and stop when the signal aborts. Without it, the picker commits a local object URL that lasts only for the session. |
| library | { src, name? }[] |  | Images your app already has, such as recent uploads or assets, shown as a grid. |
| accept / maxSize | string[] / number | PNG, JPEG, GIF, WebP, SVG | Allowed MIME types and the largest file in bytes. A file outside them shows a message and is not uploaded. |
| defaultOpen | boolean |  | Opens the picker on first render, such as right after a fill becomes an image. |
| disabled / readOnly / motion / container | boolean / HTMLElement |  | Turn off editing or opening; turn off transitions; portal the picker elsewhere. |
| ImagePickerField / Label / Name / Thumbnail | parts |  | The row: one button that opens the picker, with the label, the image's name (or Mixed, or Add image) and a small preview. |
| ImagePickerContent side / align / anchor | "bottom" \| "top" \| "left" \| "right" | "bottom" | Where the picker opens against the row; it flips rather than cover the row. A bottom sheet on phones. |
| ImagePickerLibrary columns / removable / children | number / boolean | 4 / true | The picker's grid, which doubles as its preview: an Upload tile, the file being uploaded (progress and ×), the current image when it is not in the library, then the library, with the current image marked. Drop files on it; Remove sits beside its heading, and children (such as the link field) sit between the heading and the grid. |
| ImagePickerDropArea / Actions | parts |  | A large drop area with Replace and Remove, for an image outside a panel, such as a cover image in a form. |
| ImagePickerError / UrlInput | parts |  | The last problem, with Retry for a failed upload; a field for a link. |
| messages | { empty, drop, choose, url, replace, remove, uploading, … } |  | Replace the picker's text, for example to translate it. |

## Supported states

- empty

- mixed

- read-only

- disabled

## Customization

The host owns storage and the committed image. Supply `onUpload` for file, drop and paste support. Honor its abort signal, report progress as a fraction, and return the stored image URL. Use the library prop for host-managed assets. Validate links in the host before saving them to your application. Keep the error part in the popup or drop area so a failed upload can be retried.

~~~tsx
<ImagePicker label="Cover" value={image} onValueCommit={setImage} onUpload={upload} motion={false} className="font-mono">
  <ImagePickerField className="rounded-none"><ImagePickerLabel /><ImagePickerName /><ImagePickerThumbnail /></ImagePickerField>
  <ImagePickerContent><ImagePickerLibrary><ImagePickerUrlInput /></ImagePickerLibrary><ImagePickerError /></ImagePickerContent>
</ImagePicker>
~~~

Verify link selection, cancellation, failed uploads and retry. On phones, confirm the picker fits the viewport and focus returns to its trigger when dismissed.

## Accessibility and integration checks

- The row is one button named after the image's label; the picker opens as a popover, or a bottom sheet on phones.

- Every source works from the keyboard: the Upload tile (or the empty drop area) opens the file dialog, and pasting an image or a link works while the row or picker has focus, which it takes when it opens.

- Upload progress is a progress bar with its value; errors are announced as alerts and describe the row and the link field.

- Library images are buttons named after each image, with the current one marked as pressed; an upload in progress has a named progress bar and a Cancel button.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/image-picker/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
