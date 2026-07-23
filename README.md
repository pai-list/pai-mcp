<!-- ═══════════ PAI-MCP · Model Context Protocol Gateway ═══════════ -->
<!-- Stack: TypeScript, Cloudflare Workers, MCP Standard    -->
<!-- Tools: 11 across 5 providers (CF/Vercel/GB/Pi/Kernel)  -->
<!-- Updated: 23 July 2026                                  -->
<!-- ═══════════════════════════════════════════════════════ -->

<div align="center">
  <img src="https://img.shields.io/badge/status-live-00FF41?style=flat-square&labelColor=0D1117" />
  <img src="https://img.shields.io/github/license/pai-list/pai-mcp?style=flat-square&color=00A36C&labelColor=0D1117" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&labelColor=0D1117" />
  <img src="https://img.shields.io/badge/tools-11-FF6B6B?style=flat-square&labelColor=0D1117" />
  <img src="https://img.shields.io/badge/providers-5-7C3AED?style=flat-square&labelColor=0D1117" />
</div>

# ۞ PAI-MCP Gateway

**Unified Model Context Protocol (MCP) server on Cloudflare Workers — connecting AI agents to 11 tools across 5 providers.**

PAI-MCP is the standard protocol layer that lets AI agents discover and invoke tools across Cloudflare, Vercel, Ghost.Build, Pi Network, and Kernel. It implements the [Model Context Protocol](https://modelcontextprotocol.io/) specification.

---

## ❯ MCP Tools

| Tool | Provider | Description |
|:-----|:---------|:------------|
| `kv_get` / `kv_set` | ☁️ Cloudflare | KV store read/write |
| `vectorize_query` | ☁️ Cloudflare | Semantic vector search |
| `do_al_mizan` | ☁️ Cloudflare | Al-Mizan model routing |
| `vercel_deploy` | ▲ Vercel | One-click Vercel deployment |
| `ghost_query` | 👻 Ghost.Build | PostgreSQL query |
| `ghost_schema` | 👻 Ghost.Build | Database schema inspection |
| `pi_verify` | 🥧 Pi Network | KYC → KYA credential bridge |
| `pi_wallet` | 🥧 Pi Network | Wallet balance check |
| `kernel_exec` | ⚙️ Kernel | Shell command execution |
| `mcp_discover` | 🔍 Discovery | Tool registry lookup |
| `passport_verify` | 🛡️ Identity | W3C DID credential verification |

---

## ❯ Quick Start

```bash
npm install
npx wrangler deploy
```

The MCP server auto-discovers tools on startup. Agents connect via:

```json
{
  "serverUrl": "https://pai-mcp.axiomid.app/mcp",
  "protocol": "model-context-protocol"
}
```

---

## ❯ Architecture

```
AI Agent (Claude, Hermes, GPT, etc.)
    │
    ▼  MCP protocol (JSON-RPC over HTTP)
pai-mcp gateway (Cloudflare Worker)
    │
    ├── index.ts → tool router + MCP handler
    └── al-mizan-worker.ts → multi-model inference router
    │
    ├──☁️ Cloudflare (KV, Vectorize, DO)
    ├──▲ Vercel (deploy, preview)
    ├──👻 Ghost.Build (PostgreSQL)
    ├──🥧 Pi Network (KYC, wallet)
    └──⚙️ Kernel (exec, filesystem)
```

---

## ❯ Related

- [`pai-list/pai-agent-kit`](https://github.com/pai-list/pai-agent-kit) — Agent runtime that consumes these tools
- [`pai-list/pai-cli`](https://github.com/pai-list/pai-cli) — CLI to manage MCP endpoints
- [`pai-list/AxiomID`](https://github.com/pai-list/AxiomID) — Identity layer for MCP auth

---

## ❯ License

MIT © [PAI Ecosystem](https://github.com/pai-list)

---

*One protocol. Eleven tools. Infinite agents.*
