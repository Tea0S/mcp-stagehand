---
name: stagehand-setup
description: Configure StageHand Discord bots via the StageHand MCP — indexes, lore panels, Flow Builder, forms, roles, dice, mailboxes, scene, tickets. Use when the user asks to set up or change StageHand on a Discord server.
---

# StageHand setup

You talk to StageHand through MCP tools (hosted at `mcp.stagehand.quest`). Auth is the user's Discord account via OAuth — they must have **Manage Server** on the target guild.

## Before changing anything

1. Call `stagehand_auth_check` and confirm success.
2. If the user names a server, call `stagehand_list_guilds` with that name (or a short substring) — **do not** ask for a guild id or channel link first.
3. Call `stagehand_list_channels` / `stagehand_list_indexes` / surface tools to resolve forums and channels **by name** (indexes live under surface `config`).
4. Ask only for assets the tools cannot discover (image uploads, ambiguous duplicates).

## Good requests

- Forum / channel indexes
- Lore panels and snippets
- Flow Builder flows (nodes from the catalog)
- Claim pools (`stagehand_list_claims` / `stagehand_lookup_claim` / `stagehand_muse_claims`)
- Forms, mailboxes, scene, tickets, dice presets, roles

## Hard limits

- Do **not** attempt general Discord moderation (kick, ban, delete arbitrary channels).
- Do **not** invent guild or channel ids — ask or discover via StageHand surface tools.
- Prefer the smallest change that matches what the user asked for.

## After edits

Summarize what was saved and where to see it (StageHand dashboard on stagehand.quest, or the Discord channel/forum affected).
