# Submit StageHand to ChatGPT / Codex plugin directory (staff)

Package: [`openai-plugin/`](openai-plugin/)  
Portal: OpenAI Plugins (organization with Apps Management Write + verified identity)

## Build the ZIP

From repo root:

```powershell
cd F:\Development\mcp-stagehand
Compress-Archive -Path openai-plugin\* -DestinationPath stagehand-openai-plugin.zip -Force
```

Or zip the **contents** of `openai-plugin/` (plugin.json at ZIP root, not nested in an extra folder).

## Portal steps

1. Open Plugins → **Upload new or existing plugin** → choose verified Developer identity.
2. Upload `stagehand-openai-plugin.zip`.
3. **MCPs** → Connect `https://mcp.stagehand.quest/mcp`  
   - Auth: OAuth (DCR) — package declares authorize/token/register on stagehand.quest  
   - Complete **domain verification** for `mcp.stagehand.quest` / `stagehand.quest` as prompted  
   - Authenticate with a Discord user that has Manage Server on a StageHand guild  
   - Wait for tool scan; fix any findings (tool titles/annotations ship from hosted MCP)
4. Resolve Metadata & Skills issues if any; re-upload ZIP if needed.
5. Submit for review. After approval, **Publish** when ready.

## Listing copy (paste)

**Name:** StageHand  

**One-liner:** Configure StageHand on Discord from ChatGPT or Codex — indexes, lore, Flows, and more.  

**Description:**  
StageHand automates Discord roleplay servers (indexes, lore panels, Flow Builder, forms, dice, mailboxes, scene, tickets). This plugin connects to our hosted MCP at https://mcp.stagehand.quest/mcp. Sign in with Discord on stagehand.quest (OAuth). The helper only acts on servers where you have Manage Server. It is not a general Discord moderator.

**Docs:** https://stagehand.quest/docs/stagehand/ai-helpers  
**Privacy:** https://stagehand.quest/privacy  
**Support:** support@stagehand.quest · https://discord.gg/nd6FUaBpaV  
**Logo:** https://stagehand.quest/stagehand-logo.png  
**Repo:** https://github.com/Tea0S/mcp-stagehand  

## Reviewer instructions

1. Install the plugin / connect MCP.  
2. Complete OAuth → Discord login → Allow.  
3. Ask: `Run stagehand_auth_check`.  
4. Optional: configure a harmless index on a test guild with Manage Server.

## Prerequisites on our side

- [x] Hosted MCP + OAuth AS live  
- [x] Tool `title` + `readOnlyHint` / `destructiveHint` annotations  
- [ ] Domain verification completed in OpenAI portal  
- [ ] Organization verified for public publish  
