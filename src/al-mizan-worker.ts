// ============================================================
// PAI-MCP: Tri-Regional Model Router (Al-Mizan Router v1.4)
// Cloudflare Worker — TypeScript
// Collaboration: Kimi k2.6 × PAI Ecosystem
// ============================================================

export interface RouterRequest {
  prompt: string;
  targetLocale?: 'us' | 'cn' | 'mena' | 'auto';
  costPreference?: 'cheapest' | 'fastest' | 'balanced' | 'best-quality';
  requireArabic?: boolean;
  maxBudget?: number; // in USD per 1M tokens
  modelFamily?: 'general' | 'code' | 'math' | 'vision' | 'arabic';
}

export interface ModelProvider {
  id: string;
  region: 'us' | 'cn' | 'mena';
  name: string;
  models: string[];
  costPer1MInput: number;  // USD
  costPer1MOutput: number; // USD
  latencyP50: number;     // ms
  apiEndpoint: string;
  apiKeyEnv: string;
  rateLimit: { rpm: number; tpm: number; rpdFreeQuota: number };
  requires: string[];
  strengths: string[];
}

export const PROVIDERS: ModelProvider[] = [
  // 🇺🇸 US TIER: Frontier Quality & Free Quota Pools
  {
    id: 'cloudflare-workers-ai',
    region: 'us',
    name: 'Cloudflare Workers AI → Llama 3.1 8B',
    models: ['@cf/meta/llama-3.1-8b-instruct'],
    costPer1MInput: 0.00,
    costPer1MOutput: 0.00,
    latencyP50: 180,
    apiEndpoint: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.1-8b-instruct',
    apiKeyEnv: 'CF_API_TOKEN',
    rateLimit: { rpm: 100, tpm: 100000, rpdFreeQuota: 100000 },
    requires: ['cf_account_id'],
    strengths: ['general', 'fast']
  },
  {
    id: 'google-ai-studio',
    region: 'us',
    name: 'Google AI Studio → Gemini 1.5 Flash',
    models: ['gemini-1.5-flash'],
    costPer1MInput: 0.00, // Developer Free Tier (15 RPM / 1M TPM)
    costPer1MOutput: 0.00,
    latencyP50: 350,
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    apiKeyEnv: 'GEMINI_API_KEY',
    rateLimit: { rpm: 15, tpm: 1000000, rpdFreeQuota: 1500 },
    requires: [],
    strengths: ['general', 'code', 'vision', 'long-context']
  },
  {
    id: 'openrouter-openai',
    region: 'us',
    name: 'OpenRouter → GPT-4o',
    models: ['gpt-4o', 'gpt-4o-mini'],
    costPer1MInput: 2.50,
    costPer1MOutput: 10.00,
    latencyP50: 800,
    apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    rateLimit: { rpm: 500, tpm: 2000000, rpdFreeQuota: 0 },
    requires: [],
    strengths: ['general', 'vision', 'reasoning']
  },

  // 🇨🇳 CHINA TIER: Cost Arbitrage & MoE Efficiency
  {
    id: 'deepseek-chat',
    region: 'cn',
    name: 'DeepSeek → V3',
    models: ['deepseek-chat'],
    costPer1MInput: 0.14, // 18x Cheaper than GPT-4o
    costPer1MOutput: 0.28,
    latencyP50: 500,
    apiEndpoint: 'https://api.deepseek.com/chat/completions',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    rateLimit: { rpm: 300, tpm: 1000000, rpdFreeQuota: 0 },
    requires: [],
    strengths: ['code', 'math', 'general']
  },
  {
    id: 'deepseek-reasoner',
    region: 'cn',
    name: 'DeepSeek → R1',
    models: ['deepseek-reasoner'],
    costPer1MInput: 0.55,
    costPer1MOutput: 2.19,
    latencyP50: 1200,
    apiEndpoint: 'https://api.deepseek.com/chat/completions',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    rateLimit: { rpm: 100, tpm: 500000, rpdFreeQuota: 0 },
    requires: [],
    strengths: ['math', 'reasoning', 'code']
  },
  {
    id: 'alibaba-dashscope',
    region: 'cn',
    name: 'Alibaba → Qwen 2.5 72B',
    models: ['qwen2.5-72b-instruct'],
    costPer1MInput: 0.50,
    costPer1MOutput: 0.50,
    latencyP50: 600,
    apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    apiKeyEnv: 'DASHSCOPE_API_KEY',
    rateLimit: { rpm: 200, tpm: 500000, rpdFreeQuota: 70000000 }, // Alibaba 70M Free Tokens
    requires: [],
    strengths: ['code', 'general', 'chinese']
  },

  // 🇸🇦 MENA TIER: Regional & Sovereign Governance
  {
    id: 'jais-g42',
    region: 'mena',
    name: 'G42 → Jais 30B',
    models: ['jais-30b-chat'],
    costPer1MInput: 1.00,
    costPer1MOutput: 3.00,
    latencyP50: 450,
    apiEndpoint: 'https://api.core42.ai/v1/chat/completions',
    apiKeyEnv: 'CORE42_API_KEY',
    rateLimit: { rpm: 100, tpm: 300000, rpdFreeQuota: 0 },
    requires: [],
    strengths: ['arabic', 'general']
  }
];

export function detectLanguage(prompt: string): 'ar' | 'zh' | 'en' | 'other' {
  if (/[؀-ۿ]/.test(prompt)) return 'ar';
  if (/[一-鿿]/.test(prompt)) return 'zh';
  return 'en';
}

export function classifyTask(prompt: string): 'general' | 'code' | 'math' | 'vision' | 'arabic' {
  const lower = prompt.toLowerCase();
  if (lower.includes('code') || lower.includes('function') || lower.includes('bug')) return 'code';
  if (lower.includes('math') || lower.includes('calculate') || lower.includes('solve')) return 'math';
  if (lower.includes('image') || lower.includes('vision') || lower.includes('describe this')) return 'vision';
  if (detectLanguage(prompt) === 'ar') return 'arabic';
  return 'general';
}

export function scoreProvider(provider: ModelProvider, task: string, preference: string, language: string): number {
  const avgCost = (provider.costPer1MInput + provider.costPer1MOutput) / 2;
  const costScore = avgCost === 0 ? 100 : Math.max(0, 100 - (avgCost * 10));
  const latencyScore = Math.max(0, 100 - (provider.latencyP50 / 20));
  const taskMatch = provider.strengths.includes(task) ? 100 : 30;

  let regionScore = 50;
  if (language === 'ar' && provider.region === 'mena') regionScore = 100;
  if (language === 'zh' && provider.region === 'cn') regionScore = 100;
  if (language === 'en' && provider.region === 'us') regionScore = 80;

  switch (preference) {
    case 'cheapest': return costScore * 0.6 + latencyScore * 0.2 + taskMatch * 0.1 + regionScore * 0.1;
    case 'fastest': return latencyScore * 0.5 + costScore * 0.2 + taskMatch * 0.2 + regionScore * 0.1;
    case 'best-quality': return taskMatch * 0.5 + regionScore * 0.3 + latencyScore * 0.1 + costScore * 0.1;
    case 'balanced': default: return costScore * 0.3 + latencyScore * 0.3 + taskMatch * 0.2 + regionScore * 0.2;
  }
}

export async function routePrompt(request: RouterRequest) {
  const language = detectLanguage(request.prompt);
  const task = classifyTask(request.prompt);
  const preference = request.costPreference || 'balanced';

  let candidates = PROVIDERS;
  if (request.targetLocale && request.targetLocale !== 'auto') {
    candidates = candidates.filter(p => p.region === request.targetLocale);
  }

  const scored = candidates.map(p => ({
    provider: p,
    score: scoreProvider(p, task, preference, language),
    model: p.models[0]
  })).sort((a, b) => b.score - a.score);

  return {
    provider: scored[0].provider,
    model: scored[0].model,
    score: scored[0].score,
    fallbackChain: scored.slice(0, 3).map(s => s.provider)
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    try {
      const body: RouterRequest = await request.json();
      const result = await routePrompt(body);
      return new Response(JSON.stringify({
        success: true,
        collaboration: "Kimi k2.6 x PAI Ecosystem",
        routing: {
          provider: result.provider.name,
          region: result.provider.region,
          model: result.model,
          estimatedCostPer1M: { input: result.provider.costPer1MInput, output: result.provider.costPer1MOutput },
          estimatedLatency: result.provider.latencyP50,
          score: result.score,
          fallbackChain: result.fallbackChain.map(p => p.name)
        }
      }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: (e as Error).message }), { status: 500 });
    }
  }
};
