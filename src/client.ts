import type { StagehandConfig } from "./config.js";
import { redactSecrets } from "./security.js";

export class StagehandApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(message);
    this.name = "StagehandApiError";
  }
}

export class StagehandClient {
  constructor(private readonly config: StagehandConfig) {}

  get defaults() {
    return {
      guildId: this.config.defaultGuildId,
      actorId: this.config.actorId,
      controlPlaneUrl: this.config.controlPlaneUrl,
      authMode: this.config.authMode,
    };
  }

  /** For auth diagnostics only — never the raw token. */
  tokenFingerprint(): string {
    const t = this.config.bearerToken;
    if (t.length <= 8) return "****";
    return `${t.slice(0, 4)}…${t.slice(-4)}`;
  }

  resolveGuildId(guildId?: string | null): string {
    const id = (guildId || this.config.defaultGuildId || "").trim();
    if (!id) {
      throw new Error("guild_id required (or set STAGEHAND_DEFAULT_GUILD_ID)");
    }
    return id;
  }

  resolveActorId(actorId?: string | null): string {
    const id = (actorId || this.config.actorId || "").trim();
    if (id) return id;
    if (this.config.authMode === "user_key") {
      // Placeholder — CP binds the real Discord id from the sh_ / OAuth key.
      return "0";
    }
    throw new Error("actor_id required (or set STAGEHAND_ACTOR_ID)");
  }

  /** Query params for GET /v1/stagehand/surface (always includes actor_id). */
  surfaceQuery(guildId?: string | null, actorId?: string | null): Record<string, string> {
    return {
      guild_id: this.resolveGuildId(guildId),
      actor_id: this.resolveActorId(actorId),
    };
  }

  /**
   * Ensure JSON bodies include actor_id for StageHand write routes.
   * User keys: CP overwrites with the key owner; placeholder "0" is still required by some validators.
   */
  private withActorBody(body: unknown): unknown {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return body ?? {};
    }
    const obj = body as Record<string, unknown>;
    const raw = obj.actor_id ?? obj.actorId;
    const asStr = raw == null ? "" : String(raw).trim();
    if (asStr && asStr !== "0") return obj;
    try {
      return { ...obj, actor_id: this.resolveActorId(asStr || null) };
    } catch {
      return obj;
    }
  }

  /** Some GETs (surface) require actor_id even when the tool only knows guild_id. */
  private withActorQuery(
    path: string,
    query?: Record<string, string>
  ): Record<string, string> | undefined {
    const q = { ...(query || {}) };
    const needsActor =
      path.includes("/stagehand/surface") ||
      path.includes("/stagehand/user/");
    if (!needsActor) return query;
    const raw = (q.actor_id || "").trim();
    if (raw && raw !== "0") return q;
    try {
      q.actor_id = this.resolveActorId(raw || null);
    } catch {
      /* ops token without actor — leave unset */
    }
    return q;
  }

  private url(path: string): string {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${this.config.controlPlaneUrl}${p}`;
  }

  private authHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.bearerToken}`,
      ...extra,
    };
  }

  private safeMessage(status: number, text: string): string {
    const redacted = redactSecrets(text.slice(0, 500), [this.config.bearerToken]);
    if (status === 401 || status === 403) {
      return `StageHand API ${status}: authentication failed. Check STAGEHAND_API_KEY (sh_…) or CONTROL_PLANE_TOKEN, Manage Server on the guild, and CONTROL_PLANE_URL. Detail: ${redacted}`;
    }
    return `StageHand API ${status}: ${redacted}`;
  }

  async getJson<T = unknown>(path: string, query?: Record<string, string>): Promise<T> {
    const q = this.withActorQuery(path, query);
    const u = new URL(this.url(path));
    if (q) {
      for (const [k, v] of Object.entries(q)) {
        if (v !== undefined && v !== "") u.searchParams.set(k, v);
      }
    }
    const res = await fetch(u, {
      method: "GET",
      headers: this.authHeaders({ Accept: "application/json" }),
    });
    return this.parseJson<T>(res);
  }

  async postJson<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.url(path), {
      method: "POST",
      headers: this.authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(this.withActorBody(body)),
    });
    return this.parseJson<T>(res);
  }

  async patchJson<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.url(path), {
      method: "PATCH",
      headers: this.authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(this.withActorBody(body)),
    });
    return this.parseJson<T>(res);
  }

  async putJson<T = unknown>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.url(path), {
      method: "PUT",
      headers: this.authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(this.withActorBody(body)),
    });
    return this.parseJson<T>(res);
  }

  async deleteJson<T = unknown>(path: string, query?: Record<string, string>): Promise<T> {
    const u = new URL(this.url(path));
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== "") u.searchParams.set(k, v);
      }
    }
    const res = await fetch(u, {
      method: "DELETE",
      headers: this.authHeaders({ Accept: "application/json" }),
    });
    return this.parseJson<T>(res);
  }

  async postMultipart<T = unknown>(
    path: string,
    fields: Record<string, string>,
    file: { fieldName: string; filename: string; bytes: Uint8Array; contentType?: string },
    query?: Record<string, string>
  ): Promise<T> {
    const u = new URL(this.url(path));
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== "") u.searchParams.set(k, v);
      }
    }
    // User API keys require guild_id on the query for multipart
    if (fields.guild_id && !u.searchParams.get("guild_id")) {
      u.searchParams.set("guild_id", fields.guild_id);
    }

    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) {
      form.append(k, v);
    }
    const blob = new Blob([Buffer.from(file.bytes)], {
      type: file.contentType || guessContentType(file.filename),
    });
    form.append(file.fieldName, blob, file.filename);

    const res = await fetch(u, {
      method: "POST",
      headers: this.authHeaders({ Accept: "application/json" }),
      body: form,
    });
    return this.parseJson<T>(res);
  }

  private async parseJson<T>(res: Response): Promise<T> {
    const text = await res.text();
    if (!res.ok) {
      throw new StagehandApiError(this.safeMessage(res.status, text), res.status, text);
    }
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new StagehandApiError(
        this.safeMessage(res.status, `Invalid JSON: ${text.slice(0, 200)}`),
        res.status,
        text
      );
    }
  }
}

function guessContentType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
