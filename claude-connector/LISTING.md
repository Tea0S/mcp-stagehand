# Claude Connectors Directory — StageHand listing copy

Portal: https://claude.ai/directory/manage → Submit new → **MCP connector**  
Requires a **paid Claude plan** on the submitting account.

## Connection

- **MCP URL:** `https://mcp.stagehand.quest/mcp`
- **Auth:** OAuth 2.0 required (DCR + PKCE via https://stagehand.quest)
- Single shared URL (not per-customer URLs)

## Listing

| Field | Value |
|-------|--------|
| **Server name** | StageHand |
| **One-liner** (≤200) | Configure StageHand on Discord — indexes, lore, Flow Builder, forms, dice, and more. |
| **Description** (≤2000) | See below |
| **Categories** | Productivity, Developer tools, Communication (pick 1–5 as portal allows) |
| **Documentation** | https://stagehand.quest/docs/stagehand/ai-helpers |
| **Privacy policy** | https://stagehand.quest/privacy |
| **Support** | support@stagehand.quest |
| **Icon** | https://stagehand.quest/stagehand-logo.png |
| **Slug** | `stagehand` (permanent once published — confirm availability) |

### Description (paste)

StageHand is a Discord server-automation bot for roleplay communities. This connector links Claude to StageHand’s hosted MCP so you can configure indexes, lore panels, Flow Builder, forms, dice, mailboxes, scene, tickets, and related modules without leaving chat.

Sign in with Discord on stagehand.quest (OAuth). The helper only acts on servers where your Discord account has Manage Server (or Administrator / owner). It does not perform general Discord moderation such as kicks, bans, or arbitrary channel deletion.

Docs: https://stagehand.quest/docs/stagehand/ai-helpers  
Capabilities: https://stagehand.quest/docs/stagehand/ai-helper-capabilities  
Dashboard: https://stagehand.quest/dashboard/me  

### Use cases

- Primary: Discord / StageHand server setup and configuration via AI  
- Prerequisites: StageHand bot on the Discord server; Discord account with Manage Server; Claude with connectors enabled  
- Data: reads and writes StageHand guild config (not Discord moderation)

### Company

- **Name:** BackStagePass  
- **Website:** https://stagehand.quest  
- **Primary contact:** support@stagehand.quest  

### Authentication (portal)

- Requirement: **Required** (users must sign in)  
- Method: OAuth 2.0 with Dynamic Client Registration (Claude discovers AS from protected-resource metadata)  
- Authorization server: https://stagehand.quest  

### Test & launch (reviewer instructions)

1. Add custom connector URL `https://mcp.stagehand.quest/mcp` (or use directory listing once connected).  
2. Authenticate → Discord login on stagehand.quest → Allow.  
3. In chat: `Run stagehand_auth_check`.  
4. Optional: list channels / read surface on a guild where the reviewer has Manage Server.  
5. Test account: provide Tea-owned Discord credentials with Manage Server on a StageHand test guild (enter only in portal — never commit). Contact: support@stagehand.quest / https://discord.gg/nd6FUaBpaV  

### Allowed link URIs (optional)

```
https://stagehand.quest
https://mcp.stagehand.quest
https://discord.gg
```

## Pre-submit checklist

- [x] Remote HTTPS MCP  
- [x] OAuth 2.0  
- [x] Tool titles + readOnlyHint / destructiveHint on hosted server (redeploy mcp-stagehand after toolList annotations)  
- [ ] Tested as custom connector in Claude  
- [ ] Paid Claude plan on submitter  
- [ ] Reviewer test Discord account ready  
