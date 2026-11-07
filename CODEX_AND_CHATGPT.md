# Codex + ChatGPT (detail)

Canonical player guide: [https://stagehand.quest/docs/stagehand/ai-helpers](https://stagehand.quest/docs/stagehand/ai-helpers)

Prefer the **hosted** helper — no Node, no tunnel.

## Codex (hosted)

1. Key from [Dashboard → Me → AI helpers](https://stagehand.quest/dashboard/me) (or use **Copy Codex config**)
2. Add to `%USERPROFILE%\.codex\config.toml`:

```toml
[mcp_servers.stagehand]
url = "https://mcp.stagehand.quest/mcp"
enabled = true
http_headers = { Authorization = "Bearer sh_PASTE_YOUR_KEY" }
```

Optional: `"X-StageHand-Guild-Id" = "YOUR_DISCORD_SERVER_ID"` inside `http_headers`.

3. `codex mcp list` → new chat → **Run stagehand_auth_check**

## ChatGPT (hosted)

1. ChatGPT → Settings → Apps / Connectors → Developer mode
2. Add MCP URL: `https://mcp.stagehand.quest/mcp`
3. If the UI allows custom headers: `Authorization: Bearer sh_…`

No personal tunnel required.

## Advanced: local npx (Codex)

```toml
[mcp_servers.stagehand]
command = "npx"
args = ["-y", "mcp-stagehand"]
enabled = true

[mcp_servers.stagehand.env]
STAGEHAND_API_KEY = "sh_PASTE_YOUR_KEY"
STAGEHAND_DEFAULT_GUILD_ID = "YOUR_DISCORD_SERVER_ID"
```

Until the package is on npm, use a local build:

```toml
command = "node"
args = ["F:\\Development\\mcp-stagehand\\build\\index.js"]
```

## Advanced: single-user HTTP + tunnel

Only if you are not using `mcp.stagehand.quest`:

```powershell
$env:STAGEHAND_API_KEY = "sh_…"
$env:STAGEHAND_DEFAULT_GUILD_ID = "…"
npx -y mcp-stagehand --transport http --host 127.0.0.1 --port 8080
```

Tunnel `http://127.0.0.1:8080` → public `https://…/mcp` → ChatGPT connector.  
Optional: `MCP_HTTP_GATE_TOKEN` + header `X-MCP-Gate`.
