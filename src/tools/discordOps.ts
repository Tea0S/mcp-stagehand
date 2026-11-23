import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { errText, okJson, type ToolResult } from "./types.js";

const guildOpt = z.string().optional();

function gid(client: StagehandClient, guildId?: string) {
  return client.resolveGuildId(guildId);
}

function bodyGuild(client: StagehandClient, a: { guild_id?: string; [k: string]: unknown }) {
  return { ...a, guild_id: gid(client, a.guild_id) };
}

async function wrap(fn: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return okJson(await fn());
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

export async function discordBotCapabilitiesHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  return wrap(async () => {
    const a = z.object({ guild_id: guildOpt }).parse(args ?? {});
    return client.getJson("/v1/stagehand/discord/bot-capabilities", {
      guild_id: gid(client, a.guild_id),
    });
  });
}

export async function discordCreateCategoryHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        name: z.string().min(1),
        position: z.number().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.postJson("/v1/stagehand/discord/categories", bodyGuild(client, a));
  });
}

export async function discordEditCategoryHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        category_id: z.string().min(1),
        name: z.string().optional(),
        position: z.number().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    const { category_id, ...rest } = a;
    return client.patchJson(
      `/v1/stagehand/discord/categories/${encodeURIComponent(category_id)}`,
      bodyGuild(client, rest)
    );
  });
}

export async function discordDeleteCategoryHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        category_id: z.string().min(1),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.deleteJson(
      `/v1/stagehand/discord/categories/${encodeURIComponent(a.category_id)}`,
      { body: bodyGuild(client, { guild_id: a.guild_id, reason: a.reason }) }
    );
  });
}

export async function discordGetChannelHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
      })
      .parse(args);
    return client.getJson(
      `/v1/stagehand/discord/channels/${encodeURIComponent(a.channel_id)}`,
      { guild_id: gid(client, a.guild_id) }
    );
  });
}

export async function discordCreateTextChannelHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        name: z.string().optional(),
        channel_name: z.string().optional(),
        topic: z.string().optional(),
        category_id: z.string().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    const name = a.name || a.channel_name;
    if (!name) throw new Error("name (or channel_name) required");
    return client.postJson(
      "/v1/stagehand/discord/channels/text",
      bodyGuild(client, { ...a, name })
    );
  });
}

export async function discordCreateForumChannelHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        name: z.string().min(1),
        topic: z.string().optional(),
        category_id: z.string().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.postJson("/v1/stagehand/discord/channels/forum", bodyGuild(client, a));
  });
}

export async function discordCreateVoiceChannelHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        name: z.string().optional(),
        channel_name: z.string().optional(),
        category_id: z.string().optional(),
        user_limit: z.number().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    const name = a.name || a.channel_name;
    if (!name) throw new Error("name (or channel_name) required");
    return client.postJson(
      "/v1/stagehand/discord/channels/voice",
      bodyGuild(client, { ...a, name })
    );
  });
}

export async function discordEditChannelHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        name: z.string().optional(),
        topic: z.string().optional(),
        parent_id: z.string().optional(),
        position: z.number().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    const { channel_id, ...rest } = a;
    return client.patchJson(
      `/v1/stagehand/discord/channels/${encodeURIComponent(channel_id)}`,
      bodyGuild(client, rest)
    );
  });
}

export async function discordDeleteChannelHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.deleteJson(
      `/v1/stagehand/discord/channels/${encodeURIComponent(a.channel_id)}`,
      { body: bodyGuild(client, { guild_id: a.guild_id, reason: a.reason }) }
    );
  });
}

export async function discordSetChannelPermissionsHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        target_id: z.string().optional(),
        role_id: z.string().optional(),
        allow: z.array(z.string()).optional(),
        deny: z.array(z.string()).optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    const target = a.target_id || a.role_id;
    if (!target) throw new Error("target_id (or role_id) required");
    return client.putJson(
      `/v1/stagehand/discord/channels/${encodeURIComponent(a.channel_id)}/permissions/${encodeURIComponent(target)}`,
      bodyGuild(client, {
        guild_id: a.guild_id,
        allow: a.allow,
        deny: a.deny,
        reason: a.reason,
      })
    );
  });
}

export async function discordRemoveChannelPermissionsHandler(
  args: unknown,
  client: StagehandClient
) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        target_id: z.string().optional(),
        role_id: z.string().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    const target = a.target_id || a.role_id;
    if (!target) throw new Error("target_id (or role_id) required");
    return client.deleteJson(
      `/v1/stagehand/discord/channels/${encodeURIComponent(a.channel_id)}/permissions/${encodeURIComponent(target)}`,
      { body: bodyGuild(client, { guild_id: a.guild_id, reason: a.reason }) }
    );
  });
}

export async function discordListRolesHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z.object({ guild_id: guildOpt }).parse(args ?? {});
    return client.getJson("/v1/stagehand/discord/roles", { guild_id: gid(client, a.guild_id) });
  });
}

export async function discordCreateRoleHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        name: z.string().min(1),
        color: z.union([z.string(), z.number()]).optional(),
        hoist: z.boolean().optional(),
        mentionable: z.boolean().optional(),
        permissions: z.array(z.string()).optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.postJson("/v1/stagehand/discord/roles", bodyGuild(client, a));
  });
}

export async function discordEditRoleHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        role_id: z.string().min(1),
        name: z.string().optional(),
        color: z.union([z.string(), z.number()]).optional(),
        hoist: z.boolean().optional(),
        mentionable: z.boolean().optional(),
        permissions: z.array(z.string()).optional(),
        position: z.number().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    const { role_id, ...rest } = a;
    return client.patchJson(
      `/v1/stagehand/discord/roles/${encodeURIComponent(role_id)}`,
      bodyGuild(client, rest)
    );
  });
}

export async function discordDeleteRoleHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        role_id: z.string().min(1),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.deleteJson(
      `/v1/stagehand/discord/roles/${encodeURIComponent(a.role_id)}`,
      { body: bodyGuild(client, { guild_id: a.guild_id, reason: a.reason }) }
    );
  });
}

export async function discordAssignRoleHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        user_id: z.string().min(1),
        role_id: z.string().min(1),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.putJson(
      `/v1/stagehand/discord/members/${encodeURIComponent(a.user_id)}/roles/${encodeURIComponent(a.role_id)}`,
      bodyGuild(client, { guild_id: a.guild_id, reason: a.reason })
    );
  });
}

export async function discordRemoveRoleHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        user_id: z.string().min(1),
        role_id: z.string().min(1),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.deleteJson(
      `/v1/stagehand/discord/members/${encodeURIComponent(a.user_id)}/roles/${encodeURIComponent(a.role_id)}`,
      { body: bodyGuild(client, { guild_id: a.guild_id, reason: a.reason }) }
    );
  });
}

export async function discordGetForumChannelsHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z.object({ guild_id: guildOpt }).parse(args ?? {});
    return client.getJson("/v1/stagehand/discord/forum-channels", {
      guild_id: gid(client, a.guild_id),
    });
  });
}

export async function discordCreateForumPostHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        forum_channel_id: z.string().min(1),
        title: z.string().min(1),
        content: z.string().min(1),
        tags: z.array(z.string()).optional(),
        pinned: z.boolean().optional(),
      })
      .parse(args);
    return client.postJson("/v1/stagehand/discord/forum-posts", bodyGuild(client, a));
  });
}

export async function discordGetForumPostHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({ guild_id: guildOpt, thread_id: z.string().min(1) })
      .parse(args);
    return client.getJson(
      `/v1/stagehand/discord/forum-posts/${encodeURIComponent(a.thread_id)}`,
      { guild_id: gid(client, a.guild_id) }
    );
  });
}

export async function discordListForumThreadsHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        forum_channel_id: z.string().min(1),
        include_archived: z.boolean().optional(),
        limit: z.number().optional(),
      })
      .parse(args);
    const q: Record<string, string> = { guild_id: gid(client, a.guild_id) };
    if (a.include_archived !== undefined) q.include_archived = String(a.include_archived);
    if (a.limit !== undefined) q.limit = String(a.limit);
    return client.getJson(
      `/v1/stagehand/discord/forum-channels/${encodeURIComponent(a.forum_channel_id)}/threads`,
      q
    );
  });
}

export async function discordReplyToForumHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        thread_id: z.string().min(1),
        message: z.string().min(1),
      })
      .parse(args);
    return client.postJson(
      `/v1/stagehand/discord/forum-posts/${encodeURIComponent(a.thread_id)}/reply`,
      bodyGuild(client, { guild_id: a.guild_id, message: a.message })
    );
  });
}

export async function discordUpdateForumPostHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        thread_id: z.string().min(1),
        name: z.string().optional(),
        tags: z.array(z.string()).optional(),
        archived: z.boolean().optional(),
        locked: z.boolean().optional(),
        pinned: z.boolean().optional(),
      })
      .parse(args);
    const { thread_id, ...rest } = a;
    return client.patchJson(
      `/v1/stagehand/discord/forum-posts/${encodeURIComponent(thread_id)}`,
      bodyGuild(client, rest)
    );
  });
}

export async function discordDeleteForumPostHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        thread_id: z.string().min(1),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.deleteJson(
      `/v1/stagehand/discord/forum-posts/${encodeURIComponent(a.thread_id)}`,
      { body: bodyGuild(client, { guild_id: a.guild_id, reason: a.reason }) }
    );
  });
}

export async function discordGetForumTagsHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({ guild_id: guildOpt, forum_channel_id: z.string().min(1) })
      .parse(args);
    return client.getJson(
      `/v1/stagehand/discord/forum-channels/${encodeURIComponent(a.forum_channel_id)}/tags`,
      { guild_id: gid(client, a.guild_id) }
    );
  });
}

export async function discordSetForumTagsHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        forum_channel_id: z.string().min(1),
        tags: z.array(
          z.object({
            name: z.string(),
            emoji: z.string().optional(),
            moderated: z.boolean().optional(),
          })
        ),
      })
      .parse(args);
    return client.putJson(
      `/v1/stagehand/discord/forum-channels/${encodeURIComponent(a.forum_channel_id)}/tags`,
      bodyGuild(client, { guild_id: a.guild_id, tags: a.tags })
    );
  });
}

export async function discordSendHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        message: z.string().min(1),
        reply_to_message_id: z.string().optional(),
      })
      .parse(args);
    return client.postJson("/v1/stagehand/discord/messages", bodyGuild(client, a));
  });
}

export async function discordReadMessagesHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        limit: z.number().optional(),
        before: z.string().optional(),
        after: z.string().optional(),
        around: z.string().optional(),
      })
      .parse(args);
    const q: Record<string, string> = {
      guild_id: gid(client, a.guild_id),
      channel_id: a.channel_id,
    };
    if (a.limit !== undefined) q.limit = String(a.limit);
    if (a.before) q.before = a.before;
    if (a.after) q.after = a.after;
    if (a.around) q.around = a.around;
    return client.getJson("/v1/stagehand/discord/messages", q);
  });
}

export async function discordEditMessageHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        message_id: z.string().min(1),
        content: z.string().min(1),
      })
      .parse(args);
    return client.patchJson(
      `/v1/stagehand/discord/messages/${encodeURIComponent(a.message_id)}`,
      bodyGuild(client, {
        guild_id: a.guild_id,
        channel_id: a.channel_id,
        content: a.content,
      })
    );
  });
}

export async function discordDeleteMessageHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        message_id: z.string().min(1),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.deleteJson(
      `/v1/stagehand/discord/messages/${encodeURIComponent(a.message_id)}`,
      { body: bodyGuild(client, {
        guild_id: a.guild_id,
        channel_id: a.channel_id,
        reason: a.reason,
      }) }
    );
  });
}

export async function discordAddReactionHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        message_id: z.string().min(1),
        emoji: z.string().min(1),
      })
      .parse(args);
    return client.putJson(
      `/v1/stagehand/discord/messages/${encodeURIComponent(a.message_id)}/reactions`,
      bodyGuild(client, {
        guild_id: a.guild_id,
        channel_id: a.channel_id,
        emoji: a.emoji,
      })
    );
  });
}

export async function discordAddMultipleReactionsHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        message_id: z.string().min(1),
        emojis: z.array(z.string()).min(1),
      })
      .parse(args);
    return client.postJson(
      `/v1/stagehand/discord/messages/${encodeURIComponent(a.message_id)}/reactions/batch`,
      bodyGuild(client, {
        guild_id: a.guild_id,
        channel_id: a.channel_id,
        emojis: a.emojis,
      })
    );
  });
}

export async function discordRemoveReactionHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        message_id: z.string().min(1),
        emoji: z.string().min(1),
        user_id: z.string().optional(),
      })
      .parse(args);
    return client.deleteJson(
      `/v1/stagehand/discord/messages/${encodeURIComponent(a.message_id)}/reactions`,
      { body: bodyGuild(client, {
        guild_id: a.guild_id,
        channel_id: a.channel_id,
        emoji: a.emoji,
        user_id: a.user_id,
      }) }
    );
  });
}

export async function discordGetReactionUsersHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        message_id: z.string().min(1),
        emoji: z.string().min(1),
        limit: z.number().optional(),
      })
      .parse(args);
    const q: Record<string, string> = {
      guild_id: gid(client, a.guild_id),
      channel_id: a.channel_id,
      emoji: a.emoji,
    };
    if (a.limit !== undefined) q.limit = String(a.limit);
    return client.getJson(
      `/v1/stagehand/discord/messages/${encodeURIComponent(a.message_id)}/reactions`,
      q
    );
  });
}

export async function discordPinMessageHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        message_id: z.string().min(1),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.putJson(
      `/v1/stagehand/discord/pins/${encodeURIComponent(a.message_id)}`,
      bodyGuild(client, {
        guild_id: a.guild_id,
        channel_id: a.channel_id,
        reason: a.reason,
      })
    );
  });
}

export async function discordUnpinMessageHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        message_id: z.string().min(1),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.deleteJson(
      `/v1/stagehand/discord/pins/${encodeURIComponent(a.message_id)}`,
      { body: bodyGuild(client, {
        guild_id: a.guild_id,
        channel_id: a.channel_id,
        reason: a.reason,
      }) }
    );
  });
}

export async function discordListPinnedMessagesHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        limit: z.number().optional(),
      })
      .parse(args);
    const q: Record<string, string> = {
      guild_id: gid(client, a.guild_id),
      channel_id: a.channel_id,
    };
    if (a.limit !== undefined) q.limit = String(a.limit);
    return client.getJson("/v1/stagehand/discord/pins", q);
  });
}

export async function discordListMembersHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        limit: z.number().optional(),
        after: z.string().optional(),
      })
      .parse(args ?? {});
    const q: Record<string, string> = { guild_id: gid(client, a.guild_id) };
    if (a.limit !== undefined) q.limit = String(a.limit);
    if (a.after) q.after = a.after;
    return client.getJson("/v1/stagehand/discord/members", q);
  });
}

export async function discordGetMemberHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({ guild_id: guildOpt, user_id: z.string().min(1) })
      .parse(args);
    return client.getJson(
      `/v1/stagehand/discord/members/${encodeURIComponent(a.user_id)}`,
      { guild_id: gid(client, a.guild_id) }
    );
  });
}

export async function discordCreateWebhookHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        channel_id: z.string().min(1),
        name: z.string().min(1),
        avatar: z.string().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.postJson("/v1/stagehand/discord/webhooks", bodyGuild(client, a));
  });
}

export async function discordEditWebhookHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        webhook_id: z.string().min(1),
        name: z.string().optional(),
        avatar: z.string().optional(),
        channel_id: z.string().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    const { webhook_id, ...rest } = a;
    return client.patchJson(
      `/v1/stagehand/discord/webhooks/${encodeURIComponent(webhook_id)}`,
      bodyGuild(client, rest)
    );
  });
}

export async function discordDeleteWebhookHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        webhook_id: z.string().min(1),
        webhook_token: z.string().optional(),
        reason: z.string().optional(),
      })
      .parse(args);
    return client.deleteJson(
      `/v1/stagehand/discord/webhooks/${encodeURIComponent(a.webhook_id)}`,
      { body: bodyGuild(client, {
        guild_id: a.guild_id,
        webhook_token: a.webhook_token,
        reason: a.reason,
      }) }
    );
  });
}

export async function discordSendWebhookMessageHandler(args: unknown, client: StagehandClient) {
  return wrap(async () => {
    const a = z
      .object({
        guild_id: guildOpt,
        webhook_id: z.string().min(1),
        webhook_token: z.string().min(1),
        content: z.string().min(1),
        username: z.string().optional(),
        avatar_url: z.string().optional(),
        thread_id: z.string().optional(),
      })
      .parse(args);
    return client.postJson(
      `/v1/stagehand/discord/webhooks/${encodeURIComponent(a.webhook_id)}/messages`,
      bodyGuild(client, a)
    );
  });
}
