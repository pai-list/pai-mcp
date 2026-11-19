import { describe, it, expect } from "vitest";
import routerWorker, {
  detectLanguage,
  classifyTask,
  scoreProvider,
  routePrompt,
  PROVIDERS,
} from "../al-mizan-worker.js";

describe("Al-Mizan Tri-Regional Model Router (src/al-mizan-worker.ts)", () => {
  describe("detectLanguage", () => {
    it("should detect Arabic text", () => {
      expect(detectLanguage("مرحبا بك في بروتوكول PAI")).toBe("ar");
    });

    it("should detect Chinese text", () => {
      expect(detectLanguage("你好，人工智能 Gateway")).toBe("zh");
    });

    it("should default to English for Latin text", () => {
      expect(detectLanguage("Hello World from PAI MCP")).toBe("en");
    });
  });

  describe("classifyTask", () => {
    it("should classify code-related prompts", () => {
      expect(classifyTask("Write a JavaScript function to sort items")).toBe("code");
      expect(classifyTask("Fix this bug in Python")).toBe("code");
    });

    it("should classify math-related prompts", () => {
      expect(classifyTask("Solve this matrix math equation")).toBe("math");
      expect(classifyTask("Calculate the exponential decay")).toBe("math");
    });

    it("should classify vision-related prompts", () => {
      expect(classifyTask("Describe this image in detail")).toBe("vision");
    });

    it("should classify Arabic prompts as arabic task", () => {
      expect(classifyTask("كيف يمكنني كتابة هذا المقال؟")).toBe("arabic");
    });

    it("should classify general prompts", () => {
      expect(classifyTask("Tell me a story about space travel")).toBe("general");
    });
  });

  describe("scoreProvider", () => {
    it("should score providers higher when cost preference is cheapest for free providers", () => {
      const freeProvider = PROVIDERS.find((p) => p.id === "cloudflare-workers-ai")!;
      const paidProvider = PROVIDERS.find((p) => p.id === "openrouter-openai")!;

      const freeScore = scoreProvider(freeProvider, "general", "cheapest", "en");
      const paidScore = scoreProvider(paidProvider, "general", "cheapest", "en");

      expect(freeScore).toBeGreaterThan(paidScore);
    });

    it("should give bonus region score for Arabic in MENA region", () => {
      const menaProvider = PROVIDERS.find((p) => p.id === "jais-g42")!;
      const usProvider = PROVIDERS.find((p) => p.id === "google-ai-studio")!;

      const menaScore = scoreProvider(menaProvider, "arabic", "balanced", "ar");
      const usScore = scoreProvider(usProvider, "arabic", "balanced", "ar");

      expect(menaScore).toBeGreaterThan(usScore);
    });
  });

  describe("routePrompt", () => {
    it("should route prompt to best provider and generate fallback chain", async () => {
      const req = {
        prompt: "Write a high-performance Rust function for mem7",
        costPreference: "best-quality" as const,
      };
      const result = await routePrompt(req);

      expect(result.provider).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.fallbackChain.length).toBeLessThanOrEqual(3);
    });

    it("should filter providers by targetLocale if specified", async () => {
      const req = {
        prompt: "Optimize database query",
        targetLocale: "cn" as const,
      };
      const result = await routePrompt(req);

      expect(result.provider.region).toBe("cn");
      result.fallbackChain.forEach((p) => expect(p.region).toBe("cn"));
    });
  });

  describe("worker fetch handler", () => {
    it("should reject non-POST requests with 405 Method Not Allowed", async () => {
      const req = new Request("https://router.axiomid.app/", { method: "GET" });
      const res = await routerWorker.fetch(req);

      expect(res.status).toBe(405);
      const text = await res.text();
      expect(text).toBe("Method not allowed");
    });

    it("should process valid POST request and return routing result", async () => {
      const req = new Request("https://router.axiomid.app/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Translate this text to Arabic",
          costPreference: "fastest",
        }),
      });

      const res = await routerWorker.fetch(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.collaboration).toBe("Kimi k2.6 x PAI Ecosystem");
      expect(json.routing).toBeDefined();
      expect(json.routing.provider).toBeDefined();
      expect(json.routing.region).toBeDefined();
      expect(json.routing.fallbackChain.length).toBeGreaterThan(0);
    });

    it("should handle JSON parse failure with 500 error", async () => {
      const req = new Request("https://router.axiomid.app/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ bad json",
      });

      const res = await routerWorker.fetch(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
    });
  });
});
