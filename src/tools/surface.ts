import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const GuildOnlySchema = z.object({
  guild_id: z.string().optional(),
});

export async function getSurfaceHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const { guild_id } = GuildOnlySchema.parse(args ?? {});
    const data = await client.getJson(
      "/v1/stagehand/surface",
      client.surfaceQuery(guild_id)
    );
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function listChannelsHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const { guild_id } = GuildOnlySchema.parse(args ?? {});
    const guildId = client.resolveGuildId(guild_id);
    const data = await client.getJson("/v1/stagehand/channels", { guild_id: guildId });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function listEmojisHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const { guild_id } = GuildOnlySchema.parse(args ?? {});
    const guildId = client.resolveGuildId(guild_id);
    const data = await client.getJson("/v1/stagehand/emojis", { guild_id: guildId });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
