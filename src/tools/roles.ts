import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const RolesSyncSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  list_key: z.string().optional(),
});

export async function rolesSyncHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = RolesSyncSchema.parse(args ?? {});
    const data = await client.postJson("/v1/stagehand/roles/sync", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      list_key: a.list_key || undefined,
    });
    return okJson({
      ...((data as object) || {}),
      note: "Discord roles synced from StageHand lists. Save config via stagehand_guild_update section=roles first if lists are new.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const RolesPanelSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  panel_key: z.string().min(1),
});

export async function rolesPostPanelHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = RolesPanelSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/roles/panel/post", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      panel_key: a.panel_key,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
