import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const GuildOnly = z.object({ guild_id: z.string().optional() });

export async function challengesExportHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildOnly.parse(args ?? {});
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.getJson("/v1/stagehand/challenges/export", {
      guild_id: guildId,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const ChallengesImportSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
  data: z.unknown().optional(),
});

export async function challengesImportHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = ChallengesImportSchema.parse(args);
    const body = a.payload || (typeof a.data === "object" && a.data ? a.data : args);
    const data = await client.postJson("/v1/stagehand/challenges/import", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      ...(typeof body === "object" && body ? body : {}),
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const ChallengesCopySchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  source_guild_id: z.string().min(1),
});

export async function challengesCopyHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = ChallengesCopySchema.parse(args);
    const data = await client.postJson("/v1/stagehand/challenges/copy-from", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      source_guild_id: a.source_guild_id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const ChallengesPostFinishSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  channel_id: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

export async function challengesPostFinishHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = ChallengesPostFinishSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/challenges/post-finish-button", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      channel_id: a.channel_id,
      ...(a.payload || {}),
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function iftttPendingListHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildOnly.parse(args ?? {});
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.getJson("/v1/stagehand/ifttt/pending-reminders", {
      guild_id: guildId,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const IftttCancelSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  reminder_id: z.string().min(1).optional(),
  id: z.string().min(1).optional(),
});

export async function iftttPendingCancelHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = IftttCancelSchema.parse(args);
    const rid = a.reminder_id || a.id;
    if (!rid) return errText("reminder_id required");
    const data = await client.postJson("/v1/stagehand/ifttt/pending-reminders/cancel", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      reminder_id: rid,
      id: rid,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function dicePresetsLiveHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildOnly.parse(args ?? {});
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.getJson(
      `/v1/stagehand/live/guilds/${guildId}/dice-presets`
    );
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function calendarLiveHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildOnly.parse(args ?? {});
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.getJson(`/v1/stagehand/live/guilds/${guildId}/calendar`);
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function reputationLiveHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = z
      .object({ guild_id: z.string().optional(), muse_id: z.string().optional() })
      .parse(args ?? {});
    const guildId = client.resolveGuildId(a.guild_id);
    const path = a.muse_id
      ? `/v1/stagehand/live/guilds/${guildId}/reputation/${a.muse_id}`
      : `/v1/stagehand/live/guilds/${guildId}/reputation`;
    const data = await client.getJson(path);
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const ListClaimsSchema = z.object({
  guild_id: z.string().optional(),
  pool: z.string().optional(),
  include_claims: z.boolean().optional(),
});

/** List Flow Builder claim pools (phone, locker, …) and optional claim rows. */
export async function listClaimsHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = ListClaimsSchema.parse(args ?? {});
    const guildId = client.resolveGuildId(a.guild_id);
    const q: Record<string, string> = {
      include_claims: a.include_claims === false ? "0" : "1",
    };
    if (a.pool?.trim()) q.pool = a.pool.trim();
    const data = await client.getJson(
      `/v1/stagehand/live/guilds/${guildId}/claims`,
      q
    );
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LookupClaimSchema = z.object({
  guild_id: z.string().optional(),
  pool: z.string().min(1),
  query: z.string().min(1),
});

/** Look up one claim in a pool by muse name, label, or value fragment. */
export async function lookupClaimHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LookupClaimSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.getJson(
      `/v1/stagehand/live/guilds/${guildId}/claims/lookup`,
      { pool: a.pool, q: a.query }
    );
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const MuseClaimsSchema = z.object({
  guild_id: z.string().optional(),
  muse_id: z.string().min(1),
  pools: z.string().optional().describe("Optional comma-separated pool names"),
});

/** Claims held by one muse across pools. */
export async function museClaimsHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = MuseClaimsSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const q: Record<string, string> | undefined = a.pools?.trim()
      ? { pools: a.pools.trim() }
      : undefined;
    const data = await client.getJson(
      `/v1/stagehand/live/guilds/${guildId}/claims/muse/${encodeURIComponent(a.muse_id)}`,
      q
    );
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function birthdaysListHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildOnly.parse(args ?? {});
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.getJson(`/v1/stagehand/live/guilds/${guildId}/birthdays`);
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const BirthdayCreateSchema = z.object({
  guild_id: z.string().optional(),
  payload: z.record(z.unknown()),
});

export async function birthdayCreateHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = BirthdayCreateSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.postJson(
      `/v1/stagehand/live/guilds/${guildId}/birthdays`,
      a.payload
    );
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const BirthdayPatchSchema = z.object({
  guild_id: z.string().optional(),
  birthday_id: z.string().min(1),
  payload: z.record(z.unknown()),
});

export async function birthdayPatchHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = BirthdayPatchSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.patchJson(
      `/v1/stagehand/live/guilds/${guildId}/birthdays/${a.birthday_id}`,
      a.payload
    );
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const BirthdayDeleteSchema = z.object({
  guild_id: z.string().optional(),
  birthday_id: z.string().min(1),
});

export async function birthdayDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = BirthdayDeleteSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.deleteJson(
      `/v1/stagehand/live/guilds/${guildId}/birthdays/${a.birthday_id}`
    );
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const BirthdaySettingsSchema = z.object({
  guild_id: z.string().optional(),
  payload: z.record(z.unknown()),
});

export async function birthdaySettingsHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = BirthdaySettingsSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.patchJson(
      `/v1/stagehand/live/guilds/${guildId}/birthdays/settings`,
      a.payload
    );
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
