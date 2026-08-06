// PAI-MCP edge stub — PoC phase 1-2 (mcp.axiomid.app)
// Honest stub: advertises the MCP tools, no fake execution (Muraqabah: nothing simulated).

const NAME = "pai-mcp-gateway";
const VERSION = "0.1.0";

const TOOLS = [
  { name: "memory_store", description: "Store a memory (mem7)" },
  { name: "memory_recall", description: "Recall relevant memories" },
  { name: "memory_delete", description: "Delete a memory" },
  { name: "identity_verify", description: "Verify a Pi access token + DID" },
  { name: "credential_issue", description: "Issue a pai:// Verifiable Credential" },
  { name: "credential_verify", description: "Verify a pai:// credential" },
];

const MCP_CONFIG = `{
  "mcpServers": {
    "pai-mcp": {
      "command": "npx",
      "args": ["-y", "@pai/mcp@latest"],
      "env": {
        "MCP_ENDPOINT": "https://mcp.axiomid.app"
      }
    }
  }
}`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\"")
    .replace(/'/g, "&#039;");
}

const ESCAPED_CONFIG = escapeHtml(MCP_CONFIG);

const TOOLS_HTML = TOOLS.map(t => 
  `<li class="tool-item"><span class="tool-name">${escapeHtml(t.name)}</span><span class="tool-desc">${escapeHtml(t.description)}</span></li>`
).join('');

const PAGE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>PAI MCP Gateway — Interactive Console</title>
<style>
  :root{--bg:#020617;--fg:#e2e8f0;--muted:#64748b;--accent:#00ff00;--accent-dim:#00cc00;--card:#0b1220;--border:#1e293b;--warn:#ffb800}
  *{box-sizing:border-box}
  body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:var(--bg);color:var(--fg);min-height:100vh;display:flex;flex-direction:column}
  main{flex:1;max-width:56rem;margin:auto;padding:2rem 1rem;display:flex;flex-direction:column;gap:1.5rem}
  header{text-align:center;border-bottom:1px solid var(--border);padding-bottom:1.5rem}
  .badge{display:inline-block;padding:.35rem .85rem;border:1px solid var(--accent);color:var(--accent);font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.75rem;background:rgba(0,255,0,0.06)}
  h1{font-size:clamp(1.5rem,4vw,2.25rem);margin:0 0 .5rem;color:#fff;font-weight:700}
  .subtitle{color:var(--muted);font-size:.95rem}
  .grid{display:grid;gap:1rem;grid-template-columns:1fr}
  @media(min-width:768px){.grid{grid-template-columns:1fr 1fr}}
  .card{background:var(--card);border:1px solid var(--border);padding:1.5rem;display:flex;flex-direction:column}
  .card h2{font-size:.85rem;font-weight:600;color:var(--accent);margin:0 0 1rem;text-transform:uppercase;letter-spacing:.05em;display:flex;align-items:center;gap:.5rem}
  .card h2::before{content:"";width:.5rem;height:.5rem;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);animation:pulse 2s infinite}
  .tool-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.5rem}
  .tool-item{display:flex;justify-content:space-between;align-items:center;padding:.75rem 1rem;background:rgba(255,255,255,0.02);border:1px solid var(--border);font-family:ui-monospace,monospace;font-size:.8rem}
  .tool-item:hover{border-color:var(--accent);background:rgba(0,255,0,0.04)}
  .tool-name{color:var(--accent);font-weight:600}
  .tool-desc{color:var(--muted);font-family:ui-sans-serif,system-ui,sans-serif;font-size:.75rem;max-width:24rem;text-align:right}
  .latency{display:flex;align-items:center;gap:1rem;padding:1rem;background:rgba(255,255,255,0.02);border:1px solid var(--border)}
  .latency-value{font-family:ui-monospace,monospace;font-size:2rem;font-weight:700;color:var(--accent)}
  .latency-label{color:var(--muted);font-size:.8rem}
  .latency-ok{color:#00ff88}
  .latency-warn{color:var(--warn)}
  .copy-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.25rem;border:1px solid var(--accent);color:var(--accent);background:transparent;font-size:.8rem;font-weight:600;font-family:ui-monospace,monospace;letter-spacing:.02em;cursor:pointer;transition:background .15s,box-shadow .15s;box-shadow:0 0 8px rgba(0,255,0,0.2);width:100%;justify-content:center}
  .copy-btn:hover{background:rgba(0,255,0,0.1);box-shadow:0 0 16px rgba(0,255,0,0.4)}
  .copy-btn:focus{outline:none;box-shadow:0 0 0 2px var(--accent)}
  .copy-btn.copied{border-color:#00ff88;color:#00ff88;box-shadow:0 0 12px rgba(0,255,136,0.4)}
  .config-box{background:#000;border:1px solid var(--border);padding:1rem;font-family:ui-monospace,monospace;font-size:.7rem;color:var(--muted);overflow-x:auto;white-space:pre-wrap;max-height:20rem}
  .config-box .key{color:#ff79c6}
  .config-box .string{color:#f1fa8c}
  .footer{text-align:center;padding-top:1.5rem;border-top:1px solid var(--border);color:var(--muted);font-size:.75rem}
  .footer a{color:var(--accent);text-decoration:none;border-bottom:1px solid transparent}
  .footer a:hover{border-color:var(--accent)}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
</style></head><body>
<main>
  <header>
    <span class="badge">mcp.axiomid.app · PoC STUB</span>
    <h1>PAI MCP Gateway</h1>
    <p class="subtitle">Model Context Protocol — interactive console for agent tooling</p>
  </header>

  <div class="grid">
    <section class="card" aria-labelledby="tools-h2">
      <h2 id="tools-h2">Available Tools (6)</h2>
      <ul class="tool-list" id="tool-list">${TOOLS_HTML}</ul>
    </section>

    <section class="card" aria-labelledby="latency-h2">
      <h2 id="latency-h2">Response Latency</h2>
      <div class="latency">
        <span class="latency-value" id="latency-value">—</span>
        <span class="latency-label" id="latency-label">Testing <span class="spinner">⟳</span></span>
      </div>
      <p style="margin:1rem 0 0;font-size:.8rem;color:var(--muted)">Pings <code>/health</code> endpoint. Real tool execution lands in AxiomID backend (roadmap A2).</p>
    </section>
  </div>

  <section class="card" aria-labelledby="mcp-h2">
    <h2 id="mcp-h2">MCP Configuration</h2>
    <p style="margin:0 0 1rem;color:var(--muted);font-size:.85rem">Copy this JSON into your client config (Claude Code, Cursor, PAI Agents, or any MCP-compatible client).</p>
    <pre class="config-box" id="config-box">${ESCAPED_CONFIG}</pre>
    <button class="copy-btn" id="copy-btn" onclick="copyConfig()">COPY MCP POINT</button>
  </section>

  <footer class="footer">
    Signed record: <code>did:axiom:issuer</code> · edge-deployment spec · no simulated functionality
  </footer>
</main>

<div class="hud" aria-label="Voice HUD" style="position:fixed;bottom:0;left:0;right:0;background:linear-gradient(180deg,transparent,var(--bg) 40%);padding:1.5rem 1rem 1rem;text-align:center;pointer-events:none">
  <div class="hud-inner" style="display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem;max-width:56rem;margin:0 auto;pointer-events:auto">
    <span class="status-dot" style="width:.5rem;height:.5rem;border-radius:50%;background:var(--accent);box-shadow:0 0 6px var(--accent);animation:pulse 2s infinite" aria-hidden="true"></span>
    <span style="color:var(--accent);font-size:.75rem;font-weight:600;font-family:ui-monospace,monospace">READY</span>
    <button class="hud-btn" disabled style="display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border:1px solid var(--accent);color:var(--accent);background:transparent;font-size:.75rem;font-weight:600;letter-spacing:.02em;cursor:pointer;transition:background .15s,box-shadow .15s;box-shadow:0 0 8px rgba(0,255,0,0.2)">VOICE OFF</button>
    <button class="hud-btn" disabled style="display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border:1px solid var(--accent);color:var(--accent);background:transparent;font-size:.75rem;font-weight:600;letter-spacing:.02em;cursor:pointer;transition:background .15s,box-shadow .15s;box-shadow:0 0 8px rgba(0,255,0,0.2)">SPEC</button>
  </div>
</div>

<script>
async function measureLatency() {
  const start = performance.now();
  try {
    const res = await fetch('/health', { method: 'GET', cache: 'no-store' });
    const ms = Math.round(performance.now() - start);
    const val = document.getElementById('latency-value');
    const label = document.getElementById('latency-label');
    if (res.ok) {
      val.textContent = ms + ' ms';
      val.className = 'latency-value' + (ms < 100 ? ' latency-ok' : ms < 300 ? ' latency-warn' : '');
      label.textContent = ms < 100 ? 'Excellent' : ms < 300 ? 'Good' : 'Slow';
    } else {
      val.textContent = 'ERR';
      val.className = 'latency-value latency-warn';
      label.textContent = 'Failed';
    }
  } catch {
    const val = document.getElementById('latency-value');
    const label = document.getElementById('latency-label');
    val.textContent = 'ERR';
    val.className = 'latency-value latency-warn';
    label.textContent = 'Network error';
  }
}
measureLatency();
setInterval(measureLatency, 30000);

function copyConfig() {
  const config = \`${MCP_CONFIG}\`;
  navigator.clipboard.writeText(config).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = 'COPIED ✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'COPY MCP POINT';
      btn.classList.remove('copied');
    }, 2000);
  });
}
</script>
</body></html>`;

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({
        name: NAME,
        version: VERSION,
        status: "stub",
        note: "PoC edge stub — tool execution lands in AxiomID backend (roadmap A2)",
      });
    }
    if (url.pathname === "/" || url.pathname === "/console") {
      return new Response(PAGE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    if (request.method === "POST") {
      const body = await request.json().catch(() => null);
      if (body && body.method === "tools/list") {
        return json({
          jsonrpc: "2.0",
          id: body.id ?? null,
          result: { tools: TOOLS },
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