import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const ImageSourceSchema = z
  .object({
    image_path: z.string().min(1).optional(),
    image_base64: z.string().min(1).optional(),
    filename: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.image_path || v.image_base64), {
    message: "Provide image_path or image_base64",
  });

export type ImageBytes = {
  filename: string;
  bytes: Uint8Array;
};

export async function resolveImageBytes(args: {
  image_path?: string;
  image_base64?: string;
  filename?: string;
}): Promise<ImageBytes> {
  const parsed = ImageSourceSchema.parse(args);

  if (parsed.image_path) {
    const resolved = path.resolve(parsed.image_path);
    const bytes = await readFile(resolved);
    const filename = parsed.filename || path.basename(resolved);
    return { filename, bytes };
  }

  const b64 = parsed.image_base64!.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.from(b64, "base64");
  const filename = parsed.filename || "upload.png";
  return { filename, bytes: new Uint8Array(bytes) };
}

const UploadIndexThumbSchema = z.object({
  guild_id: z.string().optional(),
  forum_id: z.string().min(1).describe("Forum channel snowflake (preset_name for upload)"),
  image_path: z.string().optional(),
  image_base64: z.string().optional(),
  filename: z.string().optional(),
});

export async function uploadIndexThumbHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = UploadIndexThumbSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const image = await resolveImageBytes(a);
    const result = await client.postMultipart("/v1/stagehand/scene-images/upload", {
      guild_id: guildId,
      slot: "index_thumb",
      preset_name: a.forum_id,
    }, {
      fieldName: "file",
      filename: image.filename,
      bytes: image.bytes,
    });
    return okJson({
      ...((result as object) || {}),
      note: "Thumb staged. Call stagehand_index_upsert (or refresh) so StageHand attaches it to the index message.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const UploadLoreBannerSchema = z.object({
  guild_id: z.string().optional(),
  panel_key: z.string().min(1).describe("Lore panel key; upload uses preset_name {panel_key}_banner"),
  image_path: z.string().optional(),
  image_base64: z.string().optional(),
  filename: z.string().optional(),
});

export async function uploadLoreBannerHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = UploadLoreBannerSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const image = await resolveImageBytes(a);
    const result = await client.postMultipart("/v1/stagehand/scene-images/upload", {
      guild_id: guildId,
      slot: "lore_panel",
      preset_name: `${a.panel_key}_banner`,
    }, {
      fieldName: "file",
      filename: image.filename,
      bytes: image.bytes,
    });
    return okJson({
      ...((result as object) || {}),
      note: "Banner uploaded. Include banner_url from this response in stagehand_lore_panel_upsert if returned.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const UploadAssetSchema = z.object({
  guild_id: z.string().optional(),
  kind: z.enum([
    "scene_image",
    "dice_face",
    "mailbox_header",
    "ifttt_static",
    "index_thumb",
    "lore_banner",
  ]),
  /** scene_image slots: end_image, current_day_image, preset, bot_avatar, bot_banner, ticker_banner, ticker_webhook_avatar, lore_selector, … */
  slot: z.string().optional(),
  preset_name: z.string().optional(),
  forum_id: z.string().optional(),
  panel_key: z.string().optional(),
  channel_id: z.string().optional(),
  set_name: z.string().optional(),
  die_type: z.string().optional(),
  face: z.string().optional(),
  image_path: z.string().optional(),
  image_base64: z.string().optional(),
  filename: z.string().optional(),
});

/**
 * Unified asset upload. If the user asked for custom art but did not provide a file,
 * ASK them for image_path / base64 before calling this.
 */
export async function uploadAssetHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = UploadAssetSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const image = await resolveImageBytes(a);

    if (a.kind === "dice_face") {
      if (!a.set_name || !a.die_type || !a.face) {
        return errText("dice_face requires set_name, die_type, and face (e.g. face \"1\").");
      }
      const result = await client.postMultipart(
        "/v1/stagehand/dice-images/upload",
        {
          guild_id: guildId,
          set_name: a.set_name,
          die_type: a.die_type,
          face: a.face,
        },
        { fieldName: "file", filename: image.filename, bytes: image.bytes }
      );
      return okJson({ ...((result as object) || {}), kind: a.kind });
    }

    if (a.kind === "mailbox_header") {
      if (!a.channel_id) {
        return errText("mailbox_header requires channel_id.");
      }
      const result = await client.postMultipart(
        "/v1/stagehand/mailboxes/image",
        { guild_id: guildId, channel_id: a.channel_id },
        { fieldName: "file", filename: image.filename, bytes: image.bytes }
      );
      return okJson({ ...((result as object) || {}), kind: a.kind });
    }

    if (a.kind === "ifttt_static") {
      const result = await client.postMultipart(
        "/v1/stagehand/ifttt-static/upload",
        { guild_id: guildId },
        { fieldName: "file", filename: image.filename, bytes: image.bytes }
      );
      return okJson({ ...((result as object) || {}), kind: a.kind });
    }

    if (a.kind === "index_thumb") {
      const forumId = a.forum_id || a.preset_name;
      if (!forumId) return errText("index_thumb requires forum_id.");
      return uploadIndexThumbHandler(
        {
          guild_id: guildId,
          forum_id: forumId,
          image_path: a.image_path,
          image_base64: a.image_base64,
          filename: a.filename,
        },
        client
      );
    }

    if (a.kind === "lore_banner") {
      if (!a.panel_key) return errText("lore_banner requires panel_key.");
      return uploadLoreBannerHandler(
        {
          guild_id: guildId,
          panel_key: a.panel_key,
          image_path: a.image_path,
          image_base64: a.image_base64,
          filename: a.filename,
        },
        client
      );
    }

    // scene_image
    const slot = (a.slot || "").trim();
    if (!slot) {
      return errText(
        "scene_image requires slot (end_image, current_day_image, preset, bot_avatar, bot_banner, ticker_banner, ticker_webhook_avatar, …)."
      );
    }
    const fields: Record<string, string> = { guild_id: guildId, slot };
    if (a.preset_name) fields.preset_name = a.preset_name;
    if (slot === "lore_panel" && a.panel_key) {
      fields.preset_name = `${a.panel_key}_banner`;
    }
    if (slot === "index_thumb" && (a.forum_id || a.preset_name)) {
      fields.preset_name = a.forum_id || a.preset_name || "";
    }
    const result = await client.postMultipart(
      "/v1/stagehand/scene-images/upload",
      fields,
      { fieldName: "file", filename: image.filename, bytes: image.bytes }
    );
    return okJson({
      ...((result as object) || {}),
      kind: a.kind,
      slot,
      note: "Asset uploaded. Wire any returned url into the matching StageHand config upsert/guild_update.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
