# StageHand for ChatGPT & Codex

OpenAI plugin package (Agent Plugins format) for StageHand’s hosted MCP.

**Docs:** https://stagehand.quest/docs/stagehand/ai-helpers  
**Privacy:** https://stagehand.quest/privacy  
**Support:** https://discord.gg/nd6FUaBpaV · support@stagehand.quest

## What it does

Lets ChatGPT / Codex configure StageHand on Discord servers where you have **Manage Server** (indexes, lore, Flows, forms, dice, and more). OAuth sign-in via Discord on stagehand.quest — no API key in the package.

## Install (directory)

After publication: install **StageHand** from the ChatGPT / Codex plugin directory, complete Authenticate, approve on stagehand.quest.

## Package layout

```
openai-plugin/
├── plugin.json
├── mcp.json          # streamable-http → mcp.stagehand.quest + OAuth
├── skills/stagehand-setup/
├── assets/logo.png
├── LICENSE
└── README.md
```

Staff submit notes: see `../OPENAI_PLUGIN.md`.
