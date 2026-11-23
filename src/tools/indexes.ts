import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const ThumbImageSchema = z.object({
  url: z.string().optional(),
  alt_text: z.string().optional(),
});

const IndexDataSchema = z.object({
  forum_id: z.string().min(1),
  index_name: z.string().min(1),
  preferred_tags: z.array(z.string()).optional(),
  exclude_tags: z.array(z.string()).optional(),
  index_thread_name: z.string().optional(),
  intro_text: z.string().optional(),
  thumb_url: z.string().optional(),
  thumb_images: z.array(ThumbImageSchema).optional(),
  thumb_image_alt_text: z.string().optional(),
  sort_by_tags: z.boolean().optional(),
  use_character_sorting: z.boolean().optional(),
  priority_tag: z.string().optional(),
  /** Pin the index forum post to the top of its parent forum (default true). */
  pin_thread: z.boolean().optional(),
});

const ListIndexesSchema = z.object({
  guild_id: z.string().optional(),
});

/**
 * List configured indexes and which forums still lack one (by name/id).
 * Prefer this over asking the user which forums are missing indexes.
 */
export async function listIndexesHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = ListIndexesSchema.parse(args ?? {});
    const guildId = client.resolveGuildId(a.guild_id);
    const [surface, channels] = await Promise.all([
      client.getJson<{
        config?: {
          indexes?: Array<Record<string, unknown>>;
          group_indexes?: Array<Record<string, unknown>>;
          layered_indexes?: Array<Record<string, unknown>>;
        };
      }>("/v1/stagehand/surface", client.surfaceQuery(guildId)),
      client.getJson<{
        forums?: Array<{ id?: string; name?: string }>;
        error?: string;
      }>("/v1/stagehand/channels", { guild_id: guildId }),
    ]);

    const indexes = Array.isArray(surface?.config?.indexes)
      ? surface.config!.indexes!
      : [];
    const groupIndexes = Array.isArray(surface?.config?.group_indexes)
      ? surface.config!.group_indexes!
      : [];
    const layeredIndexes = Array.isArray(surface?.config?.layered_indexes)
      ? surface.config!.layered_indexes!
      : [];
    const indexedForumIds = new Set(
      indexes
        .map((row) => String(row.forum_id || "").trim())
        .filter(Boolean)
    );
    const forums = Array.isArray(channels?.forums) ? channels.forums! : [];
    const forumsMissingIndex = forums
      .filter((f) => {
        const id = String(f.id || "").trim();
        return id && !indexedForumIds.has(id);
      })
      .map((f) => ({
        id: String(f.id || ""),
        name: String(f.name || ""),
      }));

    const hintParts: string[] = [
      "Kinds: stagehand_index_upsert (single forum), stagehand_group_index_upsert (multi-forum → one target), stagehand_layered_index_upsert (tag layers → one target). pin_thread defaults true for forum targets.",
    ];
    if (forumsMissingIndex.length === 0) {
      hintParts.push("Every listed forum already has a single-forum StageHand index (or there are no forums).");
    } else {
      hintParts.push(
        `Forums without a single-forum index: ${forumsMissingIndex
          .map((f) => f.name || f.id)
          .join(", ")}. Use stagehand_index_upsert with forum_id + index_name.`
      );
    }
    if (groupIndexes.length) {
      hintParts.push(`${groupIndexes.length} group index(es) configured.`);
    }
    if (layeredIndexes.length) {
      hintParts.push(`${layeredIndexes.length} layered index(es) configured.`);
    }

    return okJson({
      ok: true,
      guild_id: guildId,
      indexes: indexes.map((row) => ({
        forum_id: String(row.forum_id || ""),
        index_name: String(row.index_name || ""),
        index_thread_name: String(row.index_thread_name || ""),
        has_thumb_image: Boolean(row.has_thumb_image),
        pin_thread: row.pin_thread !== false,
      })),
      group_indexes: groupIndexes,
      layered_indexes: layeredIndexes,
      forums: forums.map((f) => ({
        id: String(f.id || ""),
        name: String(f.name || ""),
      })),
      forums_missing_index: forumsMissingIndex,
      channels_error: channels?.error || null,
      hint: hintParts.join(" "),
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const IndexUpsertSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  index_data: IndexDataSchema,
});

export async function indexUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = IndexUpsertSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const actorId = client.resolveActorId(a.actor_id);
    const data = await client.postJson("/v1/stagehand/indexes/upsert", {
      guild_id: guildId,
      actor_id: actorId,
      index_data: a.index_data,
    });
    return okJson({
      ...((data as object) || {}),
      note: "Index saved; StageHand was asked to refresh the forum index message.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const IndexDeleteSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  forum_id: z.string().min(1),
});

export async function indexDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = IndexDeleteSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/indexes/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      forum_id: a.forum_id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const IndexRefreshSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
});

export async function indexRefreshAllHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = IndexRefreshSchema.parse(args ?? {});
    const data = await client.postJson("/v1/stagehand/indexes/refresh-all", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const GroupIndexUpsertSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  index_data: z.record(z.unknown()),
});

export async function groupIndexUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GroupIndexUpsertSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/indexes/group/upsert", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      index_data: a.index_data,
    });
    return okJson({
      ...((data as object) || {}),
      note:
        "Group index needs target_channel_id, group_index_name, and usually source_forum_ids. Optional pin_thread (default true) pins forum index posts when the target is a forum.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const GroupIndexDeleteSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  target_channel_id: z.string().min(1),
});

export async function groupIndexDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GroupIndexDeleteSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/indexes/group/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      target_channel_id: a.target_channel_id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LayeredIndexUpsertSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  index_data: z.record(z.unknown()),
});

export async function layeredIndexUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LayeredIndexUpsertSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/indexes/layered/upsert", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      index_data: a.index_data,
    });
    return okJson({
      ...((data as object) || {}),
      note:
        "Layered index needs target_channel_id, layered_index_name, source_forum_ids, main_tags, preferred_tags, sub_tags. Optional pin_thread (default true) when the target is a forum.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LayeredIndexDeleteSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  target_channel_id: z.string().min(1),
});

export async function layeredIndexDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LayeredIndexDeleteSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/indexes/layered/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      target_channel_id: a.target_channel_id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const MaterializeSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  dry_run: z.boolean().optional(),
});

export async function indexMaterializeThumbsHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = MaterializeSchema.parse(args ?? {});
    const data = await client.postJson("/v1/stagehand/indexes/materialize-thumbnails", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      dry_run: a.dry_run ?? false,
    });
    return okJson({
      ...((data as object) || {}),
      note: "Repairs index thumb links from disk / downloads. Expired Discord CDN URLs cannot be recovered.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
