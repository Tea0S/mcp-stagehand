import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const MailboxUpsertSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  index_data: z
    .object({
      channel_id: z.string().min(1),
      is_forum: z.boolean().optional(),
      text_header: z.string().optional(),
      thread_title: z.string().optional(),
      letter_prefix: z.string().nullable().optional(),
      list_emote: z.string().nullable().optional(),
      thread_opener_preset: z.string().optional(),
      thread_opener: z.string().optional(),
      clear_image: z.boolean().optional(),
    })
    .passthrough(),
});

export async function mailboxUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = MailboxUpsertSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/mailboxes/upsert", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      index_data: a.index_data,
    });
    return okJson({
      ...((data as object) || {}),
      note: "Mailbox index saved. Optional header: stagehand_upload_asset kind=mailbox_header. Then stagehand_mailbox_refresh.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const MailboxChannelSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  channel_id: z.string().min(1),
});

export async function mailboxDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = MailboxChannelSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/mailboxes/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      channel_id: a.channel_id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function mailboxRefreshHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = MailboxChannelSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/mailboxes/refresh", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      channel_id: a.channel_id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const OpenerPresetsSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  presets: z.unknown(),
});

export async function mailboxOpenerPresetsHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = OpenerPresetsSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/mailboxes/opener-presets", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      presets: a.presets,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
