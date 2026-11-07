---
name: stagehand-setup
description: Configure StageHand Discord bots via the StageHand MCP — indexes, lore panels, Flow Builder, forms, roles, dice, mailboxes, scene, tickets. Use when the user asks to set up or change StageHand on a Discord server.
---

# StageHand setup

You talk to StageHand through MCP tools (hosted at `mcp.stagehand.quest`). Auth is the user's Discord account via OAuth — they must have **Manage Server** on the target guild.

## Before changing anything

1. Call `stagehand_auth_check` and confirm success.
2. Call `stagehand_setup_requirements` (or the surface/list tools) so you know which guild, channels, and roles are in play.
3. Ask the user for missing Discord snowflake ids (channel, role, forum) and image uploads when a tool requires them.

## Good requests

- Forum / channel indexes
- Lore panels and snippets
- Flow Builder flows (nodes from the catalog)
- Forms, mailboxes, scene, tickets, dice presets, roles

## Hard limits

- Do **not** attempt general Discord moderation (kick, ban, delete arbitrary channels).
- Do **not** invent guild or channel ids — ask or discover via StageHand surface tools.
- Prefer the smallest change that matches what the user asked for.

## After edits

Summarize what was saved and where to see it (StageHand dashboard on stagehand.quest, or the Discord channel/forum affected).
