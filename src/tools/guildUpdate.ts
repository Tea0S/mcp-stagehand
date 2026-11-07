import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { GUILD_UPDATE_SECTIONS } from "./sections.js";
import { errText, okJson, type ToolResult } from "./types.js";

const GuildUpdateSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
  section: z.enum(GUILD_UPDATE_SECTIONS),
  guild_payload: z.record(z.unknown()),
  merge_from_surface: z
    .boolean()
    .optional()
    .describe("If true, shallow-merge guild_payload onto current surface section when present"),
});

/** Map section key → surface property often used in GET /surface payloads. */
const SURFACE_SECTION_KEYS: Record<string, string> = {
  roles: "roles",
  dice: "dice",
  dicePresets: "dicePresets",
  diceSets: "diceSets",
  dicePostAutomation: "dicePostAutomation",
  tickets: "tickets",
  infoDisplay: "infoDisplay",
  threadKeepForums: "threadKeepForums",
  botCustomization: "botCustomization",
  verification: "verification",
  ifttt: "ifttt",
  customCommands: "customCommands",
  sceneSetup: "sceneSetup",
  calendarSetup: "calendarSetup",
  ticker: "ticker",
  checklists: "checklists",
  quests: "quests",
  reputation: "reputation",
  challenges: "challenges",
  serverLogging: "serverLogging",
  dashboardAccess: "dashboardAccess",
};

export async function guildUpdateHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GuildUpdateSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const actorId = client.resolveActorId(a.actor_id);

    let payload: Record<string, unknown> = { ...a.guild_payload };

    if (a.merge_from_surface) {
      const surface = (await client.getJson("/v1/stagehand/surface", {
        guild_id: guildId,
      })) as Record<string, unknown>;
      const key = SURFACE_SECTION_KEYS[a.section] || a.section;
      const existing = surface[key];
      if (existing && typeof existing === "object" && !Array.isArray(existing)) {
        payload = { ...(existing as Record<string, unknown>), ...payload };
      }
    }

    const data = await client.postJson("/v1/stagehand/config/guild-update", {
      guild_id: guildId,
      actor_id: actorId,
      section: a.section,
      guild_payload: payload,
    });

    return okJson({
      ...((data as object) || {}),
      note:
        "Guild section saved. Prefer merge_from_surface or read stagehand_get_surface before large edits. For iftttAdvanced (Flow Builder) use stagehand_flow_* tools instead.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
