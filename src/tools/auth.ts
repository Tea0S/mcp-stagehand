import { z } from "zod";
import { StagehandApiError, type StagehandClient } from "../client.js";
import { maskSecret } from "../security.js";
import { errText, okJson, type ToolResult } from "./types.js";

const AuthCheckSchema = z.object({
  guild_id: z.string().optional(),
});

/**
 * Verifies STAGEHAND_API_KEY (sh_…) or CONTROL_PLANE_TOKEN without exposing secrets.
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
          ? "Using STAGEHAND_API_KEY (end-user). Manage Server is checked live per guild."
          : "Using CONTROL_PLANE_TOKEN (ops). Prefer STAGEHAND_API_KEY for end users.",
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
            ? "Authenticated. User API key works and Manage Server (or owner/admin) was accepted for this guild."
            : "Authenticated. Control plane token accepted for this guild's channel list.";
      } else {
        try {
          await client.getJson("/v1/stagehand/surface", { guild_id: "0" });
          result.ok = true;
          result.checked = "surface";
          result.message = "Authenticated (unexpected success on guild 0).";
        } catch (e: unknown) {
          const status = e instanceof StagehandApiError ? e.status : undefined;
          if (status === 401 || status === 403) {
            result.ok = false;
            result.message =
              defaults.authMode === "user_key"
                ? "Key rejected (401/403). Re-mint at stagehand.quest → Dashboard → Me → Agent keys, and confirm Manage Server on the target guild."
                : "Token rejected (401/403). Re-copy CONTROL_PLANE_TOKEN from ops config.";
          } else if (status) {
            result.ok = true;
            result.checked = "surface_probe";
            result.http_status = status;
            result.message =
              "Credentials reached StageHand API (guild 0 expected to fail). Set STAGEHAND_DEFAULT_GUILD_ID for a full check.";
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
