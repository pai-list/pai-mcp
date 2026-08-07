import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  callAxiomid,
  verifyPiToken,
  validateAgainstSchema,
  fetchOpenIdentityManifest,
  AXIOMID_API,
  OPENIDENTITY_SCHEMA_URL,
} from "../index.js";

describe("MCP API Helpers & Protocol Handling", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("callAxiomid", () => {
    it("should send POST request to AxiomID endpoint with body and authorization headers", async () => {
      const mockResponseData = { success: true, memoryId: "mem_123" };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponseData,
      } as Response);

      const res = await callAxiomid("/api/memory", { action: "store" }, "test_token");

      expect(global.fetch).toHaveBeenCalledWith(
        `${AXIOMID_API}/api/memory`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test_token",
          },
          body: JSON.stringify({ action: "store" }),
        })
      );
      expect(res).toEqual(mockResponseData);
    });

    it("should omit Authorization header if token is not provided", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok" }),
      } as Response);

      await callAxiomid("/verify", { credential: {} });

      expect(global.fetch).toHaveBeenCalledWith(
        `${AXIOMID_API}/verify`,
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  describe("verifyPiToken", () => {
    it("should call Pi API and return user data on success", async () => {
      const piUser = { uid: "pi_user_001", username: "pi_pioneer" };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => piUser,
      } as Response);

      const result = await verifyPiToken("valid_pi_token");

      expect(global.fetch).toHaveBeenCalledWith("https://api.minepi.com/v2/me", {
        headers: { Authorization: "Bearer valid_pi_token" },
      });
      expect(result).toEqual(piUser);
    });

    it("should throw error if Pi auth response is not ok", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      await expect(verifyPiToken("invalid_token")).rejects.toThrow("Pi auth failed: 401");
    });
  });

  describe("validateAgainstSchema", () => {
    it("should validate a correct OpenIdentity manifest against schema", async () => {
      const validSchema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {
          name: { type: "string" },
          version: { type: "string" },
        },
        required: ["name"],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => validSchema,
      } as Response);

      const manifest = { name: "Agent Alpha", version: "1.0.0" };
      const validation = await validateAgainstSchema(manifest);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it("should return validation errors for an invalid manifest", async () => {
      const validSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => validSchema,
      } as Response);

      const invalidManifest = { age: 42 };
      const validation = await validateAgainstSchema(invalidManifest);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("should handle schema fetch failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const validation = await validateAgainstSchema({});
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain("Failed to fetch schema: 404");
    });
  });

  describe("fetchOpenIdentityManifest", () => {
    it("should fetch manifest directly if identifier is a URL", async () => {
      const mockManifest = { name: "URL Agent" };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const url = "https://agent.example.com/openidentity.json";
      const result = await fetchOpenIdentityManifest(url);

      expect(result.source).toBe(url);
      expect(result.manifest).toEqual(mockManifest);
    });

    it("should throw error if URL fetch fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      await expect(
        fetchOpenIdentityManifest("https://example.com/missing.json")
      ).rejects.toThrow("Fetch from URL failed: 404 Not Found");
    });

    it("should try well-known path for domain identifiers", async () => {
      const mockManifest = { name: "Domain Agent" };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const result = await fetchOpenIdentityManifest("agent.example.com");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://agent.example.com/.well-known/openidentity",
        { headers: { Accept: "application/json" } }
      );
      expect(result.manifest).toEqual(mockManifest);
    });

    it("should fallback to AxiomID lookup if domain well-known fails or for simple usernames", async () => {
      const mockManifest = { name: "Axiom Agent" };
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("well-known")) {
          return { ok: false, status: 404 } as Response;
        }
        return {
          ok: true,
          json: async () => mockManifest,
        } as Response;
      });

      const result = await fetchOpenIdentityManifest("myagent");
      expect(result.source).toBe(`${AXIOMID_API}/api/agent/manifest?identifier=myagent`);
      expect(result.manifest).toEqual(mockManifest);
    });

    it("should handle DID fallback to well-known when AxiomID lookup fails", async () => {
      const mockManifest = { name: "DID Agent" };
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("axiomid.app")) {
          return { ok: false, status: 404, statusText: "Not Found" } as Response;
        }
        if (url.includes("agent.org")) {
          return { ok: true, json: async () => mockManifest } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      const did = "did:axiom:agent.org:12345";
      const result = await fetchOpenIdentityManifest(did);
      expect(result.source).toBe("https://agent.org/.well-known/openidentity");
      expect(result.manifest).toEqual(mockManifest);
    });
  });
});
