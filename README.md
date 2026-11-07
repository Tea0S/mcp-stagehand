# mcp-stagehand

Let AI helpers (Codex, ChatGPT, Claude, Cursor) configure **StageHand** — indexes, lore, Flows, forms, roles, dice, mailboxes, scene, tickets, and most other dashboard modules.

**Players:** [Connect an AI helper](https://stagehand.quest/docs/stagehand/ai-helpers) · [What it can do](https://stagehand.quest/docs/stagehand/ai-helper-capabilities) · [SETUP.md](SETUP.md)  
**Staff (VPS):** [SERVER.md](SERVER.md) · **Staff (npm):** [PUBLISH.md](PUBLISH.md)

Version **1.3** covers the full dual-auth StageHand setup surface (not Discord moderation). Agents should call `stagehand_setup_requirements` and ask for missing images/ids.

## Quick start (hosted — no Node)

1. Open [Dashboard → Me → AI helpers](https://stagehand.quest/dashboard/me)
2. Click **Add to Cursor** → **Authenticate** and sign in with Discord (preferred), **or** create a key and copy Codex / MCP JSON
3. Ask the assistant: `Run stagehand_auth_check`

Hosted URL: `https://mcp.stagehand.quest/mcp` (OAuth Authenticate, or `Authorization: Bearer sh_…`)

**Cursor Marketplace plugin** (package + submit notes): [`cursor-plugin/`](cursor-plugin/) · [CURSOR_MARKETPLACE.md](CURSOR_MARKETPLACE.md)

```toml
[mcp_servers.stagehand]
url = "https://mcp.stagehand.quest/mcp"
enabled = true
http_headers = { Authorization = "Bearer sh_YOUR_KEY" }
```

## Advanced: local npx

```toml
[mcp_servers.stagehand]
command = "npx"
args = ["-y", "mcp-stagehand"]
enabled = true

[mcp_servers.stagehand.env]
STAGEHAND_API_KEY = "sh_YOUR_KEY"
STAGEHAND_DEFAULT_GUILD_ID = "YOUR_GUILD_ID"
```

## License

MIT
