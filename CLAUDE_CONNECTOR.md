# Submit StageHand to Claude Connectors Directory (staff)

Listing copy: [`claude-connector/LISTING.md`](claude-connector/LISTING.md)

## Before opening the portal

1. **Redeploy mcp-stagehand** with tool annotations (`title`, `readOnlyHint` / `destructiveHint`) — Claude’s Tools step flags missing annotations.
2. Smoke as a **custom connector** in Claude Desktop / claude.ai:  
   URL `https://mcp.stagehand.quest/mcp` → Authenticate → `stagehand_auth_check`.
3. Have icon, docs, privacy, support email, and a reviewer Discord test account.

## Submit

1. Open https://claude.ai/directory/manage (paid Claude plan).  
2. **Submit new** → **MCP connector**.  
3. Paste connection URL and follow portal steps 1–10 using `claude-connector/LISTING.md`.  
4. Confirm every tool ran (portal Test & launch acknowledgment).  
5. Complete compliance checkboxes and submit.

Escalations: mcp-review@anthropic.com  

## After publish

MCP tool changes are live from the hosted server; listing metadata edits go through the portal.
