# Connect StageHand to your AI helper

Player-facing guide (same content): [https://stagehand.quest/docs/stagehand/ai-helpers](https://stagehand.quest/docs/stagehand/ai-helpers)

**You do not need Node.js** for the normal path. StageHand hosts the helper at `https://mcp.stagehand.quest/mcp`.

The helper can configure most StageHand modules (forms, roles, dice, indexes, lore, Flows, …). It will ask for channel/role ids and image files when needed. It does **not** do general Discord moderation — see [capabilities](https://stagehand.quest/docs/stagehand/ai-helper-capabilities).

## 1. Open AI helpers

1. [stagehand.quest/dashboard/me](https://stagehand.quest/dashboard/me) → **AI helpers**
2. Optional: pick a default Discord server

## 2. Connect (prefer sign-in)

- **Add to Cursor** — install, then **Authenticate** and sign in with Discord on stagehand.quest (no key paste)
- **Copy OAuth MCP JSON** — URL-only config for Claude / other OAuth MCP apps
- Or **Create key** → **Copy Codex config** / **Copy MCP JSON** for apps that need a Bearer header

Example Codex table (replace the key):

```toml
[mcp_servers.stagehand]
url = "https://mcp.stagehand.quest/mcp"
enabled = true
http_headers = { Authorization = "Bearer sh_PASTE_YOUR_KEY" }
```

Optional default guild header: `"X-StageHand-Guild-Id" = "YOUR_DISCORD_SERVER_ID"`.

## 3. Verify

Ask: `Run stagehand_auth_check` — expect ok / authenticated.

## Advanced: local npx (optional)

Only if you prefer a local process:

- [Node.js](https://nodejs.org/) 18+
- Cursor / Claude config with `command: "npx"`, `args: ["-y", "mcp-stagehand"]`, env `STAGEHAND_API_KEY=sh_…`

See [CODEX_AND_CHATGPT.md](CODEX_AND_CHATGPT.md) for older local-HTTP / tunnel notes.
