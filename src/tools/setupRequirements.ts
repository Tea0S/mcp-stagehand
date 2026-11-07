import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { SETUP_FEATURES, SETUP_REQUIREMENTS } from "./sections.js";
import { errText, okJson, type ToolResult } from "./types.js";

const Schema = z.object({
  feature: z.enum(SETUP_FEATURES),
});

/**
 * Local checklist — no network. Agents should call this when a setup request is vague,
 * then ASK the user for any missing ids/assets before writing.
 */
export async function setupRequirementsHandler(
  args: unknown,
  _client: StagehandClient
): Promise<ToolResult> {
  try {
    const { feature } = Schema.parse(args ?? {});
    const row = SETUP_REQUIREMENTS[feature];
    return okJson({
      feature,
      ...row,
      agent_instructions: [
        "If the user did not provide required_ids or required_assets, ASK them before calling write tools.",
        "Resolve Discord channel/role/forum ids with stagehand_list_channels — never invent snowflakes.",
        "Upload local images with stagehand_upload_asset (or legacy thumb/banner tools).",
        "This MCP configures StageHand only — it cannot kick users, create Discord channels, or moderate.",
      ],
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
