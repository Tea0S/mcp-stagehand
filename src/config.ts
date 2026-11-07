import { config as dotenvConfig } from "dotenv";
import {
  applyArgvConfig,
  assertSafeBaseUrl,
} from "./security.js";

applyArgvConfig();
dotenvConfig();

/** Production StageHand API — players rarely need to override this. */
export const DEFAULT_STAGEHAND_API_URL = "https://control.multimuse.app";

export type AuthMode = "user_key" | "ops_token";

export type StagehandConfig = {
  controlPlaneUrl: string;
  /** Bearer: sh_… user key or CONTROL_PLANE_TOKEN */
  bearerToken: string;
  authMode: AuthMode;
  defaultGuildId: string | null;
  actorId: string | null;
};

export function resolveControlPlaneUrl(raw?: string | null): string {
  return assertSafeBaseUrl(
    (raw || process.env.CONTROL_PLANE_URL || DEFAULT_STAGEHAND_API_URL).trim(),
    "CONTROL_PLANE_URL",
    { allowLocalhostHttp: true, envFlagToAllowHttp: "MCP_ALLOW_HTTP" }
  );
}

/** Validate and normalize a user `sh_…` key. */
export function assertUserApiKey(raw: string): string {
  const userKey = (raw || "").trim();
  if (!userKey.startsWith("sh_")) {
    throw new Error(
      "API key must start with sh_ — create one at stagehand.quest → Dashboard → Me → AI helpers"
    );
  }
  if (userKey.length < 12) {
    throw new Error("API key looks too short — paste the full sh_… key");
  }
  return userKey;
}

/** Build config for one MCP session from a Bearer `sh_…` (hosted multi-tenant HTTP). */
export function configFromUserKey(opts: {
  apiKey: string;
  defaultGuildId?: string | null;
  controlPlaneUrl?: string | null;
  actorId?: string | null;
}): StagehandConfig {
  return {
    controlPlaneUrl: resolveControlPlaneUrl(opts.controlPlaneUrl),
    bearerToken: assertUserApiKey(opts.apiKey),
    authMode: "user_key",
    defaultGuildId: (opts.defaultGuildId || "").trim() || null,
    actorId: (opts.actorId || "").trim() || null,
  };
}

/**
 * Load process-env config for stdio / single-user HTTP.
 * Hosted multi-tenant HTTP does not call this — it uses `configFromUserKey` per session.
 */
export function loadConfig(): StagehandConfig {
  const controlPlaneUrl = resolveControlPlaneUrl();

  const userKey = (process.env.STAGEHAND_API_KEY || "").trim();
  const opsToken = (process.env.CONTROL_PLANE_TOKEN || "").trim();

  let bearerToken: string;
  let authMode: AuthMode;

  if (userKey) {
    bearerToken = assertUserApiKey(userKey);
    authMode = "user_key";
  } else if (opsToken) {
    if (opsToken.length < 16) {
      throw new Error(
        "Token looks too short. End users should set STAGEHAND_API_KEY (sh_…) from Dashboard → Me → AI helpers."
      );
    }
    bearerToken = opsToken;
    authMode = "ops_token";
  } else {
    throw new Error(
      "Set STAGEHAND_API_KEY (sh_… from stagehand.quest → Dashboard → Me → AI helpers)"
    );
  }

  const defaultGuildId =
    (process.env.STAGEHAND_DEFAULT_GUILD_ID || "").trim() || null;
  const actorId = (process.env.STAGEHAND_ACTOR_ID || "").trim() || null;

  return {
    controlPlaneUrl,
    bearerToken,
    authMode,
    defaultGuildId,
    actorId,
  };
}

/** True when HTTP should bind auth per request (public hosted gateway). */
export function isHostedHttpMode(): boolean {
  return !(process.env.STAGEHAND_API_KEY || "").trim() && !(process.env.CONTROL_PLANE_TOKEN || "").trim();
}
