import { describe, it, expect } from "vitest";
import { TOOLS } from "../index.js";

describe("MCP Tool Definitions", () => {
  it("should export an array of 7 MCP tools", () => {
    expect(Array.isArray(TOOLS)).toBe(true);
    expect(TOOLS.length).toBe(7);
  });

  it("should contain all expected tool names", () => {
    const names = TOOLS.map((t) => t.name);
    expect(names).toEqual([
      "memory_store",
      "memory_recall",
      "memory_delete",
      "identity_verify",
      "credential_issue",
      "credential_verify",
      "openidentity_discover",
    ]);
  });

  it("should have valid tool definitions with required input schemas", () => {
    for (const tool of TOOLS) {
      expect(tool.name).toBeTypeOf("string");
      expect(tool.description).toBeTypeOf("string");
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.inputSchema.properties).toBeDefined();
    }
  });

  it("should define correct parameters for memory_store tool", () => {
    const tool = TOOLS.find((t) => t.name === "memory_store");
    expect(tool).toBeDefined();
    expect(tool?.inputSchema.required).toEqual(["content", "userId"]);
    expect(tool?.inputSchema.properties).toHaveProperty("content");
    expect(tool?.inputSchema.properties).toHaveProperty("userId");
    expect(tool?.inputSchema.properties).toHaveProperty("sessionId");
  });

  it("should define correct parameters for memory_recall tool", () => {
    const tool = TOOLS.find((t) => t.name === "memory_recall");
    expect(tool).toBeDefined();
    expect(tool?.inputSchema.required).toEqual(["query", "userId"]);
    expect(tool?.inputSchema.properties).toHaveProperty("query");
    expect(tool?.inputSchema.properties).toHaveProperty("userId");
    expect(tool?.inputSchema.properties).toHaveProperty("limit");
    expect(tool?.inputSchema.properties).toHaveProperty("taskType");
  });

  it("should define correct parameters for memory_delete tool", () => {
    const tool = TOOLS.find((t) => t.name === "memory_delete");
    expect(tool).toBeDefined();
    expect(tool?.inputSchema.required).toEqual(["id"]);
    expect(tool?.inputSchema.properties).toHaveProperty("id");
  });

  it("should define correct parameters for identity_verify tool", () => {
    const tool = TOOLS.find((t) => t.name === "identity_verify");
    expect(tool).toBeDefined();
    expect(tool?.inputSchema.required).toEqual(["accessToken"]);
    expect(tool?.inputSchema.properties).toHaveProperty("accessToken");
  });

  it("should define correct parameters for credential_issue tool", () => {
    const tool = TOOLS.find((t) => t.name === "credential_issue");
    expect(tool).toBeDefined();
    expect(tool?.inputSchema.required).toEqual(["did", "credentialType"]);
    expect(tool?.inputSchema.properties).toHaveProperty("did");
    expect(tool?.inputSchema.properties).toHaveProperty("credentialType");
  });

  it("should define correct parameters for credential_verify tool", () => {
    const tool = TOOLS.find((t) => t.name === "credential_verify");
    expect(tool).toBeDefined();
    expect(tool?.inputSchema.required).toEqual(["credential"]);
    expect(tool?.inputSchema.properties).toHaveProperty("credential");
  });

  it("should define correct parameters for openidentity_discover tool", () => {
    const tool = TOOLS.find((t) => t.name === "openidentity_discover");
    expect(tool).toBeDefined();
    expect(tool?.inputSchema.required).toEqual(["identifier"]);
    expect(tool?.inputSchema.properties).toHaveProperty("identifier");
  });
});
