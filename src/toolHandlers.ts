import type { StagehandClient } from "./client.js";
import type { ToolResult } from "./tools/types.js";
import { authCheckHandler } from "./tools/auth.js";
import {
  diceImagesDeleteHandler,
  diceImagesListHandler,
  emojiStatsHandler,
  emojisDeleteHandler,
  sceneImageDeleteHandler,
  tickerTestPostHandler,
  verificationPostHoneypotHandler,
} from "./tools/extraActions.js";
import {
  birthdayCreateHandler,
  birthdayDeleteHandler,
  birthdayPatchHandler,
  birthdaySettingsHandler,
  birthdaysListHandler,
  calendarLiveHandler,
  challengesCopyHandler,
  challengesExportHandler,
  challengesImportHandler,
  challengesPostFinishHandler,
  dicePresetsLiveHandler,
  iftttPendingCancelHandler,
  iftttPendingListHandler,
  reputationLiveHandler,
} from "./tools/extras.js";
import {
  formDeleteHandler,
  formExportHandler,
  formImportHandler,
  formUpsertHandler,
  formsPostPanelHandler,
} from "./tools/forms.js";
import {
  flowDeleteHandler,
  flowGetHandler,
  flowNodeCatalogHandler,
  flowsListHandler,
  flowUpsertHandler,
} from "./tools/flows.js";
import { guildUpdateHandler } from "./tools/guildUpdate.js";
import {
  groupIndexDeleteHandler,
  groupIndexUpsertHandler,
  indexDeleteHandler,
  indexMaterializeThumbsHandler,
  indexRefreshAllHandler,
  indexUpsertHandler,
  layeredIndexDeleteHandler,
  layeredIndexUpsertHandler,
} from "./tools/indexes.js";
import {
  loreCarouselDeleteHandler,
  loreCarouselUpsertHandler,
  loreExportHandler,
  loreImportHandler,
  lorePanelDeleteHandler,
  lorePanelUpsertHandler,
  loreSelectorDeleteHandler,
  loreSelectorUpsertHandler,
  loreSnippetDeleteHandler,
  loreSnippetUpsertHandler,
  loreValidateLayoutHandler,
} from "./tools/lore.js";
import {
  mailboxDeleteHandler,
  mailboxOpenerPresetsHandler,
  mailboxRefreshHandler,
  mailboxUpsertHandler,
} from "./tools/mailboxes.js";
import {
  miaHiatusActivityTouchHandler,
  miaHiatusEventsHandler,
  miaHiatusHiatusEndHandler,
  miaHiatusHiatusUpsertHandler,
  miaHiatusMiaClearHandler,
  miaHiatusMiaEnabledHandler,
  miaHiatusMiaMarkHandler,
  miaHiatusMigrationModeHandler,
  miaHiatusPolicyUpdateHandler,
  miaHiatusPostStaffTemplateHandler,
  miaHiatusSubmitConfigHandler,
  miaHiatusSurfaceHandler,
} from "./tools/miaHiatus.js";
import { rolesPostPanelHandler, rolesSyncHandler } from "./tools/roles.js";
import { setupRequirementsHandler } from "./tools/setupRequirements.js";
import {
  getSurfaceHandler,
  listChannelsHandler,
  listEmojisHandler,
} from "./tools/surface.js";
import {
  uploadAssetHandler,
  uploadIndexThumbHandler,
  uploadLoreBannerHandler,
} from "./tools/upload.js";

type Handler = (args: unknown, client: StagehandClient) => Promise<ToolResult>;

export const toolHandlers: Record<string, Handler> = {
  stagehand_auth_check: authCheckHandler,
  stagehand_setup_requirements: setupRequirementsHandler,
  stagehand_get_surface: getSurfaceHandler,
  stagehand_list_channels: listChannelsHandler,
  stagehand_list_emojis: listEmojisHandler,
  stagehand_guild_update: guildUpdateHandler,
  stagehand_upload_asset: uploadAssetHandler,

  stagehand_index_upsert: indexUpsertHandler,
  stagehand_index_upload_thumb: uploadIndexThumbHandler,
  stagehand_index_refresh_all: indexRefreshAllHandler,
  stagehand_index_delete: indexDeleteHandler,
  stagehand_group_index_upsert: groupIndexUpsertHandler,
  stagehand_group_index_delete: groupIndexDeleteHandler,
  stagehand_layered_index_upsert: layeredIndexUpsertHandler,
  stagehand_layered_index_delete: layeredIndexDeleteHandler,
  stagehand_index_materialize_thumbs: indexMaterializeThumbsHandler,

  stagehand_lore_panel_upsert: lorePanelUpsertHandler,
  stagehand_lore_panel_upload_banner: uploadLoreBannerHandler,
  stagehand_lore_panel_delete: lorePanelDeleteHandler,
  stagehand_lore_snippet_upsert: loreSnippetUpsertHandler,
  stagehand_lore_snippet_delete: loreSnippetDeleteHandler,
  stagehand_lore_export: loreExportHandler,
  stagehand_lore_import: loreImportHandler,
  stagehand_lore_selector_upsert: loreSelectorUpsertHandler,
  stagehand_lore_selector_delete: loreSelectorDeleteHandler,
  stagehand_lore_carousel_upsert: loreCarouselUpsertHandler,
  stagehand_lore_carousel_delete: loreCarouselDeleteHandler,
  stagehand_lore_validate_layout: loreValidateLayoutHandler,

  stagehand_flows_list: flowsListHandler,
  stagehand_flow_get: flowGetHandler,
  stagehand_flow_upsert: flowUpsertHandler,
  stagehand_flow_delete: flowDeleteHandler,
  stagehand_flow_node_catalog: flowNodeCatalogHandler,

  stagehand_form_upsert: formUpsertHandler,
  stagehand_form_delete: formDeleteHandler,
  stagehand_forms_post_panel: formsPostPanelHandler,
  stagehand_form_export: formExportHandler,
  stagehand_form_import: formImportHandler,

  stagehand_mailbox_upsert: mailboxUpsertHandler,
  stagehand_mailbox_delete: mailboxDeleteHandler,
  stagehand_mailbox_refresh: mailboxRefreshHandler,
  stagehand_mailbox_opener_presets: mailboxOpenerPresetsHandler,

  stagehand_roles_sync: rolesSyncHandler,
  stagehand_roles_post_panel: rolesPostPanelHandler,

  stagehand_challenges_export: challengesExportHandler,
  stagehand_challenges_import: challengesImportHandler,
  stagehand_challenges_copy: challengesCopyHandler,
  stagehand_challenges_post_finish: challengesPostFinishHandler,

  stagehand_ifttt_pending_list: iftttPendingListHandler,
  stagehand_ifttt_pending_cancel: iftttPendingCancelHandler,

  stagehand_dice_presets_live: dicePresetsLiveHandler,
  stagehand_calendar_live: calendarLiveHandler,
  stagehand_reputation_live: reputationLiveHandler,

  stagehand_birthdays_list: birthdaysListHandler,
  stagehand_birthday_create: birthdayCreateHandler,
  stagehand_birthday_patch: birthdayPatchHandler,
  stagehand_birthday_delete: birthdayDeleteHandler,
  stagehand_birthday_settings: birthdaySettingsHandler,

  stagehand_verification_post_honeypot: verificationPostHoneypotHandler,
  stagehand_ticker_test_post: tickerTestPostHandler,
  stagehand_dice_images_list: diceImagesListHandler,
  stagehand_dice_images_delete: diceImagesDeleteHandler,
  stagehand_scene_image_delete: sceneImageDeleteHandler,
  stagehand_emoji_stats: emojiStatsHandler,
  stagehand_emojis_delete: emojisDeleteHandler,

  stagehand_mia_hiatus_surface: miaHiatusSurfaceHandler,
  stagehand_mia_hiatus_migration_mode: miaHiatusMigrationModeHandler,
  stagehand_mia_hiatus_mia_enabled: miaHiatusMiaEnabledHandler,
  stagehand_mia_hiatus_hiatus_upsert: miaHiatusHiatusUpsertHandler,
  stagehand_mia_hiatus_hiatus_end: miaHiatusHiatusEndHandler,
  stagehand_mia_hiatus_mia_clear: miaHiatusMiaClearHandler,
  stagehand_mia_hiatus_mia_mark: miaHiatusMiaMarkHandler,
  stagehand_mia_hiatus_policy_update: miaHiatusPolicyUpdateHandler,
  stagehand_mia_hiatus_activity_touch: miaHiatusActivityTouchHandler,
  stagehand_mia_hiatus_events: miaHiatusEventsHandler,
  stagehand_mia_hiatus_submit_config: miaHiatusSubmitConfigHandler,
  stagehand_mia_hiatus_post_staff_template: miaHiatusPostStaffTemplateHandler,
};
