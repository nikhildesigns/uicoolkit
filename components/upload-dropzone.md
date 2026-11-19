# Upload Dropzone

Upload multiple files with a progress row for each. Retry an interrupted file, see why a file was rejected, and add more alongside completed uploads.

## Release

Version: 0.1.0. Status: experimental. License: MIT.

## Prerequisites

Use a TypeScript React app with Tailwind CSS 4, shadcn theme tokens and an initialized components.json. The app must already have its shadcn cn utility at the configured utils alias. UICoolKit does not replace that utility or install a required runtime package.

React 18.3/19 consumers are verified in Next.js and Vite using the version pairings documented at https://uicoolkit.com/compatibility.json. React 18 uses a compatible Next.js Pages Router fixture; React 19 uses App Router. Do not infer that every Next.js/React combination is supported.

## Install

Use the item URL returned by the current catalog. This example installs an immutable version:

~~~sh
npx shadcn@latest add https://uicoolkit.com/r/upload-dropzone/0.1.0.json
~~~

For namespaced use, configure @uicoolkit to https://uicoolkit.com/r/{name}.json in components.json first. Namespace aliases resolve the current release; immutable URLs are preferable for reproducible installs.

## Files and dependencies

- @ui/upload-dropzone.tsx

- @ui/upload-queue.ts

- @ui/upload-row.tsx

- @ui/upload-dropzone.md

Npm dependencies: lucide-react@1.61.0.

Pinned registry dependencies: none.

## Installed guide

This same version-matched guide installs beside the component at the configured ui alias as upload-dropzone.md. Read it and the local source before modifying an existing installation. It remains available offline; check current registry metadata only when discovering items or reviewing updates.

## Minimal working example

This example keeps state in the app; it does not imply a backend or durable persistence.

~~~tsx
"use client";

import { UploadDropzone } from "@/components/ui/upload-dropzone";

export default function UploadDropzoneExample() {
  return <UploadDropzone accept={{ "image/*": [".png", ".jpg"], "application/pdf": [".pdf"] }} maxFiles={5}
    upload={async (file, _progress, signal) => {
      const data = new FormData();
      data.append("attachment", file);
      const response = await fetch("/api/attachments", { method: "POST", body: data, signal });
      if (!response.ok) throw new Error("Upload failed");
    }} />;
}
~~~

## API and composition

| Part / property | Type | Default | Contract |
|---|---|---|---|
| upload | (file, onProgress, signal) => Promise<void> |  | Resolve when stored, reject with an error to enable retry. Report a fraction from 0 to 1 when known. Unmount aborts the signal. |
| accept | Record<string, readonly string[]> |  | Allowed MIME types, wildcards and filename extensions for both the picker and drops. Omit to allow all files. |
| maxFiles | number |  | Maximum accepted files per selection or drop. Extra files get individual rejection reasons. Earlier rows stay visible. |
| hint / disabled / motion | string / boolean / boolean |  | Describe restrictions, disable adding and retrying, or stop progress animations. |
| className / buttonClassName | string |  | Restyle the outer surface and browse button with host tokens. |
| renderRow | (entry, retry) => ReactNode |  | Compose custom rows with the filename, size, status, progress, message and retry action. |

## Supported states

- empty

- uploading

- error

- complete

## Integration

Provide an upload function that resolves after the transfer finishes and rejects on failure. Pass the abort signal to your transport. Report fractional progress when the transport provides it. The example expects your app to provide /api/attachments.

## Customization

Restyle the outer surface and browse button with host tokens.

```tsx
<UploadDropzone upload={saveAttachment}
  className="rounded-none bg-secondary" buttonClassName="rounded-full"
  renderRow={(entry, retry) => (
    <div>{entry.name} · {entry.message ?? entry.status}
      {entry.status === "failed" && <button type="button" onClick={retry}>Retry</button>}
    </div>
  )}
/>
```

## Accessibility and integration checks

- Browse files and Add more files open the native picker by keyboard.

- Progress bars have a filename and numeric value only when the host reports progress. A polite summary announces outcomes.

- Each failed upload has a named Retry button. Reduced motion disables bar transitions and pulsing.

Check multiple independent instances, keyboard/focus, touch, both themes, reduced motion, server rendering and your own async failure paths after restyling.

## Updates and conflicts

Read the installed version's history at https://uicoolkit.com/r/upload-dropzone/history.json. Review changelog, compatibility, migration notes and differences against your locally edited files before applying an update. Never silently overwrite existing source or use an overwrite flag without the consumer's explicit decision. There are no automatic source updates.

If setup or dependencies are missing, stop and fix the documented prerequisite before retrying. If a fetch or install fails, inspect what changed, retain the original files and report partial work. Installed source continues working without the registry.

## License

MIT. Dependencies retain their respective licenses.
