import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const GuildOnly = z.object({ guild_id: z.string().optional() });
const GuildActor = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
});

export async function miaHiatusSurfaceHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildOnly.parse(args ?? {});
    const data = await client.getJson("/v1/stagehand/mia-hiatus/surface", {
      guild_id: client.resolveGuildId(a.guild_id),
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function miaHiatusMigrationModeHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildActor.extend({ mode: z.union([z.string(), z.number(), z.boolean()]) }).parse(args);
    const data = await client.postJson("/v1/stagehand/mia-hiatus/migration-mode", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      mode: a.mode,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function miaHiatusMiaEnabledHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildActor.extend({ enabled: z.boolean() }).parse(args);
    const data = await client.postJson("/v1/stagehand/mia-hiatus/mia-enabled", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      enabled: a.enabled,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const HiatusUpsertSchema = GuildActor.extend({
  user_id: z.string().optional(),
  player_name: z.string().optional(),
  character: z.string().optional(),
  kind: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  indefinite: z.boolean().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export async function miaHiatusHiatusUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = HiatusUpsertSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/mia-hiatus/hiatus/upsert", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      user_id: a.user_id || "",
      player_name: a.player_name || "",
      character: a.character || "",
      kind: a.kind || "",
      start: a.start || "",
      end: a.end || "",
      indefinite: a.indefinite ?? false,
      source: a.source || "mcp",
      notes: a.notes || "",
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const PlayerNameSchema = GuildActor.extend({
  player_name: z.string().min(1),
  source: z.string().optional(),
});

export async function miaHiatusHiatusEndHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = PlayerNameSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/mia-hiatus/hiatus/end", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      player_name: a.player_name,
      source: a.source || "mcp",
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function miaHiatusMiaClearHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = PlayerNameSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/mia-hiatus/mia/clear", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      player_name: a.player_name,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function miaHiatusMiaMarkHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = PlayerNameSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/mia-hiatus/mia/mark", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      player_name: a.player_name,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function miaHiatusPolicyUpdateHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildActor.extend({ patch: z.record(z.unknown()) }).parse(args);
    const data = await client.postJson("/v1/stagehand/mia-hiatus/policy/update", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      patch: a.patch,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

/** Staff/dashboard activity check-in (dual-auth). Not the MultiMuse-only ops touch route. */
export async function miaHiatusActivityTouchHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildActor.extend({
      user_id: z.string().min(1),
      player_name: z.string().optional(),
      source: z.string().optional(),
      channel_id: z.union([z.string(), z.number()]).optional(),
    }).parse(args);
    const data = await client.postJson("/v1/stagehand/mia-hiatus/activity/touch", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      user_id: a.user_id,
      player_name: a.player_name || "",
      source: a.source || "staff",
      channel_id: a.channel_id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function miaHiatusEventsHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = z
      .object({
        guild_id: z.string().optional(),
        user_id: z.string().optional(),
        player_name: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(args ?? {});
    const query: Record<string, string> = {
      guild_id: client.resolveGuildId(a.guild_id),
    };
    if (a.user_id) query.user_id = a.user_id;
    if (a.player_name) query.player_name = a.player_name;
    if (a.limit) query.limit = String(a.limit);
    const data = await client.getJson("/v1/stagehand/mia-hiatus/events", query);
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function miaHiatusSubmitConfigHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildActor.extend({
      mode: z.string().optional(),
      date_order: z.string().optional(),
      template_channel_id: z.union([z.string(), z.number(), z.null()]).optional(),
      channel_template_markdown: z.string().nullable().optional(),
    }).parse(args);
    const data = await client.postJson("/v1/stagehand/mia-hiatus/submit-config", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      mode: a.mode,
      date_order: a.date_order,
      template_channel_id: a.template_channel_id,
      channel_template_markdown: a.channel_template_markdown,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function miaHiatusPostStaffTemplateHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildActor.extend({ channel_id: z.union([z.string(), z.number()]) }).parse(args);
    const data = await client.postJson("/v1/stagehand/mia-hiatus/post-staff-template", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      channel_id: a.channel_id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
