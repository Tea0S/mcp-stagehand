import type { Prompt } from "@modelcontextprotocol/sdk/types.js";

const guildArg = {
  name: "guild_id",
  description: "Discord guild id",
  required: false,
};

function setupPreamble(guild: string, feature: string): string[] {
  return [
    `Configure StageHand **${feature}** for guild ${guild}.`,
    ``,
    `Rules:`,
    `- StageHand setup only — do NOT kick/ban, create Discord channels, or moderate.`,
    `- Call stagehand_setup_requirements with feature="${feature === "Flow Builder" ? "flows" : feature.replace(/ /g, "_").toLowerCase()}" when unsure what to gather.`,
    `- Resolve the server with stagehand_list_guilds when the user gives a display name — do not ask for a guild snowflake first.`,
    `- Call stagehand_list_channels (and stagehand_list_emojis if needed) — never invent snowflakes.`,
    `- If images/art are needed and the user did not attach files, ASK for image_path or base64 before stagehand_upload_asset.`,
    `- Call stagehand_auth_check if credentials look wrong.`,
    ``,
  ];
}

export const promptList: Prompt[] = [
  {
    name: "forum_to_index",
    description:
      "Tandem workflow: create a Discord forum (separate Discord helper), then configure a StageHand index with optional thumbnail.",
    arguments: [
      guildArg,
      { name: "forum_name", description: "Name for the new forum channel", required: true },
      { name: "tags", description: "Comma-separated forum tag names", required: false },
      { name: "index_name", description: "Display name for the StageHand index", required: false },
      { name: "image_path", description: "Local path to index thumbnail image", required: false },
    ],
  },
  {
    name: "content_to_lore_panel",
    description:
      "Turn content into a StageHand lore panel. Reminds that first Discord publish may need /lore panel.",
    arguments: [
      guildArg,
      { name: "panel_name", description: "Lore panel display name", required: true },
      { name: "channel_id", description: "Target text channel id", required: false },
      { name: "panel_key", description: "Stable panel key", required: false },
      { name: "image_path", description: "Local path to banner image", required: false },
    ],
  },
  {
    name: "build_flow",
    description: "Design and save a StageHand Flow Builder automation from a natural-language goal.",
    arguments: [
      guildArg,
      { name: "goal", description: "What the flow should do", required: true },
      { name: "flow_id", description: "Stable flow id", required: false },
      { name: "flow_name", description: "Display name", required: false },
    ],
  },
  {
    name: "setup_roles",
    description: "Configure StageHand Roles lists/panels, sync Discord roles, post panel. Asks for channel/colors.",
    arguments: [
      guildArg,
      { name: "panel_channel_id", description: "Channel for roles panel", required: false },
      { name: "panel_key", description: "Panel key", required: false },
    ],
  },
  {
    name: "setup_form",
    description: "Create a StageHand form and post its button panel. Asks for fields and channels.",
    arguments: [
      guildArg,
      { name: "form_name", description: "Form name", required: true },
      { name: "button_channel_id", description: "Channel for the button panel", required: false },
    ],
  },
  {
    name: "setup_dice",
    description: "Configure dice sets/presets and optionally upload face art. Asks for images per face.",
    arguments: [
      guildArg,
      { name: "set_name", description: "Dice set name", required: false },
      { name: "die_types", description: "e.g. d6,d20", required: false },
    ],
  },
  {
    name: "setup_mailbox",
    description: "Configure a StageHand mailbox index. Asks for channel and optional header image.",
    arguments: [
      guildArg,
      { name: "channel_id", description: "Forum/text channel id", required: false },
      { name: "image_path", description: "Optional header image", required: false },
    ],
  },
  {
    name: "setup_tickets",
    description: "Configure StageHand tickets via guild_update. Asks for category and staff roles.",
    arguments: [guildArg],
  },
  {
    name: "setup_scene",
    description: "Configure scene setup and optional scene images.",
    arguments: [guildArg, { name: "image_path", description: "Optional scene image", required: false }],
  },
  {
    name: "setup_server",
    description:
      "Guided multi-feature StageHand setup: gather goals, call setup_requirements per feature, ask for assets/ids, then write.",
    arguments: [
      guildArg,
      {
        name: "goals",
        description: "Comma-separated features e.g. roles,forms,dice,indexes",
        required: true,
      },
    ],
  },
  {
    name: "setup_mia_hiatus",
    description: "Configure MIA & Hiatus: read surface, set policy, manage hiatus/MIA marks, optional staff template.",
    arguments: [
      guildArg,
      { name: "player_name", description: "Player display name for mark/clear/hiatus", required: false },
      { name: "template_channel_id", description: "Channel for staff template post", required: false },
    ],
  },
];

export function renderPrompt(
  name: string,
  args: Record<string, string | undefined>
): { description: string; messages: Array<{ role: "user"; content: { type: "text"; text: string } }> } {
  const guild = args.guild_id || "(use default guild / ask user)";
  const desc = promptList.find((p) => p.name === name)?.description || name;

  if (name === "forum_to_index") {
    const forumName = args.forum_name || "New Forum";
    const tags = args.tags || "";
    const indexName = args.index_name || forumName;
    const imagePath = args.image_path || "";
    const text = [
      ...setupPreamble(guild, "indexes"),
      `1. If the Discord forum does not exist yet, use a Discord helper (not this MCP) to create forum "${forumName}"` +
        (tags ? ` with tags: ${tags}` : "") +
        `, then note forum_id.`,
      `2. Call stagehand_setup_requirements feature=indexes.`,
      imagePath
        ? `3. stagehand_upload_asset kind=index_thumb forum_id=… image_path="${imagePath}".`
        : `3. If they want a thumb but gave no file, ASK for an image; else skip.`,
      `4. stagehand_index_upsert with forum_id, index_name="${indexName}", preferred_tags.`,
      `5. Confirm with stagehand_get_surface.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  if (name === "content_to_lore_panel") {
    const panelName = args.panel_name || "New Panel";
    const channelId = args.channel_id || "";
    const panelKey = args.panel_key || "";
    const imagePath = args.image_path || "";
    const text = [
      ...setupPreamble(guild, "lore"),
      `1. stagehand_setup_requirements feature=lore.`,
      `2. Pick panel_key` + (panelKey ? ` (${panelKey})` : " from the name") + `.`,
      imagePath
        ? `3. stagehand_upload_asset kind=lore_banner panel_key=… image_path="${imagePath}".`
        : `3. If they want a banner but no file — ASK; else skip.`,
      `4. stagehand_lore_panel_upsert name="${panelName}"` +
        (channelId ? ` channel_id="${channelId}"` : " (ask for channel if posting)") +
        `.`,
      `5. Tell user first Discord publish may need /lore panel once.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  if (name === "build_flow") {
    const goal = args.goal || "(see user message)";
    const text = [
      ...setupPreamble(guild, "Flow Builder"),
      `Goal: ${goal}`,
      `1. stagehand_setup_requirements feature=flows.`,
      `2. stagehand_flow_node_catalog; stagehand_flows_list.`,
      `3. Resolve channel/role ids via stagehand_list_channels.`,
      `4. stagehand_flow_upsert with valid node types only.`,
      `5. Confirm with stagehand_flow_get.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  if (name === "setup_roles") {
    const text = [
      ...setupPreamble(guild, "roles"),
      `1. stagehand_setup_requirements feature=roles.`,
      `2. Ask for role list names/colors and panel channel if missing` +
        (args.panel_channel_id ? ` (panel channel hint: ${args.panel_channel_id})` : "") +
        `.`,
      `3. stagehand_get_surface → merge roles → stagehand_guild_update section=roles.`,
      `4. stagehand_roles_sync (optional list_key).`,
      `5. stagehand_roles_post_panel with panel_key` +
        (args.panel_key ? `=${args.panel_key}` : " from config") +
        `.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  if (name === "setup_form") {
    const formName = args.form_name || "New Form";
    const text = [
      ...setupPreamble(guild, "forms"),
      `1. stagehand_setup_requirements feature=forms.`,
      `2. Ask for questions/fields and button_channel_id if missing` +
        (args.button_channel_id ? ` (hint: ${args.button_channel_id})` : "") +
        `.`,
      `3. stagehand_form_upsert for "${formName}" with buttons + button_channel_id.`,
      `4. stagehand_forms_post_panel.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  if (name === "setup_dice") {
    const text = [
      ...setupPreamble(guild, "dice"),
      `1. stagehand_setup_requirements feature=dice.`,
      `2. Ask for set_name / die types` +
        (args.set_name ? ` (set: ${args.set_name})` : "") +
        (args.die_types ? ` (types: ${args.die_types})` : "") +
        `.`,
      `3. If custom faces: ASK for one image per face; upload with stagehand_upload_asset kind=dice_face.`,
      `4. stagehand_guild_update section=dice / diceSets / dicePresets as needed (merge_from_surface).`,
      `5. Optional: stagehand_dice_presets_live to verify bot side.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  if (name === "setup_mailbox") {
    const text = [
      ...setupPreamble(guild, "mailboxes"),
      `1. stagehand_setup_requirements feature=mailboxes.`,
      `2. Resolve channel_id` +
        (args.channel_id ? `=${args.channel_id}` : " by asking / list_channels") +
        `.`,
      args.image_path
        ? `3. stagehand_upload_asset kind=mailbox_header channel_id=… image_path="${args.image_path}".`
        : `3. Ask if they want a header image; upload if provided.`,
      `4. stagehand_mailbox_upsert; stagehand_mailbox_refresh.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  if (name === "setup_tickets") {
    const text = [
      ...setupPreamble(guild, "tickets"),
      `1. stagehand_setup_requirements feature=tickets.`,
      `2. Ask for ticket category, staff roles, panel channel.`,
      `3. stagehand_get_surface → stagehand_guild_update section=tickets merge_from_surface=true.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  if (name === "setup_scene") {
    const text = [
      ...setupPreamble(guild, "scene"),
      `1. stagehand_setup_requirements feature=scene.`,
      `2. Ask for scene channel/category preferences and any end/day/preset images.`,
      args.image_path
        ? `3. Upload with stagehand_upload_asset kind=scene_image slot=… image_path="${args.image_path}".`
        : `3. Upload images only after the user provides files.`,
      `4. stagehand_guild_update section=sceneSetup merge_from_surface=true.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  if (name === "setup_server") {
    const goals = (args.goals || "roles,forms")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const text = [
      ...setupPreamble(guild, "multi-feature setup"),
      `Requested features: ${goals.join(", ")}`,
      `For EACH feature:`,
      `1. Map to a stagehand_setup_requirements feature enum and call it.`,
      `2. Ask the user for every missing id/asset from the checklist.`,
      `3. Upload assets, then write with the dedicated tools or guild_update.`,
      `4. Verify with stagehand_get_surface / auth_check.`,
      `Stop and ask rather than guessing Discord ids or inventing image URLs.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  if (name === "setup_mia_hiatus") {
    const text = [
      ...setupPreamble(guild, "mia_hiatus"),
      `1. stagehand_setup_requirements feature=mia_hiatus.`,
      `2. stagehand_mia_hiatus_surface.`,
      `3. Ask for player names / user ids / dates as needed` +
        (args.player_name ? ` (player hint: ${args.player_name})` : "") +
        `.`,
      `4. Apply policy / hiatus upsert / mia mark|clear / submit-config as requested.`,
      args.template_channel_id
        ? `5. Optional: stagehand_mia_hiatus_post_staff_template channel_id=${args.template_channel_id}.`
        : `5. If posting staff template, ASK for channel_id first.`,
    ].join("\n");
    return { description: desc, messages: [{ role: "user", content: { type: "text", text } }] };
  }

  throw new Error(`Unknown prompt: ${name}`);
}
