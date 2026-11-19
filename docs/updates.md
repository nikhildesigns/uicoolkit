# Updates

UICoolKit installs editable source. Updates are explicit and must preserve your local modifications.

## Establish the baseline

Record the installed item and exact version. If the baseline is unknown, inspect project history or ask rather than guessing. Read the selected item's historyUrl, compatibility, changelog and migration instructions.

## Compare before applying

Compare the new immutable manifest with both the installed release and your local source. Review files, dependencies, public API and behavioral differences. Do not silently overwrite existing files or pass an overwrite flag without an explicit decision.

## Verify and recover

Merge reviewed changes, then run host type/build checks and test real interactions and customization. If an update or fetch fails, report partial changes and retain the original working source. Registry availability does not affect the continued use of downloaded source.
