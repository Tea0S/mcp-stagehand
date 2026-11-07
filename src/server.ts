import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { StagehandClient } from "./client.js";
import type { StagehandConfig } from "./config.js";
import { promptList, renderPrompt } from "./prompts.js";
import { redactSecrets } from "./security.js";
import { toolHandlers } from "./toolHandlers.js";
import { toolList } from "./toolList.js";

export class StagehandMCPServer {
  private server: Server;
  private client: StagehandClient;
  private config: StagehandConfig;

  constructor(config: StagehandConfig) {
    this.config = config;
    this.client = new StagehandClient(config);
    this.server = new Server(
      {
        name: "MCP-StageHand",
        version: "1.3.1",
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: toolList,
    }));

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: promptList,
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const name = request.params.name;
      const args = (request.params.arguments || {}) as Record<string, string | undefined>;
      return renderPrompt(name, args);
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        const handler = toolHandlers[name];
        if (!handler) {
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
        }
        return await handler(args, this.client);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid arguments: ${error.errors
                  .map((e) => `${e.path.join(".")}: ${e.message}`)
                  .join(", ")}`,
              },
            ],
            isError: true,
          };
        }
        const raw = error instanceof Error ? error.message : String(error);
        const message = redactSecrets(raw, [this.config.bearerToken]);
        return {
          content: [{ type: "text", text: `Error executing tool: ${message}` }],
          isError: true,
        };
      }
    });
  }

  get mcpServer(): Server {
    return this.server;
  }
}
