# UICoolKit Public Repository — Agent Guide

UICoolKit is a source-delivered React UI library for thoughtfully animated product interactions. This repository contains only the approved free library and its public supporting material.

## Current State

This repository contains the current Free source under `source/<slug>/`, public manifests under `r/` and the catalog at `catalog.json`. Use the catalog to find installable items and versioned guides.

## Scope

Eligible public work includes:

- Free MIT-licensed components and public utilities.
- Registry metadata for those free components.
- Public previews, examples and tests.
- Customer-facing documentation and GitHub workflow files.

Never add:

- Pro or paid component source.
- Private registry logic or entitlement configuration.
- Credentials, license keys, secrets or environment files.
- Internal plans, pricing material, memory files or private working context.
- Source maps or machine-local agent, worktree and exploration state.

This repository is a curated public distribution. Accepted changes may be synchronized into a separate canonical development source before a later export. Do not reorganize the repository broadly without prior discussion.

## Before Editing

1. Read [README.md](./README.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).
2. Inspect the current tree and package scripts instead of assuming the stack is already scaffolded.
3. Search for an existing component, utility or registry entry before adding another.
4. Keep the change within the free public boundary.

## Component Contract

Every applicable component should include:

- TypeScript and a small, documented public API.
- React 18/19 compatibility in Next.js and Vite consumers.
- Keyboard, focus and semantic accessibility.
- Responsive and light/dark behavior.
- Reduced-motion support for transform-based animation.
- SSR and hydration safety.
- Relevant loading, empty, error, retry, disabled and success states.
- A realistic preview, usage documentation and behavior-focused tests.

Prefer shared motion and design tokens once they exist. Avoid one-off animation values when an established token fits. Animate transform and opacity where practical, and do not make decorative motion essential to understanding or operating the interface.

## Registry and Public API Safety

- Treat published component slugs, registry URLs and documented props as public contracts.
- Keep component source, registry metadata, preview, tests and documentation synchronized in the same change.
- Include every public dependency required by copied source.
- Never make a free component depend on Pro source or a private service.

## Verification

Verify source edits in a supported React consumer and follow the contribution guide. Report visual or manual verification separately from automated checks.

Before committing, inspect every staged path and scan for private content. The public diff must contain only files intended for customers and contributors.

## Commits and Pull Requests

- Use Conventional Commits: `<type>: <imperative subject>`.
- Keep commits and pull requests focused.
- Do not add AI attribution or `Co-Authored-By` lines unless a maintainer explicitly requests them.
- Include screenshots or recordings for visual changes when applicable.
