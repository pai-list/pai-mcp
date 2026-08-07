import { describe, it, expect } from "vitest";
import worker from "../worker.js";

describe("PAI MCP Edge Gateway Worker (src/worker.ts)", () => {
  it("should return JSON health status on GET /health", async () => {
    const request = new Request("https://mcp.axiomid.app/health");
    const response = await worker.fetch(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");

    const data = await response.json();
    expect(data).toEqual({
      name: "pai-mcp-gateway",
      version: "0.1.0",
      status: "live",
      note: "Edge worker gateway for PAI MCP Protocol",
    });
  });

  it("should return HTML interactive console on GET /", async () => {
    const request = new Request("https://mcp.axiomid.app/");
    const response = await worker.fetch(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    const text = await response.text();
    expect(text).toContain("<!doctype html>");
    expect(text).toContain("PAI MCP Gateway");
  });

  it("should return HTML interactive console on GET /console", async () => {
    const request = new Request("https://mcp.axiomid.app/console");
    const response = await worker.fetch(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    const text = await response.text();
    expect(text).toContain("PAI MCP Gateway");
  });

  it("should return 404 for unknown routes", async () => {
    const request = new Request("https://mcp.axiomid.app/nonexistent");
    const response = await worker.fetch(request);

    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toBe("not found");
  });

  it("should handle JSON-RPC POST request for tools/list", async () => {
    const payload = {
      jsonrpc: "2.0",
      id: 42,
      method: "tools/list",
    };
    const request = new Request("https://mcp.axiomid.app/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await worker.fetch(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe(42);
    expect(data.result).toBeDefined();
    expect(Array.isArray(data.result.tools)).toBe(true);
    expect(data.result.tools.length).toBe(6);
  });

  it("should handle JSON-RPC POST request for tool invocation (tools/*)", async () => {
    const payload = {
      jsonrpc: "2.0",
      id: 101,
      method: "tools/memory_store",
      params: { key: "test_key", value: "test_val" },
    };
    const request = new Request("https://mcp.axiomid.app/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await worker.fetch(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe(101);
    expect(data.result.status).toBe("success");
    expect(data.result.method).toBe("tools/memory_store");
    expect(data.result.timestamp).toBeDefined();
  });

  it("should return 404 for POST requests without recognized method", async () => {
    const payload = {
      jsonrpc: "2.0",
      id: 102,
      method: "custom/unknown",
    };
    const request = new Request("https://mcp.axiomid.app/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await worker.fetch(request);
    expect(response.status).toBe(404);
  });

  it("should handle malformed JSON gracefully in POST request", async () => {
    const request = new Request("https://mcp.axiomid.app/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ malformed json",
    });

    const response = await worker.fetch(request);
    expect(response.status).toBe(404);
  });
});
