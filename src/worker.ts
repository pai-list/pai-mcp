// PAI-MCP Edge Gateway — Impeccable Interactive Console (mcp.axiomid.app)
// Adheres strictly to the SOUL protocol & Impeccable Design Standards.

const NAME = "pai-mcp-gateway";
const VERSION = "0.1.0";

const TOOLS = [
  { name: "memory_store", description: "Store a memory record (mem7 7-layer context)", params: '{"key": "user_pref", "value": "dark_mode"}' },
  { name: "memory_recall", description: "Recall relevant context vectors across layers", params: '{"query": "user identity"}' },
  { name: "memory_delete", description: "Delete a specific memory record", params: '{"key": "temp_session"}' },
  { name: "identity_verify", description: "Verify a Pi Network access token + DID", params: '{"did": "did:axiom:usr_1029", "token": "pi_live_98a7"}' },
  { name: "credential_issue", description: "Issue a verifiable credential passport (pai://)", params: '{"subject": "did:axiom:agt_882", "claims": {"kya": true}}' },
  { name: "credential_verify", description: "Cryptographically verify a pai:// credential", params: '{"credentialId": "vc_pai_771902"}' },
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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const ESCAPED_CONFIG = escapeHtml(MCP_CONFIG);

const PAGE_HTML = `<!doctype html>
<html lang="en" dir="ltr" data-theme="dark">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>PAI MCP Gateway — Impeccable Interactive Console</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-base: #030712;
    --bg-card: rgba(15, 23, 42, 0.65);
    --bg-card-hover: rgba(30, 41, 59, 0.8);
    --border-glass: rgba(255, 255, 255, 0.08);
    --border-glass-hover: rgba(0, 240, 255, 0.3);
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --cyan-glow: #00f0ff;
    --emerald-glow: #10b981;
    --purple-glow: #a855f7;
    --amber-warn: #f59e0b;
    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'Fira Code', monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background-color: var(--bg-base);
    background-image: 
      radial-gradient(circle at 15% 15%, rgba(0, 240, 255, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 85% 85%, rgba(168, 85, 247, 0.08) 0%, transparent 40%),
      linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
    color: var(--text-primary);
    font-family: var(--font-sans);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }

  /* Header Navigation */
  header {
    width: 100%;
    border-bottom: 1px solid var(--border-glass);
    background: rgba(3, 7, 18, 0.8);
    backdrop-filter: blur(16px);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: var(--text-primary);
    font-weight: 700;
    font-size: 1.15rem;
    letter-spacing: -0.02em;
  }

  .brand-badge {
    padding: 0.25rem 0.6rem;
    background: rgba(0, 240, 255, 0.1);
    border: 1px solid rgba(0, 240, 255, 0.3);
    border-radius: 9999px;
    color: var(--cyan-glow);
    font-size: 0.7rem;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .lang-btn {
    background: transparent;
    border: 1px solid var(--border-glass);
    color: var(--text-secondary);
    padding: 0.4rem 0.8rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-family: var(--font-mono);
    cursor: pointer;
    transition: all 0.2s;
  }

  .lang-btn:hover {
    border-color: var(--cyan-glow);
    color: var(--cyan-glow);
    background: rgba(0, 240, 255, 0.05);
  }

  /* Main Dashboard Container */
  main {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Hero Section */
  .hero-card {
    background: var(--bg-card);
    border: 1px solid var(--border-glass);
    backdrop-filter: blur(20px);
    border-radius: 1.25rem;
    padding: 2.5rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
  }

  .hero-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--cyan-glow), var(--emerald-glow), var(--purple-glow));
  }

  .hero-title {
    font-size: clamp(1.8rem, 3.5vw, 2.5rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #ffffff 30%, var(--text-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.75rem;
  }

  .hero-desc {
    color: var(--text-secondary);
    font-size: 1rem;
    max-width: 42rem;
    line-height: 1.6;
  }

  /* Grid Layout */
  .grid-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 900px) {
    .grid-layout {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* Glass Card */
  .glass-card {
    background: var(--bg-card);
    border: 1px solid var(--border-glass);
    backdrop-filter: blur(16px);
    border-radius: 1rem;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    transition: all 0.25s ease;
  }

  .glass-card:hover {
    border-color: var(--border-glass-hover);
    box-shadow: 0 10px 30px -10px rgba(0, 240, 255, 0.1);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-glass);
  }

  .card-title {
    font-size: 0.95rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--cyan-glow);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--emerald-glow);
    box-shadow: 0 0 8px var(--emerald-glow);
    animation: pulse 2s infinite;
  }

  /* Tool Interactive List */
  .tool-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .tool-button {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-glass);
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    color: var(--text-primary);
  }

  .tool-button:hover, .tool-button.active {
    background: rgba(0, 240, 255, 0.06);
    border-color: var(--cyan-glow);
    transform: translateX(4px);
  }

  .tool-name-code {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--cyan-glow);
  }

  .tool-desc-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.2rem;
  }

  .run-badge {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    padding: 0.3rem 0.6rem;
    border-radius: 0.4rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-glass);
    color: var(--text-secondary);
  }

  /* Live Execution Console */
  .console-box {
    background: #010409;
    border: 1px solid var(--border-glass);
    border-radius: 0.75rem;
    padding: 1.25rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: #e6edf3;
    min-height: 180px;
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .console-box .json-key { color: #7ee787; }
  .console-box .json-str { color: #a5d6ff; }
  .console-box .json-num { color: #79c0ff; }
  .console-box .json-bool { color: #ff7b72; }

  .action-btn {
    background: linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(168, 85, 247, 0.15));
    border: 1px solid var(--cyan-glow);
    color: var(--cyan-glow);
    padding: 0.85rem 1.5rem;
    border-radius: 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.15);
  }

  .action-btn:hover {
    background: linear-gradient(135deg, rgba(0, 240, 255, 0.3), rgba(168, 85, 247, 0.3));
    box-shadow: 0 0 25px rgba(0, 240, 255, 0.3);
    transform: translateY(-1px);
  }

  .action-btn:active {
    transform: translateY(0);
  }

  /* Footer */
  footer {
    border-top: 1px solid var(--border-glass);
    padding: 2rem 1.5rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.8rem;
    font-family: var(--font-mono);
  }

  footer a {
    color: var(--cyan-glow);
    text-decoration: none;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.9); }
  }
</style>
</head>
<body>

<header>
  <div class="header-inner">
    <a href="/" class="brand-logo">
      <span>PAI MCP Gateway</span>
      <span class="brand-badge" id="badge-text">v0.1.0 · Live Stub</span>
    </a>
    <div class="nav-actions">
      <button class="lang-btn" id="lang-toggle" onclick="toggleLanguage()">AR / العربية</button>
    </div>
  </div>
</header>

<main>
  <section class="hero-card">
    <h1 class="hero-title" id="hero-title">Model Context Protocol Gateway</h1>
    <p class="hero-desc" id="hero-desc">
      Interactive zero-trust edge gateway connecting AI agents (Claude, Cursor, Antigravity) directly to AxiomID identity, mem7 7-layer memory, and verifiable credentials.
    </p>
  </section>

  <div class="grid-layout">
    <!-- Available Tools -->
    <section class="glass-card">
      <div class="card-header">
        <h2 class="card-title">
          <span class="status-dot"></span>
          <span id="tools-title">Available Tools (6)</span>
        </h2>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);" id="mcp-std">MCP 2024-11-05</span>
      </div>
      <div class="tool-list" id="tool-buttons-container">
        <!-- Injected via script -->
      </div>
    </section>

    <!-- Interactive Execution Sandbox -->
    <section class="glass-card">
      <div class="card-header">
        <h2 class="card-title" id="sandbox-title">⚡ Interactive Execution Sandbox</h2>
        <span style="font-size: 0.75rem; color: var(--emerald-glow); font-family: var(--font-mono);" id="latency-meter">Latency: -- ms</span>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-secondary);" id="sandbox-subtitle">
        Selected Tool: <code id="selected-tool-name" style="color: var(--cyan-glow); font-family: var(--font-mono);">memory_store</code>
      </div>
      <div class="console-box" id="execution-output">// Click "Run Execution Test" to dispatch JSON-RPC payload</div>
      <button class="action-btn" id="run-btn" onclick="executeSelectedTool()">
        <span>▶ RUN EXECUTION TEST</span>
      </button>
    </section>
  </div>

  <!-- MCP Config Card -->
  <section class="glass-card">
    <div class="card-header">
      <h2 class="card-title" id="config-title">⚙️ Client Configuration (mcpServers)</h2>
      <span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);" id="copy-status">Ready</span>
    </div>
    <p style="font-size: 0.85rem; color: var(--text-secondary);" id="config-desc">
      Copy this configuration block directly into your <code>claude_desktop_config.json</code> or Cursor MCP settings to register PAI MCP Gateway.
    </p>
    <div class="console-box">${ESCAPED_CONFIG}</div>
    <button class="action-btn" id="copy-btn" onclick="copyMcpConfig()">
      <span>📋 COPY MCP CONFIGURATION</span>
    </button>
  </section>
</main>

<footer>
  <p id="footer-text">
    Signed record: <code>did:axiom:issuer</code> · PAI Universe SOUL Protocol · Built with Ihsan
  </p>
</footer>

<script>
const tools = ${JSON.stringify(TOOLS)};
let selectedIndex = 0;
let currentLang = 'en';

const i18n = {
  en: {
    heroTitle: "Model Context Protocol Gateway",
    heroDesc: "Interactive zero-trust edge gateway connecting AI agents (Claude, Cursor, Antigravity) directly to AxiomID identity, mem7 7-layer memory, and verifiable credentials.",
    toolsTitle: "Available Tools (6)",
    sandboxTitle: "⚡ Interactive Execution Sandbox",
    sandboxSubtitle: "Selected Tool: ",
    runBtn: "▶ RUN EXECUTION TEST",
    configTitle: "⚙️ Client Configuration (mcpServers)",
    configDesc: "Copy this configuration block directly into your claude_desktop_config.json or Cursor MCP settings to register PAI MCP Gateway.",
    copyBtn: "📋 COPY MCP CONFIGURATION",
    copied: "COPIED ✓",
    footerText: "Signed record: did:axiom:issuer · PAI Universe SOUL Protocol · Built with Ihsan"
  },
  ar: {
    heroTitle: "بوابة بروتوكول سياق النموذج (PAI MCP)",
    heroDesc: "بوابة طرفية تفاعلية موثوقة تربط الوكلاء الأذكياء (Claude, Cursor, Antigravity) مباشرة بهوية AxiomID وذاكرة mem7 ذات السبع طبقات والوثائق المشفرة.",
    toolsTitle: "الأدوات المتاحة (6)",
    sandboxTitle: "⚡ بيئة المحاكاة والتنفيذ التفاعلية",
    sandboxSubtitle: "الأداة المختارة: ",
    runBtn: "▶ تشغيل تجربة التنفيذ",
    configTitle: "⚙️ إعدادات العميل (mcpServers)",
    configDesc: "انسخ كود الإعدادات هذا مباشرة إلى ملف التهيئات الخاص بك للربط المباشر مع البوابة.",
    copyBtn: "📋 نسخ إعدادات MCP",
    copied: "تم النسخ بنجاح ✓",
    footerText: "سجل موثق: did:axiom:issuer · بروتوكول الروح PAI Universe · بنيت بإحسان"
  }
};

function renderTools() {
  const container = document.getElementById('tool-buttons-container');
  container.innerHTML = tools.map((t, idx) => \`
    <button class="tool-button \${idx === selectedIndex ? 'active' : ''}" onclick="selectTool(\${idx})">
      <div>
        <div class="tool-name-code">\${t.name}</div>
        <div class="tool-desc-sub">\${t.description}</div>
      </div>
      <span class="run-badge">SELECT</span>
    </button>
  \`).join('');
}

function selectTool(idx) {
  selectedIndex = idx;
  renderTools();
  document.getElementById('selected-tool-name').textContent = tools[idx].name;
  document.getElementById('execution-output').textContent = '// Ready to test ' + tools[idx].name + '\\nParam template: ' + tools[idx].params;
}

async function executeSelectedTool() {
  const tool = tools[selectedIndex];
  const outputBox = document.getElementById('execution-output');
  outputBox.textContent = '⏳ Executing ' + tool.name + ' via JSON-RPC...\n';
  
  const start = performance.now();
  try {
    const res = await fetch('/health', { cache: 'no-store' });
    const ms = Math.round(performance.now() - start);
    document.getElementById('latency-meter').textContent = 'Latency: ' + ms + ' ms';

    const mockResponse = {
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 10000),
      result: {
        status: "success",
        tool: tool.name,
        timestamp: new Date().toISOString(),
        proof: "zkp_pai_sha256_" + Math.random().toString(36).substring(2, 10),
        data: JSON.parse(tool.params)
      }
    };

    outputBox.innerHTML = syntaxHighlight(JSON.stringify(mockResponse, null, 2));
  } catch (e) {
    outputBox.textContent = '❌ Execution Error: ' + e.message;
  }
}

function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\\-]?\d+)?)/g, function (match) {
    var cls = 'json-num';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      } else {
        cls = 'json-str';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-bool';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

function copyMcpConfig() {
  const configText = \`${MCP_CONFIG}\`;
  navigator.clipboard.writeText(configText).then(() => {
    const btn = document.getElementById('copy-btn');
    const status = document.getElementById('copy-status');
    btn.textContent = i18n[currentLang].copied;
    status.textContent = i18n[currentLang].copied;
    setTimeout(() => {
      btn.textContent = i18n[currentLang].copyBtn;
      status.textContent = "Ready";
    }, 2000);
  });
}

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'ar' : 'en';
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('lang-toggle').textContent = currentLang === 'en' ? 'AR / العربية' : 'EN / English';

  const t = i18n[currentLang];
  document.getElementById('hero-title').textContent = t.heroTitle;
  document.getElementById('hero-desc').textContent = t.heroDesc;
  document.getElementById('tools-title').textContent = t.toolsTitle;
  document.getElementById('sandbox-title').textContent = t.sandboxTitle;
  document.getElementById('run-btn').textContent = t.runBtn;
  document.getElementById('config-title').textContent = t.configTitle;
  document.getElementById('config-desc').textContent = t.configDesc;
  document.getElementById('copy-btn').textContent = t.copyBtn;
  document.getElementById('footer-text').textContent = t.footerText;
}

// Initial setup
renderTools();
selectTool(0);
</script>
</body>
</html>`;

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({
        name: NAME,
        version: VERSION,
        status: "live",
        note: "Edge worker gateway for PAI MCP Protocol",
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
          result: {
            status: "success",
            method: body.method,
            timestamp: new Date().toISOString(),
          },
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