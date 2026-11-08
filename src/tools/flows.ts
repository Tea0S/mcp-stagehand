import { z } from "zod";
import type { StagehandClient } from "../client.js";
import { catalogByKind } from "./nodeCatalog.js";
import { errText, okJson, type ToolResult } from "./types.js";

type FlowNode = {
  id: string;
  kind: string;
  type: string;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
  [key: string]: unknown;
};

type FlowEdge = {
  from: string;
  to: string;
  branch?: string;
  [key: string]: unknown;
};

export type FlowGraph = {
  id: string;
  name: string;
  enabled?: boolean;
  group_id?: string | null;
  nodes: FlowNode[];
  edges: FlowEdge[];
  [key: string]: unknown;
};

type AdvancedConfig = {
  version?: number;
  enabled?: boolean;
  groups?: unknown[];
  flows?: FlowGraph[];
  [key: string]: unknown;
};

type SurfaceResponse = {
  config?: {
    iftttAdvanced?: AdvancedConfig;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
}).passthrough();

const NodeSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(["event", "condition", "action", "utility"]),
    type: z.string().min(1),
    config: z.record(z.unknown()).optional(),
    position: PositionSchema.optional(),
  })
  .passthrough();

const EdgeSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    branch: z.string().optional(),
  })
  .passthrough();

const FlowSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    enabled: z.boolean().optional(),
    group_id: z.string().nullable().optional(),
    nodes: z.array(NodeSchema).min(1),
    edges: z.array(EdgeSchema).default([]),
  })
  .passthrough();

const GuildActorSchema = z.object({
  guild_id: z.string().optional(),
  actor_id: z.string().optional(),
});

function normalizeAdvanced(raw: unknown): AdvancedConfig {
  const cfg = (raw && typeof raw === "object" ? raw : {}) as AdvancedConfig;
  return {
    ...cfg,
    version: typeof cfg.version === "number" ? cfg.version : 1,
    enabled: cfg.enabled !== false,
    groups: Array.isArray(cfg.groups) ? cfg.groups : [],
    flows: Array.isArray(cfg.flows) ? (cfg.flows as FlowGraph[]) : [],
  };
}

async function readAdvanced(
  client: StagehandClient,
  guildId: string
): Promise<AdvancedConfig> {
  const surface = await client.getJson<SurfaceResponse>(
    "/v1/stagehand/surface",
    client.surfaceQuery(guildId)
  );
  return normalizeAdvanced(surface?.config?.iftttAdvanced);
}

async function writeAdvanced(
  client: StagehandClient,
  guildId: string,
  actorId: string,
  payload: AdvancedConfig
): Promise<unknown> {
  return client.postJson("/v1/stagehand/config/guild-update", {
    guild_id: guildId,
    actor_id: actorId,
    section: "iftttAdvanced",
    guild_payload: {
      version: payload.version ?? 1,
      enabled: payload.enabled !== false,
      groups: payload.groups ?? [],
      flows: payload.flows ?? [],
    },
  });
}

function unwrapFlow(input: unknown): unknown {
  if (input && typeof input === "object" && "flow" in (input as object)) {
    return (input as { flow: unknown }).flow;
  }
  return input;
}

const ListSchema = GuildActorSchema;

export async function flowsListHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = ListSchema.parse(args ?? {});
    const guildId = client.resolveGuildId(a.guild_id);
    const advanced = await readAdvanced(client, guildId);
    const flows = (advanced.flows || []).map((f) => ({
      id: f.id,
      name: f.name,
      enabled: f.enabled !== false,
      group_id: f.group_id ?? null,
      node_count: Array.isArray(f.nodes) ? f.nodes.length : 0,
      edge_count: Array.isArray(f.edges) ? f.edges.length : 0,
    }));
    return okJson({
      guild_id: guildId,
      enabled: advanced.enabled !== false,
      version: advanced.version ?? 1,
      flow_count: flows.length,
      flows,
      note: "Use stagehand_flow_get for full nodes/edges, or stagehand_flow_upsert to create/update.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const GetSchema = GuildActorSchema.extend({
  flow_id: z.string().min(1),
});

export async function flowGetHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = GetSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const advanced = await readAdvanced(client, guildId);
    const flow = (advanced.flows || []).find((f) => String(f.id) === a.flow_id);
    if (!flow) {
      return errText(`Flow not found: ${a.flow_id}`);
    }
    return okJson({ guild_id: guildId, flow });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const UpsertSchema = GuildActorSchema.extend({
  flow: z.unknown(),
  replace_existing: z.boolean().optional(),
});

export async function flowUpsertHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = UpsertSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const actorId = client.resolveActorId(a.actor_id);
    const parsed = FlowSchema.parse(unwrapFlow(a.flow));
    const flow = parsed as FlowGraph;

    const advanced = await readAdvanced(client, guildId);
    const flows = [...(advanced.flows || [])];
    const idx = flows.findIndex((f) => String(f.id) === String(flow.id));
    if (idx >= 0) {
      flows[idx] = { ...flows[idx], ...flow, id: flow.id, nodes: flow.nodes, edges: flow.edges };
    } else {
      flows.push({
        enabled: true,
        ...flow,
      });
    }

    const payload: AdvancedConfig = {
      ...advanced,
      version: advanced.version ?? 1,
      enabled: true,
      groups: advanced.groups ?? [],
      flows,
    };

    const writeResult = await writeAdvanced(client, guildId, actorId, payload);
    return okJson({
      guild_id: guildId,
      flow_id: flow.id,
      flow_name: flow.name,
      created: idx < 0,
      updated: idx >= 0,
      flow_count: flows.length,
      write_result: writeResult,
      note: "Flow saved to StageHand Flow Builder (iftttAdvanced). Bot sync was requested by the control plane.",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const DeleteSchema = GuildActorSchema.extend({
  flow_id: z.string().min(1),
});

export async function flowDeleteHandler(
  args: unknown,
  client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = DeleteSchema.parse(args);
    const guildId = client.resolveGuildId(a.guild_id);
    const actorId = client.resolveActorId(a.actor_id);
    const advanced = await readAdvanced(client, guildId);
    const before = advanced.flows || [];
    const flows = before.filter((f) => String(f.id) !== a.flow_id);
    if (flows.length === before.length) {
      return errText(`Flow not found: ${a.flow_id}`);
    }
    const writeResult = await writeAdvanced(client, guildId, actorId, {
      ...advanced,
      flows,
      enabled: true,
    });
    return okJson({
      guild_id: guildId,
      deleted_flow_id: a.flow_id,
      flow_count: flows.length,
      write_result: writeResult,
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}

const CatalogSchema = z.object({
  kind: z.enum(["event", "condition", "action"]).optional(),
});

export async function flowNodeCatalogHandler(
  args: unknown,
  _client: StagehandClient
): Promise<ToolResult> {
  try {
    const a = CatalogSchema.parse(args ?? {});
    const nodes = catalogByKind(a.kind);
    return okJson({
      kind_filter: a.kind || null,
      count: nodes.length,
      nodes,
      shape_reminder: {
        flow: {
          id: "stable_id",
          name: "Display name",
          enabled: true,
          nodes: [
            {
              id: "evt-1",
              kind: "event",
              type: "custom_slash_command",
              config: {},
              position: { x: 80, y: 160 },
            },
            {
              id: "act-1",
              kind: "action",
              type: "dm",
              config: { message: "Hello {user}" },
              position: { x: 420, y: 160 },
            },
          ],
          edges: [{ from: "evt-1", to: "act-1" }],
        },
      },
      docs: "https://stagehand.quest/docs",
    });
  } catch (e) {
    return errText(e instanceof Error ? e.message : String(e));
  }
}
