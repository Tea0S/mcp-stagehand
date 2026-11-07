import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const GuildActor = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
});

export async function verificationPostHoneypotHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildActor.parse(args ?? {});
    const data = await client.postJson("/v1/stagehand/verification/post-honeypot-bait", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
    });
    return okJson({
      ...((data as object) || {}),
      note: "Requires honeypot_enabled + honeypot_channel_id in verification config first (guild_update section=verification).",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const TickerTestSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  feed_id: z.string().optional(),
});

export async function tickerTestPostHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = TickerTestSchema.parse(args ?? {});
    const data = await client.postJson("/v1/stagehand/ticker/test-post", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      feed_id: a.feed_id || "main",
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const DiceListSchema = z.object({
  guild_id: z.string().optional(),
  set_name: z.string().min(1),
  die_type: z.string().min(1),
});

export async function diceImagesListHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = DiceListSchema.parse(args);
    const data = await client.getJson("/v1/stagehand/dice-images/list", {
      guild_id: client.resolveGuildId(a.guild_id),
      set_name: a.set_name,
      die_type: a.die_type,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const DiceDeleteSchema = z.object({
  guild_id: z.string().optional(),
  set_name: z.string().min(1),
  die_type: z.string().min(1),
  face: z.string().min(1),
});

export async function diceImagesDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = DiceDeleteSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/dice-images/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      set_name: a.set_name,
      die_type: a.die_type,
      face: a.face,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const SceneDeleteSchema = z.object({
  guild_id: z.string().optional(),
  slot: z.string().min(1),
  preset_name: z.string().optional(),
  url: z.string().optional(),
});

export async function sceneImageDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = SceneDeleteSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/scene-images/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      slot: a.slot,
      preset_name: a.preset_name || "",
      url: a.url || undefined,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function emojiStatsHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = z.object({ guild_id: z.string().optional() }).parse(args ?? {});
    const data = await client.getJson("/v1/stagehand/emoji-stats", {
      guild_id: client.resolveGuildId(a.guild_id),
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const EmojiDeleteSchema = z.object({
  guild_id: z.string().optional(),
  emoji_ids: z.array(z.string().min(1)).min(1),
});

export async function emojisDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = EmojiDeleteSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/emojis/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      emoji_ids: a.emoji_ids,
    });
    return okJson({
      ...((data as object) || {}),
      note: "Deletes Discord server emoji via StageHand bot permissions (Manage Expressions). Confirm with the user first.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
