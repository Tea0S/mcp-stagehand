#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { parseCli } from "./cli.js";
import { isHostedHttpMode, loadConfig } from "./config.js";
import { startHttpTransport } from "./httpTransport.js";
import { StagehandMCPServer } from "./server.js";

async function main() {
  const cli = parseCli();

  if (cli.transport === "http") {
    const gateToken = (process.env.MCP_HTTP_GATE_TOKEN || "").trim() || null;

    if (isHostedHttpMode()) {
      // Public gateway: each session sends Authorization: Bearer sh_…
      await startHttpTransport({
        port: cli.port,
        host: cli.host,
        gateToken,
      });
      return;
    }

    const config = loadConfig();
    await startHttpTransport({
      port: cli.port,
      host: cli.host,
      gateToken,
      sharedConfig: config,
    });
    return;
  }

  const config = loadConfig();
  const mcp = new StagehandMCPServer(config);
  const transport = new StdioServerTransport();
  await mcp.mcpServer.connect(transport);
}

main().catch((err) => {
  console.error("Failed to start mcp-stagehand:", err instanceof Error ? err.message : err);
  process.exit(1);
});
