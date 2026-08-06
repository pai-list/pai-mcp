// PAI-MCP edge stub — PoC phase 1-2 (mcp.axiomid.app)
// Honest stub: advertises the MCP tools, no fake execution (Muraqabah: nothing simulated).

const NAME = "pai-mcp-gateway";
const VERSION = "0.1.0";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health" || url.pathname === "/") {
      return json({
        name: NAME,
        version: VERSION,
        status: "stub",
        note: "PoC edge stub — tool execution lands in AxiomID backend (roadmap A2)",
      });
    }
    if (request.method === "POST") {
      // Real implementation (AxiomID backend/src/mcp/server.ts) is wired in
      // as the Worker-based deployment; this stub only answers discovery.
      const body = await request.json().catch(() => null);
      if (body && body.method === "tools/list") {
        return json({
          jsonrpc: "2.0",
          id: body.id ?? null,
          result: {
            tools: [
              { name: "memory_store", description: "Store a memory (mem7)" },
              { name: "memory_recall", description: "Recall relevant memories" },
              { name: "memory_delete", description: "Delete a memory" },
              { name: "identity_verify", description: "Verify a Pi access token + DID" },
              { name: "credential_issue", description: "Issue a pai:// Verifiable Credential" },
              { name: "credential_verify", description: "Verify a pai:// credential" },
            ],
          },
        });
      }
      if (body && body.method && body.method.startsWith("tools/")) {
        return json({
          jsonrpc: "2.0",
          id: body.id ?? null,
          error: { code: -32000, message: "stub: tool execution not deployed yet" },
        });
      }
    }
    return new Response("not found", { status: 404 });
  },
};

function json(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
