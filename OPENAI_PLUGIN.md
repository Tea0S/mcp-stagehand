# ChatGPT / Codex — how StageHand becomes discoverable

**Uploading the ZIP does not list StageHand publicly.**  
Upload only creates a **private draft** in your OpenAI org. Users cannot find it until you finish MCP connect + review + **Publish**.

```text
ZIP upload  →  draft (only you)
     ↓
Fix automated checks (metadata / skills / MCP scan)
     ↓
Submit for review (+ reviewer Discord test account, test cases, video)
     ↓
OpenAI approves
     ↓
You click Publish  →  appears in ChatGPT & Codex plugin directory
```

Until Publish, people still connect the hard way: custom MCP URL `https://mcp.stagehand.quest/mcp` + OAuth (Dashboard → Me → AI helpers).

---

## What you need before starting

| Need | Why |
|------|-----|
| OpenAI **organization** where you’re owner (or Apps Management Write) | Portal access |
| **Verified** publisher identity | **Individual** → listing shows your personal name. **Business** → listing shows the company (e.g. Tea House). Directory “By …” is from this identity, not the ZIP. |
| Hosted MCP live + OAuth | `mcp.stagehand.quest` + `stagehand.quest` Discord consent |
| MCP tools annotated | Redeploy mcp-stagehand with `title` / readOnly / destructive |
| Discord **test account** with Manage Server on a StageHand guild | Reviewers (no MFA / magic-link preferred) |
| Short **walkthrough video** URL | Required for MCP review |
| Package ZIP | `openai-plugin/` contents |

---

## Step 0 — Build the ZIP

On your machine (repo root):

```powershell
cd F:\Development\mcp-stagehand
Remove-Item stagehand-openai-plugin.zip -ErrorAction SilentlyContinue
Compress-Archive -Path openai-plugin\* -DestinationPath stagehand-openai-plugin.zip -Force
```

ZIP root must contain `plugin.json`, `mcp.json`, and `assets/logo.png` + `assets/icon.png` directly (not nested under an extra `openai-plugin/` folder).

Branding lives in `extensions.com.openai` (`logo`, `composerIcon`, `displayName`, …) and the Codex overlay `.codex-plugin/plugin.json` `interface` block. If the portal shows a blank icon after upload, re-ZIP and use **Upload plugin** / **Upload new version** on the existing draft (v1.0.1+).

---

## Step 1 — Open the Plugins portal and upload (draft only)

1. Sign into ChatGPT / OpenAI platform as the org that will own the plugin.
2. Open **Plugins** (plugin directory / developer plugins area — “Upload new or existing plugin”).
3. Pick your **verified Developer identity**.
4. Upload `stagehand-openai-plugin.zip`.
5. You land on a **plugin detail / draft** page.  
   **Still not public.**

---

## Step 2 — Clear automated checks

### A. Metadata & Skills

1. Open **Metadata & Skills**.
2. Wait for checks. Fix any Issues (edit files under `openai-plugin/`, bump version if needed, re-ZIP, **Upload plugin** again).
3. Skills scan must pass before you can submit.

### B. Connect MCP and scan tools (this is the hard part)

1. Open **MCPs** → select **stagehand** → **Connect**.
2. Confirm URL: `https://mcp.stagehand.quest/mcp`.
3. Auth should show **OAuth** (from our `mcp.json`: authorize / token / register on stagehand.quest). Prefer **DCR** (dynamic client registration) — we expose `/oauth/register`.
4. **Domain verification** (portal shows a token):  
   Host **exact plain text** at:

   `https://mcp.stagehand.quest/.well-known/openai-apps-challenge`  

   (or an eligible parent host the portal allows, e.g. `stagehand.quest` if offered)

   Return **only** the token string — no JSON, no HTML.  
   On our VPS this usually means nginx (or the MCP app) serving that path. Do this before Connect succeeds.

5. Click Connect / authorize with your **test Discord** user → complete StageHand Allow.
6. Wait for the **tool scan**. Open Issues; fix server-side problems (redeploy MCP), then **Rescan**.
7. Resolve “Complete MCP setup” errors before submit.

**Note:** The portal will **not** accept pasting a Bearer `sh_` key for directory setup. OAuth only for this path.

---

## Step 3 — Review materials (required for MCP plugins)

In **Review information → Review details** (credentials stay private; test cases can live in the ZIP later):

1. **Reviewer credentials** — dedicated Discord test login + “sign in with Discord on stagehand.quest during OAuth”; Manage Server on a StageHand test guild; no MFA if possible.
2. **Five positive test cases** — example:

   | # | Prompt | Expected |
   |---|--------|----------|
   | 1 | Run stagehand_auth_check | ok / authenticated |
   | 2 | List channels for guild … | channel list |
   | 3 | Get StageHand surface for guild … | surface JSON |
   | 4 | Explain setup requirements for indexes | requirements / asks for forum id |
   | 5 | (harmless) upsert/update a test index with real forum_id | success |

3. **Three negative cases** — e.g. “kick a user”, “delete a Discord channel”, “configure a guild I don’t manage” → should refuse / fail auth.
4. **Video walkthrough** — record Auth + auth_check + one read tool; host on YouTube/unlisted Drive; paste URL.
5. **Release notes** — “1.0.0 initial StageHand MCP plugin”.

Save details.

---

## Step 4 — Submit for review

1. Select the draft → **Submit for review**.
2. Complete policy attestations.
3. Track **Review status** on the Plugins page; watch email for feedback.
4. Only one active review per plugin. Rejected → fix → new ZIP / details → resubmit.

---

## Step 5 — Publish (this is when it’s discoverable)

The ChatGPT page with **+ Install plugin** is still **your** draft/workspace view — that is not global publish.

1. Finish MCP connect + review materials (steps 2–4).
2. **Submit for review** → wait for approval email / Review status.
3. When status is **approved**, open that package version → **Publish plugin**.
4. **Now** it can appear in the public ChatGPT / Codex plugin directory.

After publish, hosted MCP tool changes are scanned by OpenAI (often daily); metadata/skills changes need a new ZIP + review/publish.

### Hide personal name / use an org (“By Tea House”)

You cannot obfuscate the name in the ZIP. OpenAI sets **Developer** from the **verified identity** you pick at upload:

1. Open [OpenAI Platform settings](https://platform.openai.com/settings) → complete **Business verification** for Tea House / BackStagePass (legal business details as OpenAI asks).
2. When uploading (or re-uploading) the plugin, choose that **business** Developer identity — not your individual verification.
3. Re-upload if the draft was created under the personal identity (or start a new plugin under the business identity).

`developerName` in the package is advisory; the directory line is the verified identity.

---

## Shortcut while waiting for approval

Users don’t need the directory:

1. [stagehand.quest/dashboard/me](https://stagehand.quest/dashboard/me) → AI helpers  
2. Copy OAuth MCP JSON / add URL `https://mcp.stagehand.quest/mcp` in ChatGPT Developer / Connectors  
3. Authenticate with Discord  

Same backend as the future directory listing.

---

## Ops checklist (Tea)

- [ ] Redeploy mcp-stagehand (tool annotations)
- [ ] Redeploy control plane (ChatGPT OAuth redirect allowlist) if not already
- [ ] Serve `/.well-known/openai-apps-challenge` when portal gives the token
- [ ] Org verified in OpenAI
- [ ] Test Discord account ready
- [ ] Record walkthrough video
- [ ] Upload ZIP → Connect MCP → Submit → wait → **Publish**
