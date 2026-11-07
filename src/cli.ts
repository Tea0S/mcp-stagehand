/** Shared CLI flag parsing for stdio vs HTTP transports. */

export type TransportKind = "stdio" | "http";

export type CliOptions = {
  transport: TransportKind;
  port: number;
  host: string;
};

export function parseCli(argv: string[] = process.argv): CliOptions {
  const transportRaw = (getArg(argv, "--transport") || process.env.MCP_TRANSPORT || "stdio")
    .trim()
    .toLowerCase();
  const transport: TransportKind = transportRaw === "http" ? "http" : "stdio";

  const portRaw = getArg(argv, "--port") || process.env.MCP_HTTP_PORT || "8080";
  const port = Math.max(1, parseInt(portRaw, 10) || 8080);

  const host = (
    getArg(argv, "--host") ||
    process.env.MCP_HTTP_HOST ||
    (transport === "http" ? "127.0.0.1" : "127.0.0.1")
  ).trim();

  return { transport, port, host };
}

function getArg(argv: string[], name: string): string | null {
  const idx = argv.indexOf(name);
  if (idx === -1 || idx + 1 >= argv.length) return null;
  return argv[idx + 1];
}
