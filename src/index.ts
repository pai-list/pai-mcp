#!/usr/bin/env node

/**
 * @pai/mcp — PAI Universe MCP Server
 *
 * Exposes PAI's 7 memory layers, identity verification, and credential
 * tools via the Model Context Protocol (MCP).
 *
 * Tools provided:
 *   - identity_verify  Verify a Pi access token + DID
 *   - credential_issue Issue a pai:// Verifiable Credential
 *   - credential_verify Verify a pai:// credential
 *
 * Usage:
 *   npx @pai/mcp
 *   # or add to Claude Code / Hermes MCP config:
 *   pai-mcp as command
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import Ajv from "ajv";

// ── Configuration ──

const AXIOMID_API = process.env.AXIOMID_API_URL ?? "https://axiomid.app";
const PI_API_KEY = process.env.PI_API_KEY ?? "";
const OPENIDENTITY_SCHEMA_URL =
  "https://raw.githubusercontent.com/pai-list/openidentity.md/main/schema/openidentity.schema.json";

// ── Tool Definitions ──

const TOOLS: Tool[] = [
  {
    name: "identity_verify",
    description: "Verify a Pi access token and return the authenticated user's DID.",
    inputSchema: {
      type: "object",
      properties: {
        accessToken: { type: "string", description: "Pi access token from Pi Browser" },
      },
      required: ["accessToken"],
    },
  },
  {
    name: "credential_issue",
    description: "Issue a pai:// Verifiable Credential for a DID.",
    inputSchema: {
      type: "object",
      properties: {
        did: { type: "string", description: "Decentralized Identifier" },
        credentialType: {
          type: "string",
          enum: ["HumanAuthorization", "PiKYC", "Passport"],
          description: "Type of credential to issue",
        },
      },
      required: ["did", "credentialType"],
    },
  },
  {
    name: "credential_verify",
    description: "Verify a pai:// Verifiable Credential.",
    inputSchema: {
      type: "object",
      properties: {
        credential: {
          type: "object",
          description: "Credential object to verify",
        },
      },
      required: ["credential"],
    },
  },
  {
    name: "openidentity_discover",
    description:
      "Fetch and validate an OpenIdentity manifest for an AI agent. Accepts a DID, username, or URL and returns the validated manifest plus schema validation results.",
    inputSchema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description:
            "Agent identifier — DID (did:axiom:...), username, or full manifest URL",
        },
      },
      required: ["identifier"],
    },
  },
];

// ── API Helpers ──

async function callAxiomid(path: string, body: unknown, token?: string): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${AXIOMID_API}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

async function verifyPiToken(accessToken: string): Promise<unknown> {
  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Pi auth failed: ${res.status}`);
  return res.json();
}

// ── OpenIdentity Helpers ──

/** Cache the compiled schema across calls within the same server process. */
let _schemaCache: Record<string, unknown> | null = null;

async function getOpenIdentitySchema(): Promise<Record<string, unknown>> {
  if (_schemaCache) return _schemaCache;
  const res = await fetch(OPENIDENTITY_SCHEMA_URL);
  if (!res.ok) throw new Error(`Failed to fetch schema: ${res.status}`);
  const schema = await res.json();
  _schemaCache = schema;
  return schema;
}

async function validateAgainstSchema(manifest: unknown): Promise<{
  valid: boolean;
  errors: string[];
}> {
  try {
    const schema = await getOpenIdentitySchema();
    const ajv = new Ajv2020();
    const validate = ajv.compile(schema);
    const valid = validate(manifest) as boolean;
    return {
      valid,
      errors: valid ? [] : (validate.errors ?? []).map((e: { message?: string }) => e.message ?? "Unknown error"),
    };
  } catch (err) {
    return {
      valid: false,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  }
}

async function fetchOpenIdentityManifest(identifier: string): Promise<{
  source: string;
  manifest: unknown;
}> {
  // If the identifier looks like a full URL (contains scheme), fetch it directly
  if (identifier.startsWith("http://") || identifier.startsWith("https://")) {
    const res = await fetch(identifier, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Fetch from URL failed: ${res.status} ${res.statusText}`);
    const manifest = await res.json();
    return { source: identifier, manifest };
  }

  // If it looks like a domain (e.g. "agent.example.com"), try .well-known/openidentity
  if (
    !identifier.includes(":") && // not a DID
    (identifier.includes(".") || identifier.includes("localhost"))
  ) {
    const url = `https://${identifier}/.well-known/openidentity`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const manifest = await res.json();
      return { source: url, manifest };
    }
    // Fall through to AxiomID lookup
  }

  // Default: query AxiomID's agent manifest endpoint
  const url = `${AXIOMID_API}/api/agent/manifest?identifier=${encodeURIComponent(identifier)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    // If the AxiomID endpoint returns an error, try .well-known as a last resort
    // for DID-based identifiers
    if (identifier.startsWith("did:")) {
      // For DIDs, extract the domain and try .well-known
      const parts = identifier.split(":");
      if (parts.length >= 3 && parts[2].includes(".")) {
        const wkUrl = `https://${parts[2]}/.well-known/openidentity`;
        const wkRes = await fetch(wkUrl, {
          headers: { Accept: "application/json" },
        });
        if (wkRes.ok) {
          const manifest = await wkRes.json();
          return { source: wkUrl, manifest };
        }
      }
    }
    throw new Error(`AxiomID lookup failed: ${res.status} ${res.statusText}`);
  }
  const manifest = await res.json();
  return { source: url, manifest };
}

// ── MCP Server ──

const server = new Server(
  { name: "@pai/mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ── Identity Tools ──

      case "identity_verify": {
        const { accessToken } = args as { accessToken: string };
        const piUser = await verifyPiToken(accessToken);
        return { content: [{ type: "text", text: JSON.stringify(piUser) }] };
      }

      case "credential_issue": {
        const { did, credentialType } = args as {
          did: string;
          credentialType: string;
        };
        const result = await callAxiomid("/api/agent/identity/claim", {
          did,
          credentialType,
        });
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }

      case "credential_verify": {
        const { credential } = args as { credential: unknown };
        const result = await callAxiomid("/verify", { credential });
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }

      // ── OpenIdentity Tool ──

      case "openidentity_discover": {
        const { identifier } = args as { identifier: string };

        // Step 1: Fetch the manifest
        const { source, manifest } = await fetchOpenIdentityManifest(identifier);

        // Step 2: Validate against the JSON Schema
        const validation = await validateAgainstSchema(manifest);

        // Step 3: Return combined result
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  identifier,
                  source,
                  manifest,
                  validation: {
                    valid: validation.valid,
                    errors: validation.errors,
                    schema_url: OPENIDENTITY_SCHEMA_URL,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: JSON.stringify({ error: msg }) }],
      isError: true,
    };
  }
});

// ── Start ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[pai-mcp] Server started on stdio — ready for MCP requests");
}

main().catch((err) => {
  console.error("[pai-mcp] Fatal:", err);
  process.exit(1);
});
