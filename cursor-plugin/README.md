# StageHand for Cursor

Cursor plugin that connects to StageHand’s hosted MCP so the agent can help configure Discord servers (indexes, lore, Flows, forms, dice, and more).

**Docs:** [Connect an AI helper](https://stagehand.quest/docs/stagehand/ai-helpers) · [Capabilities](https://stagehand.quest/docs/stagehand/ai-helper-capabilities)

## Install

### From the Cursor Marketplace (when listed)

1. Open **Cursor Settings → Plugins** (or Customize).
2. Find **StageHand** and install.
3. Click **Authenticate** / **Connect** and sign in with Discord on stagehand.quest.
4. Approve access for servers where you have **Manage Server**.

### Local test (before marketplace approval)

1. In Cursor: Settings → Plugins → enable local plugin imports if required (Enterprise).
2. Point Cursor at this folder (`cursor-plugin/`), or use **Add to Cursor** from [Dashboard → Me → AI helpers](https://stagehand.quest/dashboard/me).
3. Authenticate when prompted.

No Node.js, no `npx`, and no API key paste for the OAuth path.

## What it can do

Configure StageHand modules on Discord guilds you manage. It is **not** a general Discord bot controller (no kick/ban/arbitrary channel deletes).

Try: `Run stagehand_auth_check`

## Privacy

- Auth uses Discord OAuth via stagehand.quest.
- Tokens are StageHand personal keys tied to your Discord user; revoke anytime under Dashboard → Me → AI helpers.
- Privacy / terms: [stagehand.quest](https://stagehand.quest)

## License

MIT — see the parent [mcp-stagehand](../LICENSE) repository (or `LICENSE` in this folder).

## Support

[Discord support server](https://discord.gg/nd6FUaBpaV)
