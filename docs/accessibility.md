# Accessibility

Each item's documentation records its keyboard, focus, touch and reduced-motion behavior. Preserve that contract when changing content or styling.

## Interaction checks

- Keep accessible names, roles, descriptions and live announcements meaningful.
- Ensure every essential drag or hidden gesture has a visible keyboard/tap alternative.
- Preserve focus after actions, errors, cancellation and item movement.
- Keep pending, disabled, error and recovery states understandable.
- Use bottom sheets for phone overlays, with dismissal and focus on the sheet.
- Honor reduced motion without removing actions or content.

## Consumer responsibilities

Test real labels, content and callbacks in the app. Recheck contrast in both themes and verify assistive technology/device behavior after significant changes. The host owns authorization, data integrity and network recovery.
