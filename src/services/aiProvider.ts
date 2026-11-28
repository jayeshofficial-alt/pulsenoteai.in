/**
 * PulseNote AI — OpenAI-Compatible 3-Tier Fallback AI Provider Engine
 *
 * Priority order:
 *   1. CodeCraft API  (https://codecraftapi.com/v1)
 *   2. Iteracompute   (https://platform.iteracompute.com/v1)
 *   3. OpenRouter     (https://openrouter.ai/api/v1)
 *
 * Safe to import and initialize even when zero API keys are configured.
 * Works identically in Node.js (Express server / server.js) and browser (Vite SPA).
 */

export type AIProviderId = 'codecraft' | 'iteracompute' | 'openrouter';

export type AIMessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AIMessageContentPart[];
}

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  baseUrl: string;
  apiKey: string;
  fastModel: string;
  proModel: string;
  extraHeaders?: Record<string, string>;
}

export interface GenerateWithFallbackOptions {
  prompt?: string;
  messages?: Array<AIMessage | { role: string; content: any }>;
  systemInstruction?: string;
  responseFormat?: 'text' | 'json';
  tier?: 'fast' | 'pro';
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface ProviderAttemptRecord {
  providerId: AIProviderId;
  providerName: string;
  model: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface GenerateWithFallbackResult {
  text: string;
  providerId: AIProviderId;
  providerName: string;
  modelUsed: string;
  attempts: ProviderAttemptRecord[];
}

export interface AIProviderStatusItem {
  id: AIProviderId;
  priority: number;
  name: string;
  baseUrl: string;
  configured: boolean;
  fastModel: string;
  proModel: string;
}

function readEnv(viteKey: string, nodeKey?: string): string {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && typeof metaEnv[viteKey] === 'string' && metaEnv[viteKey].trim()) {
      return metaEnv[viteKey].trim();
    }
  } catch {
    // import.meta.env unavailable in pure Node runtime
  }

  try {
    if (typeof process !== 'undefined' && process?.env) {
      if (nodeKey) {
        const fromNode = process.env[nodeKey];
        if (typeof fromNode === 'string' && fromNode.trim()) {
          return fromNode.trim();
        }
      }
      const fromVite = process.env[viteKey];
      if (typeof fromVite === 'string' && fromVite.trim()) {
        return fromVite.trim();
      }
    }
  } catch {
    // process unavailable in browser
  }

  return '';
}

function readBrowserKey(storageKey: string): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const value = window.localStorage.getItem(storageKey);
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  } catch {
    // localStorage unavailable
  }
  return '';
}

function looksLikeApiKey(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return (
    /^(sk-|sk-or-|cc_|ick_|AIza|ghp_|gho_|xox[baprs]-|rzp_)/i.test(trimmed) ||
    trimmed.length > 80 ||
    /\s/.test(trimmed)
  );
}

function resolveModelName(candidates: string[], fallback: string): string {
  for (const candidate of candidates) {
    if (candidate && !looksLikeApiKey(candidate)) {
      return candidate;
    }
  }
  return fallback;
}

export function getProviderChain(): AIProviderConfig[] {
  const referer =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : readEnv('VITE_APP_URL', 'APP_URL') || 'https://pulsenoteai.in';

  const codecraftFast = resolveModelName(
    [readEnv('VITE_CODECRAFT_MODEL', 'CODECRAFT_MODEL')],
    'gemini-3.7-flash'
  );
  const codecraftPro = resolveModelName(
    [
      readEnv('VITE_CODECRAFT_PRO_MODEL', 'CODECRAFT_PRO_MODEL'),
      readEnv('VITE_CODECRAFT_MODEL', 'CODECRAFT_MODEL'),
    ],
    'claude-sonnet-5'
  );

  const iteraFast = resolveModelName(
    [readEnv('VITE_ITERACOMPUTE_MODEL', 'ITERACOMPUTE_MODEL')],
    'gpt-4o-mini'
  );
  const iteraPro = resolveModelName(
    [
      readEnv('VITE_ITERACOMPUTE_PRO_MODEL', 'ITERACOMPUTE_PRO_MODEL'),
      readEnv('VITE_ITERACOMPUTE_MODEL', 'ITERACOMPUTE_MODEL'),
    ],
    'gpt-4o'
  );

  const openrouterFast = resolveModelName(
    [readEnv('VITE_OPENROUTER_MODEL', 'OPENROUTER_MODEL')],
    'google/gemini-4-hydrogen'
  );
  const openrouterPro = resolveModelName(
    [
      readEnv('VITE_OPENROUTER_PRO_MODEL', 'OPENROUTER_PRO_MODEL'),
      readEnv('VITE_OPENROUTER_MODEL', 'OPENROUTER_MODEL'),
    ],
    'google/gemini-4-hydrogen'
  );

  return [
    {
      id: 'codecraft',
      name: 'CodeCraft API',
      baseUrl: (
        readEnv('VITE_CODECRAFT_BASE_URL', 'CODECRAFT_BASE_URL') ||
        'https://codecraftapi.com/v1'
      ).replace(/\/+$/, ''),
      apiKey:
        readEnv('VITE_CODECRAFT_API_KEY', 'CODECRAFT_API_KEY') ||
        readBrowserKey('pulsenote_codecraft_api_key'),
      fastModel: codecraftFast,
      proModel: codecraftPro,
    },
    {
      id: 'iteracompute',
      name: 'Iteracompute',
      baseUrl: (
        readEnv('VITE_ITERACOMPUTE_BASE_URL', 'ITERACOMPUTE_BASE_URL') ||
        'https://platform.iteracompute.com/v1'
      ).replace(/\/+$/, ''),
      apiKey:
        readEnv('VITE_ITERACOMPUTE_API_KEY', 'ITERACOMPUTE_API_KEY') ||
        readBrowserKey('pulsenote_iteracompute_api_key'),
      fastModel: iteraFast,
      proModel: iteraPro,
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      baseUrl: (
        readEnv('VITE_OPENROUTER_BASE_URL', 'OPENROUTER_BASE_URL') ||
        'https://openrouter.ai/api/v1'
      ).replace(/\/+$/, ''),
      apiKey:
        readEnv('VITE_OPENROUTER_API_KEY', 'OPENROUTER_API_KEY') ||
        readBrowserKey('pulsenote_openrouter_api_key'),
      fastModel: openrouterFast,
      proModel: openrouterPro,
      extraHeaders: {
        'HTTP-Referer': referer,
        'X-Title': 'PulseNote AI',
      },
    },
  ];
}

export function getAIProviderChainStatus(): AIProviderStatusItem[] {
  return getProviderChain().map((p, index) => ({
    id: p.id,
    priority: index + 1,
    name: p.name,
    baseUrl: p.baseUrl,
    configured: Boolean(p.apiKey && p.apiKey.trim().length > 0),
    fastModel: p.fastModel,
    proModel: p.proModel,
  }));
}

function buildNormalizedMessages(options: GenerateWithFallbackOptions): AIMessage[] {
  const normalized: AIMessage[] = [];

  if (options.systemInstruction && options.systemInstruction.trim()) {
    normalized.push({
      role: 'system',
      content: options.systemInstruction.trim(),
    });
  }

  if (Array.isArray(options.messages) && options.messages.length > 0) {
    for (const msg of options.messages) {
      if (!msg) continue;
      const role: AIMessage['role'] =
        msg.role === 'system'
          ? 'system'
          : msg.role === 'assistant' || msg.role === 'model'
          ? 'assistant'
          : 'user';

      if (typeof msg.content === 'string') {
        if (msg.content.trim()) {
          normalized.push({ role, content: msg.content });
        }
      } else if (Array.isArray(msg.content) && msg.content.length > 0) {
        normalized.push({ role, content: msg.content });
      }
    }
  }

  if (options.prompt && options.prompt.trim()) {
    normalized.push({
      role: 'user',
      content: options.prompt.trim(),
    });
  }

  return normalized;
}

function extractMessageText(payload: any): string {
  const choice = payload?.choices?.[0];
  const msgContent = choice?.message?.content;

  if (typeof msgContent === 'string' && msgContent.trim()) {
    return msgContent.trim();
  }

  if (Array.isArray(msgContent)) {
    const joined = msgContent
      .map((part: any) => (typeof part === 'string' ? part : part?.text || ''))
      .join('')
      .trim();
    if (joined) return joined;
  }

  if (typeof choice?.text === 'string' && choice.text.trim()) {
    return choice.text.trim();
  }

  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  return '';
}

function parseErrorDetail(rawText: string, status: number): string {
  if (!rawText) return `HTTP ${status}`;
  try {
    const parsed = JSON.parse(rawText);
    const msg =
      parsed?.error?.message ||
      parsed?.error?.code ||
      parsed?.message ||
      parsed?.detail;
    if (typeof msg === 'string' && msg.trim()) {
      return `HTTP ${status}: ${msg.trim()}`;
    }
  } catch {
    // plain text or HTML error response
  }
  const compact = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return `HTTP ${status}: ${compact.slice(0, 140) || 'Upstream error'}`;
}

async function fetchWithCombinedAbort(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);

  const onExternalAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      throw new DOMException('Request aborted by user', 'AbortError');
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

/**
 * OpenAI-compatible 3-tier fallback generator.
 * Always tries:
 *   1. CodeCraft API -> 2. Iteracompute -> 3. OpenRouter
 * Surfaces a clear error ONLY if all 3 providers fail.
 */
export async function generateWithFallback(
  options: GenerateWithFallbackOptions
): Promise<GenerateWithFallbackResult> {
  const messages = buildNormalizedMessages(options);
  if (messages.length === 0) {
    throw new Error('Cannot generate AI response: prompt or messages are required.');
  }

  const providers = getProviderChain();
  const tier = options.tier || 'fast';
  const timeoutMs = options.timeoutMs ?? 30000;
  const attempts: ProviderAttemptRecord[] = [];

  for (const provider of providers) {
    if (options.signal?.aborted) {
      throw new DOMException('Request aborted by user', 'AbortError');
    }

    const model = tier === 'pro' ? provider.proModel : provider.fastModel;
    if (!provider.apiKey) {
      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        model,
        ok: false,
        error: 'API key not configured',
      });
      continue;
    }

    const endpoint = `${provider.baseUrl}/chat/completions`;
    const bodyPayload: Record<string, any> = {
      model,
      messages,
    };
    if (typeof options.temperature === 'number') {
      bodyPayload.temperature = options.temperature;
    }
    if (typeof options.maxTokens === 'number') {
      bodyPayload.max_tokens = options.maxTokens;
    }
    if (options.responseFormat === 'json') {
      bodyPayload.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetchWithCombinedAbort(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.apiKey}`,
            ...(provider.extraHeaders || {}),
          },
          body: JSON.stringify(bodyPayload),
        },
        timeoutMs,
        options.signal
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        const detail = parseErrorDetail(errText, response.status);
        console.warn(`[AIProvider] ${provider.name} (${model}) failed: ${detail}`);
        attempts.push({
          providerId: provider.id,
          providerName: provider.name,
          model,
          ok: false,
          status: response.status,
          error: detail,
        });
        continue;
      }

      const data = await response.json().catch(() => null);
      const text = extractMessageText(data);

      if (!text) {
        console.warn(`[AIProvider] ${provider.name} (${model}) returned empty content; trying next provider.`);
        attempts.push({
          providerId: provider.id,
          providerName: provider.name,
          model,
          ok: false,
          status: response.status,
          error: 'Empty response from provider',
        });
        continue;
      }

      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        model: data?.model || model,
        ok: true,
        status: response.status,
      });

      return {
        text,
        providerId: provider.id,
        providerName: provider.name,
        modelUsed: data?.model || model,
        attempts,
      };
    } catch (err: any) {
      if (options.signal?.aborted || (err?.name === 'AbortError' && options.signal?.aborted)) {
        throw new DOMException('Request aborted by user', 'AbortError');
      }
      const errMsg =
        err?.name === 'AbortError'
          ? `Request timed out after ${Math.round(timeoutMs / 1000)}s`
          : err?.message || 'Network error';
      console.warn(`[AIProvider] ${provider.name} (${model}) error: ${errMsg}`);
      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        model,
        ok: false,
        error: errMsg,
      });
    }
  }

  const allMissingKeys =
    attempts.length > 0 && attempts.every((a) => a.error === 'API key not configured');
  if (allMissingKeys) {
    throw new Error(
      'No AI provider API key configured. Please set CODECRAFT_API_KEY, ITERACOMPUTE_API_KEY, or OPENROUTER_API_KEY (or VITE_* equivalents) in environment secrets, or add a key in AI Provider Settings.'
    );
  }

  const summary = attempts
    .map((a) => `${a.providerName} (${a.error || 'failed'})`)
    .join('; ');
  throw new Error(
    `All 3 AI providers failed (CodeCraft API -> Iteracompute -> OpenRouter). Details: ${summary}`
  );
}

/**
 * Streaming OpenAI-compatible 3-tier fallback generator.
 * Falls back cleanly across CodeCraft API -> Iteracompute -> OpenRouter.
 */
export async function* streamWithFallback(
  options: GenerateWithFallbackOptions
): AsyncGenerator<{ chunk: string; providerId: AIProviderId; providerName: string; modelUsed: string }, void, unknown> {
  const messages = buildNormalizedMessages(options);
  if (messages.length === 0) {
    throw new Error('Cannot stream AI response: prompt or messages are required.');
  }

  const providers = getProviderChain();
  const tier = options.tier || 'fast';
  const timeoutMs = options.timeoutMs ?? 35000;
  const attempts: ProviderAttemptRecord[] = [];

  for (const provider of providers) {
    if (options.signal?.aborted) {
      throw new DOMException('Request aborted by user', 'AbortError');
    }

    const model = tier === 'pro' ? provider.proModel : provider.fastModel;
    if (!provider.apiKey) continue;

    try {
      const response = await fetchWithCombinedAbort(
        `${provider.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.apiKey}`,
            ...(provider.extraHeaders || {}),
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
            ...(typeof options.temperature === 'number' ? { temperature: options.temperature } : {}),
            ...(typeof options.maxTokens === 'number' ? { max_tokens: options.maxTokens } : {}),
          }),
        },
        timeoutMs,
        options.signal
      );

      if (!response.ok || !response.body) {
        const errText = await response.text().catch(() => '');
        attempts.push({
          providerId: provider.id,
          providerName: provider.name,
          model,
          ok: false,
          status: response.status,
          error: parseErrorDetail(errText, response.status),
        });
        continue;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let yieldedAny = false;

      while (true) {
        if (options.signal?.aborted) {
          reader.cancel().catch(() => {});
          throw new DOMException('Request aborted by user', 'AbortError');
        }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const raw = trimmed.slice(5).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              yieldedAny = true;
              yield {
                chunk: delta,
                providerId: provider.id,
                providerName: provider.name,
                modelUsed: parsed?.model || model,
              };
            }
          } catch {
            // ignore non-JSON heartbeat lines
          }
        }
      }

      if (yieldedAny) {
        return;
      }

      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        model,
        ok: false,
        error: 'Stream completed with empty output',
      });
    } catch (err: any) {
      if (options.signal?.aborted) {
        throw new DOMException('Request aborted by user', 'AbortError');
      }
      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        model,
        ok: false,
        error: err?.message || 'Streaming network error',
      });
    }
  }

  // Final non-streaming fallback attempt across the chain before failing
  const fallback = await generateWithFallback(options);
  yield {
    chunk: fallback.text,
    providerId: fallback.providerId,
    providerName: fallback.providerName,
    modelUsed: fallback.modelUsed,
  };
}
