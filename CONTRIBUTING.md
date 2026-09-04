# Contributing to UICoolKit

Thank you for helping make UICoolKit more useful, reliable and pleasant to use.

UICoolKit is currently in early development. Until the initial scaffold and validation commands are published, please open an issue before preparing a component or code contribution.

## Before Starting

1. Search existing issues and pull requests.
2. Open or comment on an issue before starting substantial work.
3. Confirm that the proposal belongs in the free public library.
4. Keep the change focused on one component, behavior or documentation concern.

## Public Contribution Boundary

Appropriate public contributions include:

- Approved free components and supporting utilities.
- Public registry metadata.
- Component previews and examples.
- Tests and accessibility improvements.
- Customer-facing documentation.

Do not submit:

- Paid or Pro component source.
- Credentials, license keys, environment files or private registry configuration.
- Internal planning, pricing discussions or operational documents.
- Generated source maps or machine-specific agent state.

This repository is a curated public distribution of UICoolKit. Maintainers may incorporate an accepted contribution into the canonical development source before it appears in a later public export. Avoid broad file moves or architectural rewrites unless they have been discussed first.

## Component Contribution Contract

Once component contributions open, a new component should arrive as one coherent change containing:

- Component source and any explicitly required public dependencies.
- Public registry metadata.
- A realistic preview and usage example.
- Tests for meaningful behavior and edge cases.
- Documentation for installation, props, accessibility and known constraints.

Every applicable component should cover keyboard and focus behavior, responsive layouts, light and dark themes, reduced motion, SSR safety and relevant loading, empty, error, retry, disabled and success states.

## Project Checks

The application has not been scaffolded, so there are no supported local setup or validation commands yet. This section will be updated alongside the first runnable source release. Do not introduce an undocumented package manager or parallel build workflow in a pull request.

## Pull Requests

- Use a fork or focused feature branch.
- Follow Conventional Commits with an imperative subject, such as `feat: add upload progress interaction`.
- Explain the user problem and the behavior being introduced.
- Include screenshots or recordings for visual changes when applicable.
- State which checks were run and which verification remains manual.
- Keep unrelated formatting and refactors out of the change.

By contributing, you agree that your contribution may be distributed under the repository's [MIT License](./LICENSE).
