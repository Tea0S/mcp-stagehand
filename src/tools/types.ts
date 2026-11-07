import type { StagehandClient } from "../client.js";

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export type ToolHandler = (
  args: unknown,
  client: StagehandClient
) => Promise<ToolResult>;

export function okJson(data: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function okText(text: string): ToolResult {
  return {
    content: [{ type: "text", text }],
  };
}

export function errText(message: string): ToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}
