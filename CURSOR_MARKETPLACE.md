# Submit StageHand to the Cursor Marketplace (staff)

Plugin package: [`cursor-plugin/`](cursor-plugin/)  
Multi-plugin index (this repo): [`.cursor-plugin/marketplace.json`](.cursor-plugin/marketplace.json)

## Prerequisites

- **Public GitHub repo** containing at least `cursor-plugin/` (this `mcp-stagehand` tree is not a git repo on Tea’s machine until you init/push — Cursor only indexes public remotes)
- Set `"repository"` in `cursor-plugin/.cursor-plugin/plugin.json` once the GitHub URL exists
- Reviewer can complete Discord OAuth at stagehand.quest (test account with Manage Server on a guild)
- Hosted MCP live: `https://mcp.stagehand.quest/mcp` + StageHand OAuth AS on stagehand.quest

## Checklist (Cursor)

- [x] `.cursor-plugin/plugin.json` under `cursor-plugin/` (`name`: `stagehand`)
- [x] `mcp.json` — URL-only remote MCP (OAuth Authenticate; no key variables)
- [x] `README.md` — install + Authenticate steps
- [x] `LICENSE` — MIT
- [x] Logo at `cursor-plugin/assets/logo.png`
- [x] Skill `skills/stagehand-setup`
- [ ] Pushed to public GitHub
- [ ] Submitted at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish)
- [ ] Provide reviewer notes: “Install → Authenticate → Discord login → Allow → ask `Run stagehand_auth_check`”

## Submit

1. Push `main` (or a release tag) including `cursor-plugin/` and root `.cursor-plugin/marketplace.json`.
2. Open [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish) while signed into Cursor.
3. Paste the **repository URL** (this monorepo is fine; marketplace.json lists `stagehand`).
4. In the description, say it is a company plugin for StageHand and how reviewers get a Discord login (support invite or Tea-provided test user).
5. Wait for Cursor’s manual review; re-index after updates.

## Local smoke (before submit)

1. Cursor Settings → allow local plugin import if needed.
2. Install from `cursor-plugin/` path **or** use Dashboard → Me → **Add to Cursor**.
3. Authenticate → `stagehand_auth_check` succeeds.
4. Confirm a key like `MCP · Cursor` appears under AI helpers (revocable).

## Do not

- Put `sh_` keys or `CONTROL_PLANE_TOKEN` in the plugin
- Add `${API_KEY}` variables for the marketplace OAuth path (Authenticate is intentional)
- Charge for the plugin listing (Cursor marketplace terms: free listing)
