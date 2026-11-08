import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const ListGuildsSchema = z.object({
  query: z.string().optional(),
  name: z.string().optional(),
});

/**
 * List StageHand servers the caller can manage (display name + id).
 * Prefer this before asking the user for a guild snowflake.
 */
export async function listGuildsHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = ListGuildsSchema.parse(args ?? {});
    const q = (a.query || a.name || "").trim();
    const data = await client.getJson<{
      guilds?: Array<{ id?: string; name?: string }>;
      matched?: number;
      query?: string | null;
    }>(
      "/v1/stagehand/my-guilds",
      q ? { q } : undefined
    );
    const guilds = Array.isArray(data?.guilds) ? data.guilds : [];
    return okJson({
      ok: true,
      query: q || null,
      count: guilds.length,
      guilds: guilds.map((g) => ({
        id: String(g.id || ""),
        name: String(g.name || ""),
      })),
      hint:
        guilds.length === 1
          ? `Use guild_id=${guilds[0]?.id} for other tools.`
          : guilds.length === 0
            ? q
              ? "No manageable StageHand servers matched that name. Try a shorter substring, or list with no query."
              : "No manageable StageHand servers found for this account."
            : "Multiple matches — pick the id that matches the user's server name, then call list_channels / surface with that guild_id.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
