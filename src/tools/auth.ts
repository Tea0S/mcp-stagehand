import { z } from "zod";
import { StagehandApiError, type StagehandClient } from "../client.js";
import { maskSecret } from "../security.js";
import { errText, okJson, type ToolResult } from "./types.js";

const AuthCheckSchema = z.object({
  guild_id: z.string().optional(),
});

/**
 * Verifies the session Bearer (OAuth-minted sh_… or pasted key / CONTROL_PLANE_TOKEN).
 *
 * Important: never probe guild_id "0". User-key auth runs a live Manage Server check
 * whenever guild_id is present, so guild 0 returns 403 and looked like a bad credential.
 */
export async function authCheckHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = AuthCheckSchema.parse(args ?? {});
    const defaults = client.defaults;
    const result: Record<string, unknown> = {
      ok: false,
      control_plane_url: defaults.controlPlaneUrl,
      auth_mode: defaults.authMode,
      token_fingerprint: client.tokenFingerprint(),
      default_guild_id: defaults.guildId,
      default_actor_id: defaults.actorId ? maskSecret(defaults.actorId) : null,
      note:
        defaults.authMode === "user_key"
          ? "Session uses an end-user sh_… Bearer (from OAuth Authenticate or a pasted key). Manage Server is checked live per guild. Do not ask for a second key if OAuth already completed."
          : "Using CONTROL_PLANE_TOKEN (ops). End users should Authenticate via StageHand OAuth instead.",
    };

    try {
      const guildId = a.guild_id || defaults.guildId;
      if (guildId) {
        await client.getJson("/v1/stagehand/channels", { guild_id: guildId });
        result.ok = true;
        result.checked = "channels";
        result.guild_id = guildId;
        result.message =
          defaults.authMode === "user_key"
            ? "Authenticated. Session Bearer works and Manage Server (or owner/admin) was accepted for this guild."
            : "Authenticated. Control plane token accepted for this guild's channel list.";
      } else {
        // Prefer dedicated whoami (no guild). Fall back to surface without guild_id:
        // auth middleware accepts GET without guild; missing query → 422 means Bearer OK.
        try {
          const who = await client.getJson<{
            ok?: boolean;
            authKind?: string;
            actorId?: string | null;
          }>("/v1/stagehand/whoami");
          result.ok = true;
          result.checked = "whoami";
          result.auth_kind = who?.authKind ?? defaults.authMode;
          if (who?.actorId) {
            result.actor_id_fingerprint = maskSecret(String(who.actorId));
          }
          result.message =
            "Authenticated. OAuth/API key is valid. Pass a guild_id to also verify Manage Server.";
        } catch (e: unknown) {
          const status = e instanceof StagehandApiError ? e.status : undefined;
          if (status === 404) {
            try {
              await client.getJson("/v1/stagehand/surface");
              result.ok = false;
              result.message = "Unexpected surface success without guild_id.";
            } catch (e2: unknown) {
              const status2 =
                e2 instanceof StagehandApiError ? e2.status : undefined;
              if (status2 === 422 || status2 === 400) {
                result.ok = true;
                result.checked = "surface_no_guild";
                result.http_status = status2;
                result.message =
                  "Authenticated. Bearer accepted by StageHand. Pass a guild_id to also verify Manage Server.";
              } else if (status2 === 401) {
                result.ok = false;
                result.http_status = 401;
                result.message =
                  defaults.authMode === "user_key"
                    ? "Bearer rejected (401). Re-run Authenticate in your AI app (or revoke + reconnect). Only paste a Dashboard → Me key if this host has no OAuth."
                    : "Token rejected (401). Re-copy CONTROL_PLANE_TOKEN from ops config.";
              } else if (status2 === 403) {
                result.ok = false;
                result.http_status = 403;
                result.message =
                  "Credential reached StageHand but was forbidden (403). Re-Authenticate; if it persists, contact support.";
              } else {
                throw e2;
              }
            }
          } else if (status === 401) {
            result.ok = false;
            result.http_status = 401;
            result.message =
              defaults.authMode === "user_key"
                ? "Bearer rejected (401). Re-run Authenticate in your AI app (or revoke + reconnect). Only paste a Dashboard → Me key if this host has no OAuth."
                : "Token rejected (401). Re-copy CONTROL_PLANE_TOKEN from ops config.";
          } else {
            throw e;
          }
        }
      }
    } catch (e: unknown) {
      const status = e instanceof StagehandApiError ? e.status : undefined;
      result.ok = false;
      result.http_status = status ?? null;
      result.message = e instanceof Error ? e.message : String(e);
    }

    return okJson(result);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
