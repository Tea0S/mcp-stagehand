import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express, { type Request, type Response } from "express";
import { configFromUserKey, type StagehandConfig } from "./config.js";
import { StagehandClient } from "./client.js";
import { StagehandMCPServer } from "./server.js";
import { authCheckHandler } from "./tools/auth.js";

const GUILD_HEADER = "x-stagehand-guild-id";

/** Public MCP resource URL (OAuth protected-resource metadata). */
const MCP_RESOURCE_URL =
  (process.env.MCP_RESOURCE_URL || "").trim() ||
  "https://mcp.stagehand.quest/mcp";

/** Authorization server issuer advertised to MCP clients. */
const MCP_AUTHORIZATION_SERVER =
  (process.env.MCP_AUTHORIZATION_SERVER || "").trim() ||
  "https://stagehand.quest";

const OAUTH_RESOURCE_METADATA_URL = (() => {
  try {
    const u = new URL(MCP_RESOURCE_URL);
    return `${u.origin}/.well-known/oauth-protected-resource`;
  } catch {
    return "https://mcp.stagehand.quest/.well-known/oauth-protected-resource";
  }
})();

type SessionEntry = {
  transport: StreamableHTTPServerTransport;
  /** Keep server alive for the session lifetime (handlers close over it). */
  mcp: StagehandMCPServer;
};

function sendHostedUnauthorized(
  res: Response,
  error: string,
  status = 401
): void {
  // RFC 9728 — clients discover AS via resource_metadata URL.
  res.setHeader(
    "WWW-Authenticate",
    `Bearer realm="stagehand", resource_metadata="${OAUTH_RESOURCE_METADATA_URL}"`
  );
  res.status(status).json({ error });
}

export type HttpTransportOpts = {
  port: number;
  host: string;
  /** Optional outer gate (private tunnels). Use X-MCP-Gate when hosted multi-tenant. */
  gateToken?: string | null;
  /**
   * Single-user HTTP: process-env config applied to every new session.
   * Omit for hosted multi-tenant (Bearer sh_… required per initialize).
   */
  sharedConfig?: StagehandConfig | null;
};

function parseBearer(req: Request): string | null {
  const auth = String(req.headers.authorization || "");
  const m = /^Bearer\s+(\S+)$/i.exec(auth);
  return m ? m[1].trim() : null;
}

function parseGuildHeader(req: Request): string | null {
  const raw = req.headers[GUILD_HEADER];
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (v || "").trim() || null;
}

function checkOuterGate(req: Request, gate: string, hosted: boolean): boolean {
  if (!gate) return true;
  const headerGate = String(req.headers["x-mcp-gate"] || "");
  if (headerGate === gate) return true;
  // Single-user tunnels may still send the gate as Bearer.
  if (!hosted) {
    const auth = String(req.headers.authorization || "");
    if (auth === `Bearer ${gate}`) return true;
  }
  return false;
}

/**
 * Streamable HTTP transport.
 * - Hosted (no sharedConfig): each session requires Authorization: Bearer sh_…
 * - Single-user (sharedConfig from env): new session server cloned from that config;
 *   optional MCP_HTTP_GATE_TOKEN via X-MCP-Gate or Bearer
 */
export async function startHttpTransport(
  opts: HttpTransportOpts
): Promise<{ close: () => Promise<void> }> {
  const app = express();
  app.use(express.json({ limit: "4mb" }));

  const transports = new Map<string, SessionEntry>();
  const gate = (opts.gateToken || "").trim();
  const hosted = !opts.sharedConfig;

  app.get("/healthz", (_req, res) => {
    res.json({
      ok: true,
      service: "mcp-stagehand",
      mode: hosted ? "hosted_multi_tenant" : "single_user",
    });
  });

  /** RFC 9728 — MCP clients discover the StageHand OAuth AS from here. */
  app.get("/.well-known/oauth-protected-resource", (_req, res) => {
    res.json({
      resource: MCP_RESOURCE_URL,
      authorization_servers: [MCP_AUTHORIZATION_SERVER],
      bearer_methods_supported: ["header"],
      scopes_supported: ["stagehand"],
    });
  });

  /** Ops / dashboard smoke test without a full MCP client. */
  app.post("/v1/auth-check", async (req, res) => {
    if (!checkOuterGate(req, gate, hosted)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      let config: StagehandConfig;
      if (hosted) {
        const bearer = parseBearer(req);
        if (!bearer) {
          sendHostedUnauthorized(
            res,
            "Missing Authorization Bearer sh_… key (or Authenticate via StageHand OAuth)"
          );
          return;
        }
        try {
          config = configFromUserKey({
            apiKey: bearer,
            defaultGuildId: parseGuildHeader(req),
          });
        } catch (e) {
          sendHostedUnauthorized(
            res,
            e instanceof Error ? e.message : "Invalid API key"
          );
          return;
        }
      } else if (opts.sharedConfig) {
        config = opts.sharedConfig;
      } else {
        res.status(500).json({ error: "Server misconfigured" });
        return;
      }
      const client = new StagehandClient(config);
      const guildId =
        typeof req.body?.guild_id === "string" ? req.body.guild_id : undefined;
      const toolResult = await authCheckHandler({ guild_id: guildId }, client);
      const text =
        toolResult.content?.[0]?.type === "text" ? toolResult.content[0].text : "";
      let payload: unknown = { raw: text };
      try {
        payload = JSON.parse(text);
      } catch {
        /* keep raw */
      }
      res.status(toolResult.isError ? 400 : 200).json(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.all("/mcp", async (req: Request, res: Response) => {
    if (!checkOuterGate(req, gate, hosted)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const sessionId = String(req.headers["mcp-session-id"] || "");
      let entry = sessionId ? transports.get(sessionId) : undefined;

      if (!entry) {
        if (req.method === "POST" && isInitializeRequest(req.body)) {
          let sessionConfig: StagehandConfig;

          if (hosted) {
            const bearer = parseBearer(req);
            if (!bearer) {
              sendHostedUnauthorized(
                res,
                "Missing Authorization: Bearer sh_… — Authenticate in your AI app, or create a key at stagehand.quest → Dashboard → Me → AI helpers"
              );
              return;
            }
            try {
              sessionConfig = configFromUserKey({
                apiKey: bearer,
                defaultGuildId: parseGuildHeader(req),
              });
            } catch (e) {
              sendHostedUnauthorized(
                res,
                e instanceof Error ? e.message : "Invalid API key"
              );
              return;
            }
          } else {
            sessionConfig = opts.sharedConfig!;
          }

          const mcp = new StagehandMCPServer(sessionConfig);
          let entryRef: SessionEntry | undefined;

          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
              if (entryRef) transports.set(id, entryRef);
            },
          });

          entryRef = { transport, mcp };
          entry = entryRef;
          transport.onclose = () => {
            const id = transport.sessionId;
            if (id) transports.delete(id);
          };

          await mcp.mcpServer.connect(transport);
        } else if (sessionId) {
          res.status(400).json({ error: "Unknown MCP session" });
          return;
        } else {
          res.status(400).json({ error: "Expected initialize request" });
          return;
        }
      }

      await entry.transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error(
        "mcp-stagehand HTTP error:",
        err instanceof Error ? err.message : err
      );
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  const httpServer = await new Promise<import("node:http").Server>((resolve) => {
    const s = app.listen(opts.port, opts.host, () => resolve(s));
  });

  console.error(
    `mcp-stagehand HTTP listening on http://${opts.host}:${opts.port}/mcp` +
      (hosted ? " (hosted multi-tenant: Bearer sh_ required)" : " (single-user)") +
      (gate ? " (outer gate via X-MCP-Gate)" : "")
  );

  return {
    close: async () => {
      for (const { transport } of transports.values()) {
        await transport.close().catch(() => undefined);
      }
      transports.clear();
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}
