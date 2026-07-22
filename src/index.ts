import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Global Env type for Workers bindings
interface Env {
  AI: any;
  CONFIG: any;
  DB_INDUCT: any;
  DB_SKILLS: any;
  DB_GHOST: any;
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
  VERCEL_API_TOKEN?: string;
  GHOST_BUILD_API_KEY?: string;
  GHOST_BUILD_API_URL: string;
  TIGERDATA_API_KEY?: string;
  TIGERDATA_API_URL: string;
  PI_SANDBOX?: string;
  PI_WALLET_ADDRESS?: string;
}

// ── PAI-MCP Gateway: Unified MCP for the PAI Universe ──

export class PAIMCP extends McpAgent<Env> {
  declare env: Env;
  server = new McpServer({ name: "PAI-MCP-Gateway", version: "1.0.0" });

  async init() {
    const e = this.env;
    
    // ════════════════════════════════════
    // ☁️ Cloudflare — pai_cf_*
    // ════════════════════════════════════

    this.server.tool("pai_cf_deployWorker", "Deploy a CF Worker from source", {
      name: z.string().describe("Worker name"),
      code: z.string().describe("Worker source code"),
    }, async ({ name, code }) => {
      const { CF_ACCOUNT_ID, CF_API_TOKEN } = e;
      if (!CF_ACCOUNT_ID || !CF_API_TOKEN)
        return { content: [{ type: "text", text: "Error: CF_ACCOUNT_ID or CF_API_TOKEN not set" }] };

      const boundary = `----PAI${Date.now()}`;
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="metadata"',
        "Content-Type: application/json",
        "",
        JSON.stringify({ body_part: "script", main_module: "index.ts" }),
        `--${boundary}`,
        'Content-Disposition: form-data; name="script"',
        "Content-Type: application/javascript",
        "",
        code,
        `--${boundary}--`,
      ].join("\r\n");

      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${name}`,
        { method: "PUT", headers: { Authorization: `Bearer ${CF_API_TOKEN}`, "Content-Type": `multipart/form-data; boundary=${boundary}` }, body }
      );
      const result = await resp.json() as any;
      return { content: [{ type: "text", text: result.success ? `✅ Worker '${name}' deployed` : `❌ Failed: ${JSON.stringify(result.errors)}` }] };
    });

    this.server.tool("pai_cf_runAI", "Run Workers AI inference", {
      model: z.string().describe("Model ID (e.g. @cf/meta/llama-3.2-3b-instruct)"),
      prompt: z.string().describe("Input prompt"),
    }, async ({ model, prompt }) => {
      const result = await this.env.AI.run(model as any, { messages: [{ role: "user", content: prompt }] });
      return { content: [{ type: "text", text: (result as any).response || JSON.stringify(result) }] };
    });

    this.server.tool("pai_cf_queryDB", "Query a D1 database", {
      binding: z.enum(["DB_INDUCT", "DB_SKILLS", "DB_GHOST"]).describe("D1 binding"),
      sql: z.string().describe("SQL query"),
    }, async ({ binding, sql }) => {
      const db = (this.env as any)[binding];
      if (!db) return { content: [{ type: "text", text: `Error: binding '${binding}' not found` }] };
      const result = await db.prepare(sql).all();
      return { content: [{ type: "text", text: JSON.stringify(result.results, null, 2) }] };
    });

    this.server.tool("pai_cf_listWorkers", "List all account Workers", {}, async () => {
      const { CF_ACCOUNT_ID, CF_API_TOKEN } = this.env as any;
      if (!CF_ACCOUNT_ID || !CF_API_TOKEN) return { content: [{ type: "text", text: "Error: credentials not set" }] };
      const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts`,
        { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } });
      const data = await resp.json() as any;
      const names = (data.result || []).map((w: any) => w.id).join(", ");
      return { content: [{ type: "text", text: `Workers: ${names || "none"}` }] };
    });

    // ════════════════════════════════════
    // ▲ Vercel — pai_vc_*
    // ════════════════════════════════════

    this.server.tool("pai_vc_listDeployments", "List Vercel project deployments", {
      projectId: z.string().describe("Vercel project ID"),
    }, async ({ projectId }) => {
      const token = (this.env as any).VERCEL_API_TOKEN;
      if (!token) return { content: [{ type: "text", text: "Error: VERCEL_API_TOKEN not set" }] };
      const resp = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json() as any;
      const deps = (data.deployments || []).map((d: any) => `${d.uid}: ${d.state}`).join("\n");
      return { content: [{ type: "text", text: deps || "No deployments" }] };
    });

    this.server.tool("pai_vc_setEnv", "Set Vercel env var", {
      projectId: z.string(), key: z.string(), value: z.string(),
      target: z.enum(["production", "preview", "development"]).default("production"),
    }, async ({ projectId, key, value, target }) => {
      const token = (this.env as any).VERCEL_API_TOKEN;
      if (!token) return { content: [{ type: "text", text: "Error: VERCEL_API_TOKEN not set" }] };
      const resp = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, target: [target], type: "encrypted" }),
      });
      const data = await resp.json() as any;
      return { content: [{ type: "text", text: data.id ? `✅ '${key}' set for ${target}` : `❌ ${JSON.stringify(data)}` }] };
    });

    // ════════════════════════════════════
    // 💎 Ghost.Build — pai_gb_* (Layer 7)
    // ════════════════════════════════════

    this.server.tool("pai_gb_createPool", "Create a Ghost.Build DB pool", {
      name: z.string().describe("Pool name"),
      template: z.string().describe("Template (pai-induct/pai-try/pai-skills)"),
      size: z.number().default(3).describe("Instance count"),
    }, async ({ name, template, size }) => {
      const apiKey = (this.env as any).GHOST_BUILD_API_KEY;
      const apiUrl = (this.env as any).GHOST_BUILD_API_URL || "https://api.ghost.build";
      if (!apiKey) return { content: [{ type: "text", text: "Error: GHOST_BUILD_API_KEY not set" }] };
      const resp = await fetch(`${apiUrl}/v1/pools`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name, template, size }),
      });
      const data = await resp.json() as any;
      return { content: [{ type: "text", text: data.id ? `✅ Pool '${name}' created (${size}x ${template})` : `❌ ${JSON.stringify(data)}` }] };
    });

    this.server.tool("pai_gb_listPools", "List Ghost.Build DB pools", {}, async () => {
      const apiKey = (this.env as any).GHOST_BUILD_API_KEY;
      const apiUrl = (this.env as any).GHOST_BUILD_API_URL || "https://api.ghost.build";
      if (!apiKey) return { content: [{ type: "text", text: "Error: GHOST_BUILD_API_KEY not set" }] };
      const resp = await fetch(`${apiUrl}/v1/pools`, { headers: { Authorization: `Bearer ${apiKey}` } });
      const data = await resp.json() as any;
      const pools = (data.pools || []).map((p: any) => `${p.name}: ${p.size} (${p.template})`).join("\n");
      return { content: [{ type: "text", text: pools || "No pools" }] };
    });

    this.server.tool("pai_gb_sql", "Run SQL on a Ghost.Build database", {
      poolName: z.string().describe("Pool name"),
      sql: z.string().describe("SQL query"),
    }, async ({ poolName, sql }) => {
      const apiKey = (this.env as any).GHOST_BUILD_API_KEY;
      const apiUrl = (this.env as any).GHOST_BUILD_API_URL || "https://api.ghost.build";
      if (!apiKey) return { content: [{ type: "text", text: "Error: GHOST_BUILD_API_KEY not set" }] };
      const resp = await fetch(`${apiUrl}/v1/pools/${poolName}/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await resp.json() as any;
      return { content: [{ type: "text", text: JSON.stringify(data.results || data, null, 2) }] };
    });

    // ════════════════════════════════════
    // 📊 TigerData — pai_td_* (Layer 8)
    // ════════════════════════════════════

    
    this.server.tool("pai_td_openllm_infer", "Run heavy OpenLLM reasoning via TigerData ($1k Credit Pool)", {
      prompt: z.string().describe("User prompt or code task"),
      model: z.string().default("qwen2.5-72b-instruct").describe("Model name (qwen2.5-72b-instruct / llama-3.1-70b-instruct)"),
      system: z.string().optional().describe("Optional system prompt"),
    }, async ({ prompt, model, system }) => {
      const apiKey = (this.env as any).TIGERDATA_API_KEY;
      const apiUrl = (this.env as any).TIGERDATA_API_URL || "https://console.cloud.tigerdata.com/projects/fxt4i3w3h2/cli-mcp/mcp";
      if (!apiKey) return { content: [{ type: "text", text: "Error: TIGERDATA_API_KEY not set" }] };
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            { role: "user", content: prompt }
          ]
        }),
      });
      const data = await resp.json() as any;
      const responseText = data.choices?.[0]?.message?.content || JSON.stringify(data);
      return { content: [{ type: "text", text: responseText }] };
    });

    this.server.tool("pai_td_query", "Query TigerData time-series analytics", {
      sql: z.string().describe("TimescaleDB SQL query"),
    }, async ({ sql }) => {
      const apiKey = (this.env as any).TIGERDATA_API_KEY;
      const apiUrl = (this.env as any).TIGERDATA_API_URL || "https://api.tigerdata.com";
      if (!apiKey) return { content: [{ type: "text", text: "Error: TIGERDATA_API_KEY not set" }] };
      const resp = await fetch(`${apiUrl}/v1/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql }),
      });
      const data = await resp.json() as any;
      return { content: [{ type: "text", text: JSON.stringify(data.rows || data, null, 2) }] };
    });

    this.server.tool("pai_td_ingest", "Ingest a metric into TigerData", {
      metric: z.string().describe("Metric name"),
      value: z.number().describe("Metric value"),
      tags: z.record(z.string(), z.string()).default(() => ({})).describe("Tags"),
    }, async ({ metric, value, tags }) => {
      const apiKey = (this.env as any).TIGERDATA_API_KEY;
      const apiUrl = (this.env as any).TIGERDATA_API_URL || "https://api.tigerdata.com";
      if (!apiKey) return { content: [{ type: "text", text: "Error: TIGERDATA_API_KEY not set" }] };
      const resp = await fetch(`${apiUrl}/v1/ingest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ metric, value, tags, ts: new Date().toISOString() }),
      });
      const data = await resp.json() as any;
      return { content: [{ type: "text", text: data.success ? `✅ ${metric}=${value} ingested` : `❌ ${JSON.stringify(data)}` }] };
    });

    // ════════════════════════════════════
    // π Pi Network — pai_pi_*
    // ════════════════════════════════════

    this.server.tool("pai_pi_status", "Check Pi Network SDK status", {}, async () => {
      const sandbox = (this.env as any).PI_SANDBOX === "true";
      return { content: [{ type: "text", text: `Pi SDK: ${sandbox ? "🏖️ Sandbox" : "🌐 Production"}\nWallet: ${(this.env as any).PI_WALLET_ADDRESS || "not set"}` }] };
    });

    // ════════════════════════════════════
    // 🧪 Kernel — pai_kr_* (ACTIVE now)
    // ════════════════════════════════════

    this.server.tool("pai_kr_smoke", "Run a browser smoke test via Kernel.sh", {
      url: z.string().describe("URL to test"),
      flow: z.string().default("smoke").describe("Test flow (smoke/full/auth)"),
    }, async ({ url, flow }) => {
      // Active implementation: queue to KV for Kernel CLI to pick up + return instructions
      const testId = crypto.randomUUID();
      await (this.env as any).CONFIG.put(
        `smoke:${testId}`,
        JSON.stringify({ url, flow, status: "queued", created_at: Date.now() }),
        { expirationTtl: 86400 }
      );
      return {
        content: [{
          type: "text",
          text: `🧪 Smoke test queued for ${url}

ID: ${testId}
Flow: ${flow}
Run: kernel browser create --start-url "${url}"
View: kernel browser view <session-id>

To execute manually:
  brew install kernel/tap/kernel
  kernel auth
  kernel browser create --start-url "${url}"
  LIVE_URL=$(kernel browser view <session-id>)
  open "$LIVE_URL"`,
        }],
      };
    });
  }
}

// Export the Worker handler — serves MCP at /mcp with StreamableHTTP
export default PAIMCP.serve("/mcp");
