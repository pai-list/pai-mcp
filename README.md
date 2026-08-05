<div align="center">

```ascii
 ╔═══════════════════════════════════════════════════════════════════════════╗
 ║   _  _  _  _  _  ____  _  _  _  _  _  ____  ____  _  _  ____  ____  ____  ║
 ║  / )( \( \/ )( \/ ___)( \/ )( \/ )( \/ ___)(  _ \( \/ )/ ___)/ ___)(  _ \ ║
 ║  ) __ ( )  (  ) )\___ \ )  /  )  (  ) )\___ \ ) __/ )  / \___ \\___ \ ) __/ ║
 ║  \_)(_/(_/\_)(_/ (____/(_/   (_/\_)(_/ (____/(__)  (_/  (____/(____/(__)   ║
 ║                                                                           ║
 ║                 A X I O M  I D  |  P A I  U N I V E R S E                 ║
 ╚═══════════════════════════════════════════════════════════════════════════╝
```

</div>
# PAI MCP

> **PAI** — *Pi + AI.* The Model Context Protocol server for Pi Network.

Give any AI agent — Claude, GPT, Hermes — direct access to Pi Network protocols through the Model Context Protocol (MCP).

## What Is This?

MCP (Model Context Protocol) is an open standard that lets AI models interact with external tools. PAI MCP is an MCP server that exposes Pi Network capabilities as tools that any LLM can call.

```
Claude / GPT / Hermes
        │
   MCP Protocol
        │
   PAI MCP Server
        │
   ┌────┴────┬────┬────┬────┐
   │         │    │    │    │
 Verify    DID  Trust Pay Wallet
   │         │    │    │    │
   └─────────┴────┴────┴────┘
          Pi Network
```

## Tools

| Tool | What It Does |
|---|---|
| `verify_human` | Verify a wallet belongs to a KYC'd human via PiVerify |
| `create_did` | Generate a `did:pai:` identity |
| `resolve_did` | Resolve any PAI DID document |
| `trust_score` | Get trust score for an identity |
| `check_proof` | Verify a PiVerify proof hash |
| `send_payment` | Send Pi or USDC |
| `get_balance` | Check Pi wallet balance |

## Quickstart

```bash
npm install -g @pai/mcp
pai-mcp start
```

Then configure your AI agent to connect:

```json
{
  "mcpServers": {
    "pai": {
      "command": "pai-mcp",
      "args": ["start"]
    }
  }
}
```

## Why MCP?

MCP is becoming the universal protocol for AI tool access. By shipping PAI MCP, every AI agent built on Claude, GPT, Hermes, or any MCP-compatible model can natively interact with Pi Network — without writing a single line of Pi-specific code.

This is our distribution play: **every AI model user becomes a Pi Network user.**

## License

PiOS — Pi Open Source License

---

**PAI MCP.** Give any AI agent Pi Network superpowers.
