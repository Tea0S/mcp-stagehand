/**
 * Curated Flow Builder node catalog (mirrors StageHand advanced IFTTT builtins).
 * Not exhaustive of every config field — enough for an agent to pick types safely.
 */

export type CatalogNode = {
  kind: "event" | "condition" | "action";
  type: string;
  summary: string;
  config_hints?: Record<string, string>;
};

export const FLOW_NODE_CATALOG: CatalogNode[] = [
  // Events
  {
    kind: "event",
    type: "member_join",
    summary: "Member joined the server",
  },
  {
    kind: "event",
    type: "member_remove",
    summary: "Member left the server",
  },
  {
    kind: "event",
    type: "member_role_added",
    summary: "Role added to a member",
    config_hints: { role_ids: "optional filter", mode: "any | all" },
  },
  {
    kind: "event",
    type: "member_role_removed",
    summary: "Role removed from a member",
  },
  {
    kind: "event",
    type: "thread_created",
    summary: "Forum thread created",
    config_hints: { forum_id: "optional forum filter" },
  },
  {
    kind: "event",
    type: "scene_opened",
    summary: "StageHand opened a scene",
    config_hints: {
      forum_id: "optional",
      scene_mode: "any | new_thread | persistent_hub",
    },
  },
  {
    kind: "event",
    type: "scene_end",
    summary: "StageHand closed a scene",
  },
  {
    kind: "event",
    type: "guild_channel_create",
    summary: "Channel or category created",
  },
  {
    kind: "event",
    type: "panel_button",
    summary: "Lore panel button pressed (link panel to this flow)",
  },
  {
    kind: "event",
    type: "custom_slash_command",
    summary: "Custom guild slash command",
    config_hints: {
      command_name: "required",
      command_description: "shown in Discord",
    },
  },
  {
    kind: "event",
    type: "custom_prefix_command",
    summary: "Custom !command / @bot command",
    config_hints: { command_name: "required" },
  },
  {
    kind: "event",
    type: "message_reaction_add",
    summary: "Reaction on a specific message",
    config_hints: { channel_id: "required", message_id: "required" },
  },
  { kind: "event", type: "mia_marked", summary: "Player added to MIA list" },
  { kind: "event", type: "mia_cleared", summary: "Player removed from MIA list" },
  { kind: "event", type: "hiatus_started", summary: "Hiatus became active" },
  { kind: "event", type: "hiatus_ended", summary: "Hiatus became inactive" },
  { kind: "event", type: "task_added", summary: "Task added on checklist" },
  { kind: "event", type: "task_completed", summary: "Task completed on checklist" },
  {
    kind: "event",
    type: "checklist_completed",
    summary: "All checklist tasks complete",
  },
  {
    kind: "event",
    type: "challenge_recorded",
    summary: "Dice challenge result recorded",
  },
  {
    kind: "event",
    type: "challenge_approved",
    summary: "Staff approved dice challenge",
  },

  // Common conditions (dashboard condition kinds)
  {
    kind: "condition",
    type: "has_role",
    summary: "Member has / lacks roles",
    config_hints: { role_ids: "snowflakes", mode: "any | all", invert: "bool" },
  },
  {
    kind: "condition",
    type: "channel_is",
    summary: "Event channel matches",
    config_hints: { channel_ids: "allowlist" },
  },

  // Actions (high-value subset + common builders)
  {
    kind: "action",
    type: "roles_add_remove",
    summary: "Add or remove roles on triggering member",
    config_hints: { add_role_ids: "[]", remove_role_ids: "[]" },
  },
  {
    kind: "action",
    type: "dm",
    summary: "DM the triggering member",
    config_hints: { message: "templates {user} {member}" },
  },
  {
    kind: "action",
    type: "channel_message",
    summary: "Send channel message or register reminder",
    config_hints: { channel_id: "optional", message: "required" },
  },
  {
    kind: "action",
    type: "delay",
    summary: "Wait (inline ≤1h; longer persists)",
    config_hints: { seconds: "number" },
  },
  {
    kind: "action",
    type: "wait_for_interaction",
    summary: "Pause for button click (persistent)",
    config_hints: {
      delivery: "trigger_thread | dm | channel",
      buttons: "[{label, style}]",
    },
  },
  { kind: "action", type: "reminder_add", summary: "Schedule channel reminder" },
  { kind: "action", type: "reminder_remove", summary: "Cancel reminders by key" },
  {
    kind: "action",
    type: "dice_post_preset",
    summary: "Post Dice preset buttons",
  },
  {
    kind: "action",
    type: "checklist_post_preset",
    summary: "Post checklist from preset",
  },
  { kind: "action", type: "index_refresh", summary: "Rebuild forum index" },
  { kind: "action", type: "ticket_open", summary: "Open Tickets ticket" },
  {
    kind: "action",
    type: "forum_thread_create",
    summary: "Create forum thread",
  },
  {
    kind: "action",
    type: "forum_thread_tags",
    summary: "Add/remove forum tags by name",
  },
  { kind: "action", type: "thread_archive", summary: "Archive/unarchive thread" },
  { kind: "action", type: "thread_rename", summary: "Rename thread from template" },
  { kind: "action", type: "thread_lock", summary: "Lock/unlock thread" },
  {
    kind: "action",
    type: "guild_emoji_create",
    summary: "Create server emoji from markup or CDN URL",
    config_hints: { source: "{command_args}", name: "optional emoji name" },
  },
  {
    kind: "action",
    type: "scene_open_prompt",
    summary: "Post persistent scene-setup button",
  },
  { kind: "action", type: "scene_close", summary: "Close scene (/scene end)" },
  {
    kind: "action",
    type: "personal_task_post",
    summary: "Post personal task list",
  },
  {
    kind: "action",
    type: "link_muse_thread",
    summary: "Link/unlink muse to command thread",
  },
  {
    kind: "action",
    type: "assign_claim",
    summary: "Save claim value in named pool",
  },
  {
    kind: "action",
    type: "enter_claim",
    summary: "Ask for text and save claim",
  },
  { kind: "action", type: "release_claim", summary: "Free a claim in a pool" },
  { kind: "action", type: "lookup_claim", summary: "Lookup claim in a pool" },
  {
    kind: "action",
    type: "post_claim_list",
    summary: "Post pool claims as directory",
  },
  {
    kind: "action",
    type: "generate_number",
    summary: "Random / phone number into pool",
  },
  {
    kind: "action",
    type: "draw_list",
    summary: "Pick random line from named list",
  },
  {
    kind: "action",
    type: "pick_from_list",
    summary: "Show list; save chosen line",
  },
];

export function catalogByKind(kind?: string | null) {
  const k = (kind || "").trim().toLowerCase();
  if (!k) return FLOW_NODE_CATALOG;
  return FLOW_NODE_CATALOG.filter((n) => n.kind === k);
}
