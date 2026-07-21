<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../docs/assets/pai-mcp-hero.svg">
  <img alt="PAI-MCP Gateway" src="../docs/assets/pai-mcp-hero.svg" width="100%">
</picture>

# PAI-MCP Gateway

> **Unified MCP protocol for the PAI Universe.**  
> One gateway. Every platform. Zero-cost.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-00FF41?labelColor=0a0a0f)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Model_Context_Protocol-6C5CE7?labelColor=0a0a0f)](https://modelcontextprotocol.io/)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     PAI-MCP Gateway                      │
│            https://pai-mcp.amrikyy.workers.dev/mcp        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  POST /mcp { method: "tools/call", params: {             │
│    name: "pai_cf_deployWorker",                          │
│    arguments: { name: "my-worker", code: "..." }         │
│  }}                                                       │
│                                                          │
├──────────────┬──────────────┬──────────────┬─────────────┤
│  pai_cf_*    │  pai_vc_*    │  pai_gb_*    │  pai_pi_*   │
│  Cloudflare  │  Vercel      │  Ghost.Build │  Pi Network  │
│  Workers, AI │  Deployments │  DB Pools    │  SDK Status  │
│  D1, KV      │  Env Vars    │  Templates   │  Auth        │
└──────────────┴──────────────┴──────────────┴─────────────┘
```

## Tools

### ☁️ Cloudflare — `pai_cf_*`

| Tool | Description | Auth |
|------|-------------|------|
| `pai_cf_deployWorker` | Deploy a Worker from source | CF_API_TOKEN |
| `pai_cf_runAI` | Run Workers AI inference | AI binding |
| `pai_cf_queryDB` | Query D1 database | D1 binding |
| `pai_cf_listWorkers` | List all account Workers | CF_API_TOKEN |

### ▲ Vercel — `pai_vc_*`

| Tool | Description | Auth |
|------|-------------|------|
| `pai_vc_listDeployments` | List project deployments | VERCEL_API_TOKEN |
| `pai_vc_getDeployment` | Get deployment details | VERCEL_API_TOKEN |
| `pai_vc_setEnv` | Set environment variables | VERCEL_API_TOKEN |

### 💎 Ghost.Build — `pai_gb_*`

| Tool | Description | Auth |
|------|-------------|------|
| `pai_gb_createPool` | Create Agent DB pool | GHOST_BUILD_API_KEY |
| `pai_gb_listPools` | List all DB pools | GHOST_BUILD_API_KEY |

### π Pi Network — `pai_pi_*`

| Tool | Description | Auth |
|------|-------------|------|
| `pai_pi_status` | SDK status & sandbox mode | Public |

### 🧪 Kernel — `pai_kr_*`

| Tool | Description | Auth |
|------|-------------|------|
| `pai_kr_smoke` | Queue browser smoke test | PAI_MCP_SECRET |

## Quick Start

### 1. Deploy the gateway

```bash
cd pai/kits/pai-mcp-gateway
npm install
npx wrangler deploy
```

### 2. Set secrets

```bash
npx wrangler secret put PAI_MCP_SECRET     # shared secret for auth
npx wrangler secret put CF_API_TOKEN       # Cloudflare API token
npx wrangler secret put VERCEL_API_TOKEN   # Vercel API token
npx wrangler secret put GHOST_BUILD_API_KEY # Ghost.Build API key
```

### 3. Connect Hermes

Add to `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  pai-mcp:
    url: "https://pai-mcp.amrikyy-gmail-com.workers.dev/mcp"
    headers:
      Authorization: "Bearer ${PAI_MCP_SECRET}"
    timeout: 180
```

All tools auto-discovered as `mcp_pai_mcp_pai_cf_*`, `mcp_pai_mcp_pai_vc_*`, etc.

## Auth Flow

```
Agent ──▶ PAI-MCP Gateway ──▶ Provider API
  │             │                   │
  │  Bearer     │  Validate         │  Native API key
  │  PAI_MCP    │  Passport JWT     │  (scoped per tool)
  │  SECRET     │  optional         │
  ▼             ▼                   ▼
```

**Passport-style identity propagation:**

```http
POST /mcp
Authorization: Bearer {pai_mcp_secret}
x-vercel-oidc-passport-token: {signed_jwt}
```

The gateway verifies the JWT and passes the authenticated identity downstream.

## Design

| Element | Style |
|---------|-------|
| Theme | Dark · Terminal-native · Neon cyberpunk |
| Accent | `#00FF41` (neon green) |
| Typography | JetBrains Mono · Monospace-first |
| Patterns | Vercel Passport · Glassmorphism · Neo-brutalism |

## Related

- [PAI-MCP Architecture](../docs/pai-mcp.md)
- [workers-mcp-server](../workers-mcp-server/)
- [remote-mcp-server](../remote-mcp-server/)
- [One-Click Deploy UI](../docs/one-click/pai-deploy-workflow.html)

---

<div align="center">
  <sub>Built with ❤️ for the PAI Universe · ۞</sub>
</div>
