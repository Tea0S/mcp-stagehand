import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const PanelDataSchema = z
  .object({
    _key: z.string().optional(),
    panel_key: z.string().optional(),
    name: z.string().min(1),
    channel_id: z.union([z.string(), z.number()]).optional(),
    message_id: z.union([z.string(), z.number()]).optional(),
    banner_url: z.string().optional(),
    banner_image_alt_text: z.string().optional(),
    blocks: z.array(z.unknown()).optional(),
    media: z.array(z.unknown()).optional(),
    button_rows: z.array(z.array(z.unknown())).optional(),
    layout_sequence: z.array(z.unknown()).optional(),
    accent_color: z.union([z.string(), z.number()]).optional(),
    posts: z.array(z.unknown()).optional(),
  })
  .passthrough();

const LorePanelUpsertSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  panel_data: PanelDataSchema,
});

export async function lorePanelUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LorePanelUpsertSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const actorId = client.resolveActorId(a.actor_id);
    const data = (await client.postJson("/v1/stagehand/lore/panel/upsert", {
      guild_id: guildId,
      actor_id: actorId,
      panel_data: a.panel_data,
    })) as { ok?: boolean; key?: string };

    const key = data.key || a.panel_data._key || a.panel_data.panel_key || "(unknown)";
    return okJson({
      ...data,
      note:
        "Panel config saved. If this panel has never been posted, run Discord /lore panel once (pick this panel and a channel). Existing posts were asked to refresh.",
      panel_key: key,
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LorePanelDeleteSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  panel_key: z.string().min(1),
});

export async function lorePanelDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LorePanelDeleteSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/lore/panel/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      panel_key: a.panel_key,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const SnippetDataSchema = z
  .object({
    id: z.string().optional(),
    snippet_id: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    image_url: z.string().optional(),
  })
  .passthrough();

const LoreSnippetUpsertSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  snippet_data: SnippetDataSchema,
});

export async function loreSnippetUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LoreSnippetUpsertSchema.parse(args);
    const sid = (a.snippet_data.id || a.snippet_data.snippet_id || "").trim();
    if (!sid) {
      return errText("snippet_data.id (or snippet_id) is required");
    }
    const data = await client.postJson("/v1/stagehand/lore/snippet/upsert", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      snippet_data: { ...a.snippet_data, id: sid },
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LoreSnippetDeleteSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  snippet_id: z.string().min(1),
});

export async function loreSnippetDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LoreSnippetDeleteSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/lore/snippet/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      snippet_id: a.snippet_id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function loreExportHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = z.object({ guild_id: z.string().optional() }).parse(args ?? {});
    const data = await client.getJson("/v1/stagehand/lore/export", {
      guild_id: client.resolveGuildId(a.guild_id),
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LoreImportSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  payload: z.record(z.unknown()),
});

export async function loreImportHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LoreImportSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/lore/import", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      ...a.payload,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LoreSelectorUpsertSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  selector_data: z.record(z.unknown()),
});

export async function loreSelectorUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LoreSelectorUpsertSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/lore/selector/upsert", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      selector_data: a.selector_data,
    });
    return okJson({
      ...((data as object) || {}),
      note: "Selector saved. New selectors may need a Discord post (needs_discord_post) before the message exists.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LoreSelectorDeleteSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  selector_key: z.string().min(1),
});

export async function loreSelectorDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LoreSelectorDeleteSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/lore/selector/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      selector_key: a.selector_key,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LoreCarouselUpsertSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  carousel_data: z.record(z.unknown()),
});

export async function loreCarouselUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LoreCarouselUpsertSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/lore/upsert", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      carousel_data: a.carousel_data,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LoreCarouselDeleteSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  carousel_key: z.string().min(1),
});

export async function loreCarouselDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LoreCarouselDeleteSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/lore/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      carousel_key: a.carousel_key,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const LoreValidateSchema = z.object({
  guild_id: z.string().optional(),
  panel: z.record(z.unknown()),
});

export async function loreValidateLayoutHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = LoreValidateSchema.parse(args);
    const payload: Record<string, unknown> = { panel: a.panel };
    if (a.guild_id || client.defaults.guildId || client.defaults.authMode === "user_key") {
      payload.guild_id = client.resolveGuildId(a.guild_id);
    }
    const data = await client.postJson("/v1/stagehand/lore/validate-layout", payload);
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
