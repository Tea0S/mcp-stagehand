import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GUILD_UPDATE_SECTIONS, SETUP_FEATURES } from "./tools/sections.js";

/** Human titles + Claude/OpenAI directory annotations (title + readOnly or destructive). */
function annotateTools(tools: Tool[]): Tool[] {
  return tools.map((tool) => {
    const name = tool.name;
    const title = name
      .replace(/^stagehand_/, "")
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const isRead =
      /_(check|get|export|live|catalog|requirements|surface|stats|events|validate)$/.test(
        name
      ) ||
      /_list(_|$)/.test(name) ||
      name.includes("_list_") ||
      name.startsWith("stagehand_list_") ||
      name === "stagehand_auth_check" ||
      name === "stagehand_setup_requirements" ||
      name === "stagehand_get_surface" ||
      name === "stagehand_flow_node_catalog" ||
      name === "stagehand_lore_validate_layout" ||
      name === "stagehand_dice_presets_live" ||
      name === "stagehand_calendar_live" ||
      name === "stagehand_reputation_live" ||
      name === "stagehand_lookup_claim" ||
      name === "stagehand_muse_claims";

    const isDestructive =
      /_(delete|clear|cancel|end)$/.test(name) ||
      name.includes("_delete") ||
      name === "stagehand_ifttt_pending_cancel" ||
      name === "stagehand_mia_hiatus_mia_clear" ||
      name === "stagehand_mia_hiatus_hiatus_end" ||
      name === "stagehand_emojis_delete" ||
      name === "stagehand_mailbox_opener_presets";

    return {
      ...tool,
      annotations: {
        title,
        openWorldHint: !["stagehand_setup_requirements", "stagehand_flow_node_catalog"].includes(name),
        ...(isRead
          ? { readOnlyHint: true, destructiveHint: false }
          : isDestructive
            ? { readOnlyHint: false, destructiveHint: true }
            : { readOnlyHint: false, destructiveHint: false }),
      },
    };
  });
}

const guildIdProp = {
  guild_id: {
    type: "string",
    description:
      "Discord guild snowflake. Prefer stagehand_list_guilds (by server display name) first — do not ask the user for a raw id if they already named the server.",
  },
};

const actorIdProp = {
  actor_id: {
    type: "string",
    description: "Discord user id for audit (optional for sh_ keys — server binds owner)",
  },
};

const _rawToolList: Tool[] = [
  {
    name: "stagehand_auth_check",
    description:
      "Verify the current MCP session is authenticated with StageHand (OAuth access token or Bearer sh_…). Returns fingerprints only — never the raw secret. Do not ask the user for an API key if OAuth Authenticate already succeeded. Call first when setup fails or before large changes.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
      },
    },
  },
  {
    name: "stagehand_setup_requirements",
    description:
      "BEFORE writing config for a vague user request: returns required Discord ids, assets to ask for, and which tools to use. Resolve the server with stagehand_list_guilds when the user gives a display name. Ask for missing channel/role ids or images only after listing — never invent snowflakes. StageHand setup only (not Discord moderation).",
    inputSchema: {
      type: "object",
      properties: {
        feature: {
          type: "string",
          enum: [...SETUP_FEATURES],
          description: "Which StageHand feature the user wants configured",
        },
      },
      required: ["feature"],
    },
  },
  {
    name: "stagehand_list_guilds",
    description:
      "List Discord servers where this user can manage StageHand (display name + guild id). Call this when the user names a server (e.g. \"Briar of Bargains\") instead of asking for a snowflake or channel link. Optional query filters by name substring.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Server name substring to match (e.g. Briar, Bargains)",
        },
        name: {
          type: "string",
          description: "Alias for query — server display name or fragment",
        },
      },
    },
  },
  {
    name: "stagehand_get_surface",
    description:
      "Read StageHand guild surface under config (indexes, lore, forms, dice, roles, tickets, flows, etc.). Always read before large guild_update merges. For \"which forums lack an index\" prefer stagehand_list_indexes.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_list_indexes",
    description:
      "List configured StageHand indexes for a guild and which Discord forums are still missing an index. Use when the user asks which player forums need indexes — resolve the guild with stagehand_list_guilds first if they gave a server name.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_list_channels",
    description:
      "List Discord channels/categories/roles as StageHand sees them (names + ids). After resolving the guild via stagehand_list_guilds, use this to find forums/channels by name — never invent ids.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_list_emojis",
    description: "List guild custom emojis for pickers (roles, forms, mailboxes, etc.).",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_guild_update",
    description:
      "Write one StageHand guild config section via POST /config/guild-update (roles, dice, tickets, sceneSetup, infoDisplay, threadKeepForums, botCustomization, verification, ifttt, customCommands, calendarSetup, ticker, checklists, quests, reputation, challenges, serverLogging, dashboardAccess, dicePresets, diceSets, dicePostAutomation). Read surface first; set merge_from_surface true for safe merges. Prefer dedicated flow/form/mailbox/index/lore tools when available. Ask user for any missing channel/role ids or images.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        section: { type: "string", enum: [...GUILD_UPDATE_SECTIONS] },
        guild_payload: { type: "object", description: "Section payload object for this guild" },
        merge_from_surface: {
          type: "boolean",
          description: "Shallow-merge onto current surface section when present",
        },
      },
      required: ["section", "guild_payload"],
    },
  },
  {
    name: "stagehand_upload_asset",
    description:
      "Upload an image for StageHand. kind: scene_image|dice_face|mailbox_header|ifttt_static|index_thumb|lore_banner. If the user wants custom art but gave no file, ASK for image_path or image_base64 first.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        kind: {
          type: "string",
          enum: [
            "scene_image",
            "dice_face",
            "mailbox_header",
            "ifttt_static",
            "index_thumb",
            "lore_banner",
          ],
        },
        slot: {
          type: "string",
          description:
            "For scene_image: end_image, current_day_image, preset, bot_avatar, bot_banner, ticker_banner, ticker_webhook_avatar, …",
        },
        preset_name: { type: "string" },
        forum_id: { type: "string" },
        panel_key: { type: "string" },
        channel_id: { type: "string" },
        set_name: { type: "string" },
        die_type: { type: "string" },
        face: { type: "string" },
        image_path: { type: "string" },
        image_base64: { type: "string" },
        filename: { type: "string" },
      },
      required: ["kind"],
    },
  },

  // Indexes
  {
    name: "stagehand_index_upsert",
    description: "Create/update a StageHand forum index. Needs real forum_id. Optional thumb via upload first.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        index_data: { type: "object" },
      },
      required: ["index_data"],
    },
  },
  {
    name: "stagehand_index_upload_thumb",
    description: "Upload index thumbnail (legacy). Prefer stagehand_upload_asset kind=index_thumb.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        forum_id: { type: "string" },
        image_path: { type: "string" },
        image_base64: { type: "string" },
        filename: { type: "string" },
      },
      required: ["forum_id"],
    },
  },
  {
    name: "stagehand_index_refresh_all",
    description: "Rebuild every configured forum index message in the guild.",
    inputSchema: { type: "object", properties: { ...guildIdProp, ...actorIdProp } },
  },
  {
    name: "stagehand_index_delete",
    description: "Remove index config (does not delete the Discord forum).",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, forum_id: { type: "string" } },
      required: ["forum_id"],
    },
  },

  // Lore
  {
    name: "stagehand_lore_panel_upsert",
    description:
      "Create/update lore panel. First Discord publish may still need /lore panel once. Ask for banner image if user wants art.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, panel_data: { type: "object" } },
      required: ["panel_data"],
    },
  },
  {
    name: "stagehand_lore_panel_upload_banner",
    description: "Upload lore banner (legacy). Prefer stagehand_upload_asset kind=lore_banner.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        panel_key: { type: "string" },
        image_path: { type: "string" },
        image_base64: { type: "string" },
        filename: { type: "string" },
      },
      required: ["panel_key"],
    },
  },
  {
    name: "stagehand_lore_panel_delete",
    description: "Delete lore panel config (does not delete Discord messages).",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, panel_key: { type: "string" } },
      required: ["panel_key"],
    },
  },
  {
    name: "stagehand_lore_snippet_upsert",
    description: "Create/update lore snippet library entry (JSON only).",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, snippet_data: { type: "object" } },
      required: ["snippet_data"],
    },
  },

  // Flows
  {
    name: "stagehand_flows_list",
    description: "List Flow Builder flows.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_flow_get",
    description: "Get one Flow Builder flow (nodes + edges).",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, flow_id: { type: "string" } },
      required: ["flow_id"],
    },
  },
  {
    name: "stagehand_flow_upsert",
    description: "Create/update a Flow Builder flow. Use node catalog first.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, flow: { type: "object" } },
      required: ["flow"],
    },
  },
  {
    name: "stagehand_flow_delete",
    description: "Delete a Flow Builder flow.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, flow_id: { type: "string" } },
      required: ["flow_id"],
    },
  },
  {
    name: "stagehand_flow_node_catalog",
    description: "List Flow Builder node types before designing a flow.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["event", "condition", "action"] },
      },
    },
  },

  // Forms
  {
    name: "stagehand_form_upsert",
    description:
      "Create/update a StageHand form workflow. Ask for fields, button labels, and button_channel_id. Then post panel.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, form: { type: "object" } },
      required: ["form"],
    },
  },
  {
    name: "stagehand_form_delete",
    description: "Delete a form workflow.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        form_id: { type: "string" },
        workflow_id: { type: "string" },
      },
    },
  },
  {
    name: "stagehand_forms_post_panel",
    description: "Post/refresh the Discord button panel for a form (needs buttons + button_channel_id).",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        workflow_id: { type: "string" },
        form_id: { type: "string" },
      },
    },
  },
  {
    name: "stagehand_form_export",
    description: "Export forms for the guild.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_form_import",
    description: "Import forms payload into the guild.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, payload: {} },
      required: ["payload"],
    },
  },

  // Mailboxes
  {
    name: "stagehand_mailbox_upsert",
    description:
      "Create/update mailbox index for a channel. Ask for channel_id and optional header image.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, index_data: { type: "object" } },
      required: ["index_data"],
    },
  },
  {
    name: "stagehand_mailbox_delete",
    description: "Delete mailbox index config for a channel.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, channel_id: { type: "string" } },
      required: ["channel_id"],
    },
  },
  {
    name: "stagehand_mailbox_refresh",
    description: "Refresh mailbox Discord index message.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, channel_id: { type: "string" } },
      required: ["channel_id"],
    },
  },
  {
    name: "stagehand_mailbox_opener_presets",
    description: "Update mailbox thread opener presets for the guild.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, presets: {} },
      required: ["presets"],
    },
  },

  // Roles
  {
    name: "stagehand_roles_sync",
    description:
      "Sync StageHand role lists to Discord roles. Save roles config via guild_update first. Ask for list contents/colors if missing.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, list_key: { type: "string" } },
    },
  },
  {
    name: "stagehand_roles_post_panel",
    description: "Post/refresh a roles picker panel message. Needs panel_key and panel channel in roles config.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, panel_key: { type: "string" } },
      required: ["panel_key"],
    },
  },

  // Challenges / IFTTT / live
  {
    name: "stagehand_challenges_export",
    description: "Export dice challenges config.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_challenges_import",
    description: "Import dice challenges config.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, payload: { type: "object" }, data: {} },
    },
  },
  {
    name: "stagehand_challenges_copy",
    description: "Copy challenges from another guild you can manage.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        source_guild_id: { type: "string" },
      },
      required: ["source_guild_id"],
    },
  },
  {
    name: "stagehand_challenges_post_finish",
    description: "Post challenges finish button to a channel. Ask for channel_id if missing.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        channel_id: { type: "string" },
        payload: { type: "object" },
      },
    },
  },
  {
    name: "stagehand_ifttt_pending_list",
    description: "List pending classic IFTTT / Rules & Watchers reminders.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_ifttt_pending_cancel",
    description: "Cancel a pending IFTTT reminder by id.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        reminder_id: { type: "string" },
        id: { type: "string" },
      },
    },
  },
  {
    name: "stagehand_dice_presets_live",
    description: "Live dice presets from the StageHand bot for the guild.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_calendar_live",
    description: "Live calendar preview from the StageHand bot.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_reputation_live",
    description: "Live reputation data (optional muse_id).",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, muse_id: { type: "string" } },
    },
  },
  {
    name: "stagehand_list_claims",
    description:
      "List Flow Builder claim pools for a guild (phone, locker, badge, …) and the saved claims. Optional pool filter. Use when the user asks about pools/claims on a server.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        pool: {
          type: "string",
          description: "Optional pool name filter (e.g. phone)",
        },
        include_claims: {
          type: "boolean",
          description: "Include claim rows (default true). Set false for pool names only.",
        },
      },
    },
  },
  {
    name: "stagehand_lookup_claim",
    description:
      "Look up one claim in a pool by muse name, label, or value fragment (e.g. pool=phone, query=Luné).",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        pool: { type: "string", description: "Pool name (required)" },
        query: {
          type: "string",
          description: "Muse name, label, or value to search",
        },
      },
      required: ["pool", "query"],
    },
  },
  {
    name: "stagehand_muse_claims",
    description:
      "List all claim-pool values held by one muse id (optional comma-separated pools filter).",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        muse_id: { type: "string", description: "Muse snowflake / id" },
        pools: {
          type: "string",
          description: "Optional comma-separated pool names",
        },
      },
      required: ["muse_id"],
    },
  },
  {
    name: "stagehand_birthdays_list",
    description: "List birthdays (live bot API).",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_birthday_create",
    description: "Create a birthday entry. Ask for date and target user/muse fields the bot expects.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, payload: { type: "object" } },
      required: ["payload"],
    },
  },
  {
    name: "stagehand_birthday_patch",
    description: "Update a birthday entry.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        birthday_id: { type: "string" },
        payload: { type: "object" },
      },
      required: ["birthday_id", "payload"],
    },
  },
  {
    name: "stagehand_birthday_delete",
    description: "Delete a birthday entry.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, birthday_id: { type: "string" } },
      required: ["birthday_id"],
    },
  },
  {
    name: "stagehand_birthday_settings",
    description: "Patch birthday announce settings for the guild. Ask for announce channel if needed.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, payload: { type: "object" } },
      required: ["payload"],
    },
  },

  // Index extras
  {
    name: "stagehand_group_index_upsert",
    description: "Create/update a group index (multi-forum → one channel). Needs target_channel_id + group_index_name.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, index_data: { type: "object" } },
      required: ["index_data"],
    },
  },
  {
    name: "stagehand_group_index_delete",
    description: "Delete a group index by target_channel_id.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, target_channel_id: { type: "string" } },
      required: ["target_channel_id"],
    },
  },
  {
    name: "stagehand_layered_index_upsert",
    description: "Create/update a layered index.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, index_data: { type: "object" } },
      required: ["index_data"],
    },
  },
  {
    name: "stagehand_layered_index_delete",
    description: "Delete a layered index by target_channel_id.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, target_channel_id: { type: "string" } },
      required: ["target_channel_id"],
    },
  },
  {
    name: "stagehand_index_materialize_thumbs",
    description: "Repair/link index thumbnail files (optional dry_run).",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, dry_run: { type: "boolean" } },
    },
  },

  // Lore extras
  {
    name: "stagehand_lore_snippet_delete",
    description: "Delete a lore snippet by id.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, snippet_id: { type: "string" } },
      required: ["snippet_id"],
    },
  },
  {
    name: "stagehand_lore_export",
    description: "Export lore panels/selectors/snippets/carousels for the guild.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_lore_import",
    description: "Import a lore export payload into the guild.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, payload: { type: "object" } },
      required: ["payload"],
    },
  },
  {
    name: "stagehand_lore_selector_upsert",
    description: "Create/update a lore carousel selector. Ask for channel_id.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, selector_data: { type: "object" } },
      required: ["selector_data"],
    },
  },
  {
    name: "stagehand_lore_selector_delete",
    description: "Delete a lore selector by key.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, selector_key: { type: "string" } },
      required: ["selector_key"],
    },
  },
  {
    name: "stagehand_lore_carousel_upsert",
    description: "Create/update a lore carousel.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, carousel_data: { type: "object" } },
      required: ["carousel_data"],
    },
  },
  {
    name: "stagehand_lore_carousel_delete",
    description: "Delete a lore carousel by key.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, carousel_key: { type: "string" } },
      required: ["carousel_key"],
    },
  },
  {
    name: "stagehand_lore_validate_layout",
    description: "Validate a lore panel layout object before saving.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, panel: { type: "object" } },
      required: ["panel"],
    },
  },

  // Side-effect actions
  {
    name: "stagehand_verification_post_honeypot",
    description: "Post/refresh verification honeypot bait (needs honeypot enabled + channel in config).",
    inputSchema: { type: "object", properties: { ...guildIdProp, ...actorIdProp } },
  },
  {
    name: "stagehand_ticker_test_post",
    description: "Post one ticker test line (does not advance rotation). Ask for feed_id if not main.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, feed_id: { type: "string" } },
    },
  },
  {
    name: "stagehand_dice_images_list",
    description: "List uploaded dice face images for a set/die_type.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        set_name: { type: "string" },
        die_type: { type: "string" },
      },
      required: ["set_name", "die_type"],
    },
  },
  {
    name: "stagehand_dice_images_delete",
    description: "Delete one dice face image.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        set_name: { type: "string" },
        die_type: { type: "string" },
        face: { type: "string" },
      },
      required: ["set_name", "die_type", "face"],
    },
  },
  {
    name: "stagehand_scene_image_delete",
    description: "Delete a scene/index/bot/ticker image by slot (+ preset_name/url as needed).",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        slot: { type: "string" },
        preset_name: { type: "string" },
        url: { type: "string" },
      },
      required: ["slot"],
    },
  },
  {
    name: "stagehand_emoji_stats",
    description: "Guild emoji usage stats StageHand has recorded.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_emojis_delete",
    description:
      "Delete Discord server emoji ids via StageHand (Manage Expressions). Confirm with the user — this is a Discord deletion, not just StageHand config.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        emoji_ids: { type: "array", items: { type: "string" } },
      },
      required: ["emoji_ids"],
    },
  },

  // MIA & Hiatus
  {
    name: "stagehand_mia_hiatus_surface",
    description: "Read MIA & Hiatus surface for the guild.",
    inputSchema: { type: "object", properties: { ...guildIdProp } },
  },
  {
    name: "stagehand_mia_hiatus_migration_mode",
    description: "Set MIA/Hiatus migration mode.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, mode: {} },
      required: ["mode"],
    },
  },
  {
    name: "stagehand_mia_hiatus_mia_enabled",
    description: "Enable/disable MIA tracking.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, enabled: { type: "boolean" } },
      required: ["enabled"],
    },
  },
  {
    name: "stagehand_mia_hiatus_hiatus_upsert",
    description: "Create/update a hiatus entry. Ask for player_name, dates, character as needed.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        user_id: { type: "string" },
        player_name: { type: "string" },
        character: { type: "string" },
        kind: { type: "string" },
        start: { type: "string" },
        end: { type: "string" },
        indefinite: { type: "boolean" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "stagehand_mia_hiatus_hiatus_end",
    description: "End hiatus for a player_name.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, player_name: { type: "string" } },
      required: ["player_name"],
    },
  },
  {
    name: "stagehand_mia_hiatus_mia_clear",
    description: "Clear MIA mark for a player_name.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, player_name: { type: "string" } },
      required: ["player_name"],
    },
  },
  {
    name: "stagehand_mia_hiatus_mia_mark",
    description: "Mark a player_name as MIA.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, player_name: { type: "string" } },
      required: ["player_name"],
    },
  },
  {
    name: "stagehand_mia_hiatus_policy_update",
    description: "Patch MIA/Hiatus policy object.",
    inputSchema: {
      type: "object",
      properties: { ...guildIdProp, ...actorIdProp, patch: { type: "object" } },
      required: ["patch"],
    },
  },
  {
    name: "stagehand_mia_hiatus_activity_touch",
    description: "Staff activity check-in for a user_id (clears MIA when policy allows).",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        user_id: { type: "string" },
        player_name: { type: "string" },
        channel_id: { type: "string" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "stagehand_mia_hiatus_events",
    description: "List MIA/Hiatus events.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        user_id: { type: "string" },
        player_name: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "stagehand_mia_hiatus_submit_config",
    description: "Configure hiatus submit mode / template channel / markdown.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        mode: { type: "string" },
        date_order: { type: "string" },
        template_channel_id: {},
        channel_template_markdown: { type: "string" },
      },
    },
  },
  {
    name: "stagehand_mia_hiatus_post_staff_template",
    description: "Post the hiatus staff template to a channel. Ask for channel_id.",
    inputSchema: {
      type: "object",
      properties: {
        ...guildIdProp,
        ...actorIdProp,
        channel_id: { type: "string" },
      },
      required: ["channel_id"],
    },
  },
];

export const toolList: Tool[] = annotateTools(_rawToolList);
