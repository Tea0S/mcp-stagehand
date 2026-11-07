# StageHand agent keys — server / ops setup

**Staff only** — never link this from player docs or the public site.

VPS side so end users can mint `sh_…` keys on stagehand.quest and use the **hosted** MCP at `https://mcp.stagehand.quest/mcp` (or local `npx` as a fallback). Players: [SETUP.md](SETUP.md) / [stagehand.quest/docs/stagehand/ai-helpers](https://stagehand.quest/docs/stagehand/ai-helpers).

## What must be running

| Piece | Role |
|-------|------|
| MultiMuse **control plane** (`multimuse-control-plane`, `:7070` / `control.multimuse.app`) | Dual auth (`CONTROL_PLANE_TOKEN` or `sh_…`), mint/list/revoke keys, StageHand writes |
| **stagehand-web** (Dokploy → stagehand.quest) | Dashboard → Me → AI helpers UI + BFF + one-click install links |
| **mcp-stagehand** (`mcp-stagehand` systemd, `mcp.stagehand.quest`) | Hosted multi-tenant Streamable HTTP MCP |
| StageHand bot token on CP (`STAGEHAND_BOT_TOKEN`) | Live Manage Server checks for user keys |
| Postgres (`MULTIMUSE_DATABASE_URL`) | Table `stagehand_user_api_keys` |

## 1. Database migration

On the MultiMuse host (same place you run other Alembic upgrades):

```bash
cd /path/to/MultiMuse   # repo with alembic/
# ensure MULTIMUSE_DATABASE_URL is set in the environment
alembic upgrade head
```

Migrations:

- `alembic/versions/20261107_0039_stagehand_user_api_keys.py` — `stagehand_user_api_keys`
- `alembic/versions/20261107_0040_stagehand_mcp_oauth.py` — MCP OAuth clients / codes / grants
- `alembic/versions/20261107_0041_stagehand_mcp_oauth_hardening.py` — refresh reuse + API key `expires_at`

Run `alembic upgrade head` so all are applied before enabling Authenticate.

## 2. Restart control plane

After pulling CP code that includes:

- `control_plane/app/stagehand_auth.py`
- `control_plane/app/stagehand_user_keys.py`
- `control_plane/app/routers/stagehand_user_keys.py`
- `control_plane/app/stagehand_mcp_oauth.py` + `routers/stagehand_mcp_oauth.py` (AS backing API)
- dual-auth on `/v1/stagehand/*`

```bash
sudo systemctl restart multimuse-control-plane
sudo systemctl status multimuse-control-plane --no-pager
```

Confirm env still has:

- `CONTROL_PLANE_TOKEN` (stagehand-web BFF mint path)
- `STAGEHAND_BOT_TOKEN` (guild Manage Server checks)
- `MULTIMUSE_DATABASE_URL`
- StageHand store URL / data path as today (`STAGEHAND_DATABASE_URL` when on Postgres JSON store)

Smoke (ops token):

```bash
curl -sS -H "Authorization: Bearer $CONTROL_PLANE_TOKEN" \
  "https://control.multimuse.app/v1/stagehand/user-api-keys?actorDiscordId=YOUR_DISCORD_ID"
```

Expect `{"keys":[…]}` (maybe empty).

## 3. Hosted MCP gateway (`mcp.stagehand.quest`)

Public URL players use: **`https://mcp.stagehand.quest/mcp`**

Each client sends `Authorization: Bearer sh_…` (minted on Me, or via StageHand OAuth Authenticate). Optional default guild: header `X-StageHand-Guild-Id`.  
Unauthenticated hosted `/mcp` returns `401` with `WWW-Authenticate` pointing at `/.well-known/oauth-protected-resource` (AS issuer: `https://stagehand.quest`). Optional env overrides: `MCP_RESOURCE_URL`, `MCP_AUTHORIZATION_SERVER`.  
**Do not** put `STAGEHAND_API_KEY` or `CONTROL_PLANE_TOKEN` in the host process env — hosted mode is multi-tenant and reads the Bearer per session.

### Install / build on the VPS

Put the app somewhere stable (not only `~/`), then build:

```bash
sudo mkdir -p /opt/mcp-stagehand
# If you already cloned into ~/mcp-stagehand:
sudo rsync -a --delete ~/mcp-stagehand/ /opt/mcp-stagehand/
cd /opt/mcp-stagehand
npm ci
npm run build
# Confirm the start file exists:
ls -la /opt/mcp-stagehand/build/index.js
```

### systemd unit

**Important:** `User=` must be a Linux account that already exists on the VPS.
On Tea’s box that is usually `ubuntu` (same login you SSH with).  
`User=stagehand` fails with `status=217/USER` if that account was never created.

`/etc/systemd/system/mcp-stagehand.service`:

```ini
[Unit]
Description=StageHand hosted MCP (Streamable HTTP)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/mcp-stagehand
Environment=NODE_ENV=production
Environment=CONTROL_PLANE_URL=https://control.multimuse.app
Environment=MCP_TRANSPORT=http
Environment=MCP_HTTP_HOST=127.0.0.1
Environment=MCP_HTTP_PORT=9080
# Leave STAGEHAND_API_KEY / CONTROL_PLANE_TOKEN / MCP_HTTP_GATE_TOKEN unset for public multi-tenant.
ExecStart=/usr/bin/node /opt/mcp-stagehand/build/index.js --transport http --host 127.0.0.1 --port 9080
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo nano /etc/systemd/system/mcp-stagehand.service   # paste the block above, save
sudo systemctl daemon-reload
sudo systemctl enable --now mcp-stagehand
sudo systemctl status mcp-stagehand --no-pager
```

Local health:

```bash
curl -sS http://127.0.0.1:9080/healthz
# {"ok":true,"service":"mcp-stagehand","mode":"hosted_multi_tenant"}
```

Auth smoke (with a real `sh_…` key):

```bash
curl -sS -X POST http://127.0.0.1:9080/v1/auth-check \
  -H "Authorization: Bearer sh_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### nginx + DNS

Point **`mcp.stagehand.quest`** at this VPS (same IP as your other StageHand API hostnames).

Add an nginx site (Certbot for HTTPS after DNS works), e.g. `/etc/nginx/sites-available/mcp-stagehand`:

```nginx
server {
    listen 80;
    server_name mcp.stagehand.quest;

    location / {
        proxy_pass http://127.0.0.1:9080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # MCP streamable HTTP can be long-lived:
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/mcp-stagehand /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# After DNS points here:
sudo certbot --nginx -d mcp.stagehand.quest
```

Public checks:

```bash
curl -sS https://mcp.stagehand.quest/healthz
curl -sS -X POST https://mcp.stagehand.quest/v1/auth-check \
  -H "Authorization: Bearer sh_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

After code updates:

```bash
cd /opt/mcp-stagehand && git pull && npm ci && npm run build
# or rsync from ~/mcp-stagehand again, then:
sudo systemctl restart mcp-stagehand
```

## 4. Redeploy stagehand-web

Push/merge the Me AI helpers one-click UI + docs, then let Dokploy rebuild `ghcr.io/tea0s/stagehand-web:main`.

Env on the web app (unchanged pattern):

- `CONTROL_PLANE_URL=https://control.multimuse.app` (or internal URL)
- `CONTROL_PLANE_TOKEN=…` (never expose to browsers)

Optional (defaults match production):

- `NEXT_PUBLIC_STAGEHAND_MCP_URL=https://mcp.stagehand.quest/mcp`

Verify while logged in: **https://stagehand.quest/dashboard/me** → **AI helpers** → Create key → **Add to Cursor** / Codex copy blocks appear.

## 5. Optional: single-user HTTP (private tunnel)

For a personal ChatGPT tunnel without the public host, run with a process key:

```bash
export CONTROL_PLANE_URL=https://control.multimuse.app
export STAGEHAND_API_KEY=sh_…
export STAGEHAND_DEFAULT_GUILD_ID=…
export MCP_HTTP_GATE_TOKEN=long-random   # require X-MCP-Gate (or Bearer gate in single-user mode)
node build/index.js --transport http --host 127.0.0.1 --port 8080
```

## 6. Rollback notes

- Revoke user keys from the dashboard (soft revoke in DB).
- Stop the public gateway: `sudo systemctl stop mcp-stagehand`.
- To disable user-key auth temporarily: revoke all rows / set `is_active = false` on CP.
- Dropping the table: only via Alembic downgrade if you intentionally roll back `20261107_0039`.

## Checklist

- [ ] `alembic upgrade head`
- [ ] `systemctl restart multimuse-control-plane`
- [ ] `mcp-stagehand` enabled; `https://mcp.stagehand.quest/healthz` OK
- [ ] stagehand-web redeployed with one-click install
- [ ] Create key on `/dashboard/me` → Add to Cursor / Codex
- [ ] `stagehand_auth_check` succeeds with `auth_mode: "user_key"`
