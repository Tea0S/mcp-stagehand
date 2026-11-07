import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const FormUpsertSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  form: z.record(z.unknown()),
});

export async function formUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = FormUpsertSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/forms/upsert", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      form: a.form,
    });
    return okJson({
      ...((data as object) || {}),
      note: "Form saved. To post the Discord button panel, set buttons + button_channel_id then call stagehand_forms_post_panel.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const FormIdSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  form_id: z.string().min(1).optional(),
  workflow_id: z.string().min(1).optional(),
});

export async function formDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = FormIdSchema.parse(args);
    const id = a.form_id || a.workflow_id;
    if (!id) return errText("form_id or workflow_id required");
    const data = await client.postJson("/v1/stagehand/forms/delete", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      form_id: id,
      workflow_id: id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function formsPostPanelHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = FormIdSchema.parse(args);
    const id = a.workflow_id || a.form_id;
    if (!id) return errText("workflow_id (form id) required");
    const data = await client.postJson("/v1/stagehand/forms/panel/post", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      workflow_id: id,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const FormExportSchema = z.object({
  guild_id: z.string().optional(),
});

export async function formExportHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = FormExportSchema.parse(args ?? {});
    const guildId = client.resolveGuildId(a.guild_id);
    const data = await client.getJson("/v1/stagehand/forms/export", {
      guild_id: guildId,
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const FormImportSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  payload: z.unknown(),
});

export async function formImportHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = FormImportSchema.parse(args);
    const data = await client.postJson("/v1/stagehand/forms/import", {
      guild_id: client.resolveGuildId(a.guild_id),
      actor_id: client.resolveActorId(a.actor_id),
      ...(typeof a.payload === "object" && a.payload && !Array.isArray(a.payload)
        ? (a.payload as object)
        : { data: a.payload }),
    });
    return okJson(data);
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
