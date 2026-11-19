# Use with a coding agent

The UICoolKit skill teaches discovery, installation, integration, customization and verification using current documentation and the registry CLI. No MCP server is required.

## Set up once per project

Open your project in Codex, Claude Code, Cursor or another coding agent. Copy the [setup prompt](/docs/agents) and paste it into your agent. It saves the UICoolKit skill in your project. Start a new chat in the same project and ask it to build something with UICoolKit.

For manual setup, download the [skill](https://uicoolkit.com/skills/uicoolkit/SKILL.md) and its [MIT license](https://uicoolkit.com/skills/uicoolkit/LICENSE). Save both files in .agents/skills/uicoolkit/ for Codex or Cursor, .claude/skills/uicoolkit/ for Claude Code, or your client’s documented project skill directory. If your agent has no skill discovery, ask it to read the saved SKILL.md when you use UICoolKit.

## Information the skill reads

For a new installation, the agent fetches llms.txt and catalog.json, then the selected version’s Markdown guide and immutable manifest. The CLI installs <slug>.md beside the component source. For existing installations, the skill reads that local guide and actual local source first. Online history and current metadata are consulted when discovering items or reviewing an update; newer hosted docs do not silently replace the installed contract.

## Try the workflow

Ask the agent to discover a fitting UICoolKit item, read its current docs, inspect your app, install an immutable version and connect real content/state/actions. Ask for a meaningful restyle and motion-off behavior using documented hooks.

The agent must verify the result and distinguish tests it ran from device or visual checks still outstanding. If there is no available match, setup is missing or files conflict, it should report the actual issue and preserve work.

## Updates and optional MCP

Use the skill's update workflow to review changelogs and local modifications before replacing source. Existing shadcn MCP tools can help browse/install when configured; compatibility is tested separately and is never a prerequisite.
