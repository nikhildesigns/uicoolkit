# Installation

Install editable React source into an existing Next.js or Vite app.

Using a coding agent? [Copy the project setup prompt](/docs/agents).

## Prepare the host

- Use TypeScript, Tailwind CSS 4 and shadcn theme tokens.
- Initialize shadcn for the host framework, preserving its existing design conventions.
- Check components.json aliases and the existing cn utility at the configured utils alias.
- Read current compatibility information before selecting framework/React pairings.

## Discover and inspect

Read https://uicoolkit.com/catalog.json for available items, exact versions, dependency lists and immutable manifest URLs. The registry catalog is https://uicoolkit.com/r/registry.json.

~~~sh
npx shadcn@latest view https://uicoolkit.com/r/inline-edit/0.1.3.json
npx shadcn@latest add https://uicoolkit.com/r/inline-edit/0.1.3.json
~~~

Use the package manager already used in the host app. Inspect existing files and dependency changes before accepting replacement. Do not overwrite the host utility or customized source silently.

Manifests declare exact direct dependencies. The CLI may save package ranges; inspect resolved versions in the lockfile and use your package manager’s exact-version option when your project requires exact package.json entries.

## Optional namespace

~~~json
{
  "registries": {
    "@uicoolkit": "https://uicoolkit.com/r/{name}.json"
  }
}
~~~

Merge this field into the existing components.json rather than replacing the file. Then use npx shadcn@latest add @uicoolkit/inline-edit. The namespace follows the latest alias; immutable URLs pin exact versions.

## Blocks and dependencies

Daily Task List is Free and composes Inline Edit, Context Menu and Sortable List. Its manifest resolves pinned versions of those items automatically. Read the Block's callback/data contract after installation.

## Manual fallback

Read the selected manifest, install its declared npm dependencies and copy every declared file to the corresponding configured alias. Resolve pinned registry dependencies too. Preserve relative sibling imports and use the host's existing utils alias. Do not copy previews or private project context.

## Installed documentation

Each current item installs <slug>.md beside its source at the configured ui alias. The file contains that installed version’s usage, API, customization, accessibility, dependencies and recovery guidance. Daily Task List installs its guide and the three dependency guides. Read the local guide and local source when customizing an installed component; they remain available without the registry.

## After installation

Render the documented minimal example, connect actual app callbacks and verify keyboard/focus, themes, phone behavior and reduced motion. Read customization and update guidance before adapting source extensively.
