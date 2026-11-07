/** Shared auth / safety helpers — never log or return raw secrets. */

export function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function maskSecret(value: string | null | undefined): string {
  const s = (value || "").trim();
  if (!s) return "(empty)";
  if (s.length <= 8) return "****";
  return `${s.slice(0, 4)}…${s.slice(-4)} (len ${s.length})`;
}

export function redactSecrets(text: string, secrets: Array<string | null | undefined>): string {
  let out = text;
  for (const secret of secrets) {
    const s = (secret || "").trim();
    if (s.length < 8) continue;
    out = out.split(s).join("[REDACTED]");
  }
  // Common bearer leaks in JSON error echoes
  out = out.replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [REDACTED]");
  out = out.replace(/\bbd_[A-Za-z0-9]+/g, "bd_[REDACTED]");
  return out;
}

export type UrlCheckOptions = {
  /** Allow http://127.0.0.1 and http://localhost for SSH tunnels / local CP */
  allowLocalhostHttp?: boolean;
  envFlagToAllowHttp?: string;
};

export function assertSafeBaseUrl(
  raw: string,
  label: string,
  opts: UrlCheckOptions = {}
): string {
  const url = trimSlash(raw.trim());
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }

  const allowHttp =
    process.env[opts.envFlagToAllowHttp || ""] === "1" ||
    process.env.MCP_ALLOW_HTTP === "1";

  if (parsed.protocol === "https:") {
    return url;
  }

  if (parsed.protocol === "http:") {
    const host = parsed.hostname.toLowerCase();
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host === "::1";
    if ((opts.allowLocalhostHttp !== false && isLocal) || allowHttp) {
      return url;
    }
    throw new Error(
      `${label} must use https:// (got http). For local tunnels set MCP_ALLOW_HTTP=1 or use localhost.`
    );
  }

  throw new Error(`${label} must be http(s); got ${parsed.protocol}`);
}

export function requireNonEmpty(name: string, value: string | null | undefined): string {
  const v = (value || "").trim();
  if (!v) throw new Error(`${name} is required`);
  return v;
}

/** Apply JSON --config from argv (Smithery / npx style) into process.env. */
export function applyArgvConfig(argv: string[] = process.argv): void {
  const idx = argv.indexOf("--config");
  if (idx === -1 || idx + 1 >= argv.length) return;
  const raw = argv[idx + 1];
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const [key, val] of Object.entries(parsed)) {
      if (val === undefined || val === null) continue;
      const envKey = key.includes("_") ? key : camelToEnv(key);
      if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
        process.env[envKey] = String(val);
      }
    }
  } catch {
    // Non-JSON --config: ignore here; package-specific loaders may treat as token
  }
}

function camelToEnv(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toUpperCase();
}

export function getArg(argv: string[], name: string): string | null {
  const idx = argv.indexOf(name);
  if (idx === -1 || idx + 1 >= argv.length) return null;
  return argv[idx + 1];
}
