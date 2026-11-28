/**
 * OpenRouter AI Service
 * Connects directly to https://openrouter.ai/api/v1/chat/completions
 * using import.meta.env.VITE_OPENROUTER_API_KEY
 */

import {
  generateWithFallback,
  streamWithFallback,
  getProviderChain,
} from './aiProvider';

export const API_URL = "https://openrouter.ai/api/v1/chat/completions";
export const API_KEY = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || "";

export const OPENROUTER_API_KEY =
  (typeof process !== 'undefined' && (process as any)?.env?.OPENROUTER_API_KEY) ||
  ((import.meta as any).env?.VITE_OPENROUTER_API_KEY) ||
  '';

export async function askOpenRouter(
  messages: Array<{ role: string; content: string }>,
  model: string = "openai/gpt-4o-mini"
): Promise<string> {
  return await chatCompletion(messages, model);
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system' | 'model';
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
}

export const OPENROUTER_MODELS = {
  default: 'openai/gpt-4o-mini',
  flagship: 'openai/gpt-4o',
  claude: 'anthropic/claude-3.5-sonnet',
  llama: 'meta-llama/llama-3.3-70b-instruct',
  fast: 'openai/gpt-4o-mini',
} as const;

export const APP_NAME = 'PulseNote AI';

export { MODE_SYSTEM_PROMPTS, getSystemPromptForMode } from '../data/modePrompts';

export const SYSTEM_PROMPT = `You are a helpful assistant that can CREATE images. When a user asks you to
create, generate, draw, or design an image, produce the image directly. Do not
redirect the user to external websites for images you can generate.

Guidelines for images:
- Describe briefly what you created, then show the image.
- If the request is vague, make a reasonable creative choice and offer to adjust it.
- For real, identifiable people (including politicians and public figures):
  do NOT create photorealistic images, since they could be mistaken for real
  photos or used for misinformation. Instead, offer a clearly stylized,
  illustrated, or cartoon-style artwork, and explain why. For official
  photographs, direct the user to the official source, such as pmindia.gov.in
  for Prime Minister's Office media.
- Never create sexual content, graphic violence, or content depicting minors
  in harmful situations.

For text questions, answer clearly and helpfully.`;

/**
 * Resolves the OpenRouter API key from:
 * 1. import.meta.env.VITE_OPENROUTER_API_KEY
 * 2. localStorage ('pulsenote_openrouter_api_key')
 * 3. Server endpoint (/api/openrouter/key) — bridged from OPENROUTER_API_KEY env
 */
export function getOpenRouterApiKey(): string {
  const envKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim() && envKey !== 'YOUR_OPENROUTER_API_KEY') {
    return envKey.trim();
  }

  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pulsenote_openrouter_api_key');
      if (stored && stored.trim()) return stored.trim();
    }
  } catch {}

  return '';
}

/** Cached server-bridged key to avoid repeated fetches */
let _serverKeyCache: string | null = null;

/** Current admin email (set by the app on login/logout) */
let _adminEmail: string | null = null;

/** Sets the current admin email (called on login/logout) */
export function setAdminEmail(email: string | null): void {
  _adminEmail = email;
  _serverKeyCache = null; // clear cache when user changes
}

/**
 * Fetches the OpenRouter key from the server (OPENROUTER_API_KEY env var).
 * Only works for admin users — server validates the email.
 * Returns '' if not admin, not configured, or on any error.
 */
export async function getServerOpenRouterKey(): Promise<string> {
  if (_serverKeyCache) return _serverKeyCache;
  if (!_adminEmail || !isAdminEmail(_adminEmail)) return '';
  try {
    const res = await fetch(`/api/openrouter/key?email=${encodeURIComponent(_adminEmail)}`);
    if (!res.ok) return '';
    const data = await res.json();
    const key = data?.apiKey || '';
    if (key && typeof key === 'string' && key.trim()) {
      _serverKeyCache = key.trim();
      return _serverKeyCache;
    }
  } catch {}
  return '';
}

/** Clears the cached server key (used when user saves/removes their own key) */
export function clearServerKeyCache(): void {
  _serverKeyCache = null;
}

/** Returns true if the given email is a strict admin */
export function isAdminEmail(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === 'jayeshofficial@gmail.com' || clean === 'contact@pulsenoteai.in' || clean === 'wagh.jayesh@gmail.com';
}

/**
 * Standard chatCompletion function required by specification:
 * POST https://openrouter.ai/api/v1/chat/completions
 * Headers:
 *   Authorization: Bearer <key>
 *   Content-Type: application/json
 *   HTTP-Referer: window.location.origin
 *   X-Title: the app name (PulseNote AI)
 * Body: { model, messages }
 * Returns: choices[0].message.content
 * Throws clear error if response is not ok
 */
export async function chatCompletion(
  messages: Array<OpenRouterMessage | { role: string; content: any }>,
  model: string = 'openai/gpt-4o-mini',
  options?: {
    temperature?: number;
    max_tokens?: number;
    signal?: AbortSignal;
  }
): Promise<string> {
  const normalizedMessages = messages.map((m) => ({
    role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
    content: m.content,
  }));

  const tier =
    model.toLowerCase().includes('pro') ||
    model.toLowerCase().includes('claude') ||
    model === 'openai/gpt-4o'
      ? 'pro'
      : 'fast';

  const hasClientKey = getProviderChain().some((p) => Boolean(p.apiKey && p.apiKey.trim()));
  if (hasClientKey) {
    const result = await generateWithFallback({
      messages: normalizedMessages,
      tier,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.max_tokens ?? 2048,
      signal: options?.signal,
    });
    return result.text;
  }

  // Fallback to server-side 3-tier AI endpoint when API keys are configured server-side
  const proxyRes = await fetch('/api/openrouter/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: normalizedMessages,
      model,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2048,
    }),
    signal: options?.signal,
  });

  if (!proxyRes.ok) {
    let errDetail = '';
    try {
      const errText = await proxyRes.text();
      try {
        const errJson = JSON.parse(errText);
        errDetail = errJson.error?.message || errJson.error || errJson.message || errText;
      } catch {
        errDetail = errText;
      }
    } catch {}
    throw new Error(
      errDetail || `AI service error (${proxyRes.status}). Configure provider keys in deployment secrets or AI Provider Settings.`
    );
  }

  const proxyData = await proxyRes.json();
  const reply = proxyData.reply || proxyData.text || proxyData.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error('AI provider returned an empty response.');
  }
  return reply;
}

/**
 * Streaming chat completion routed through the 3-tier AI provider chain,
 * automatically falling back to the server endpoint if keys are server-only.
 */
export async function* streamChatCompletion(
  messages: Array<OpenRouterMessage | { role: string; content: any }>,
  model: string = 'openai/gpt-4o-mini',
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const normalizedMessages = messages.map((m) => ({
    role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
    content: m.content,
  }));

  const tier =
    model.toLowerCase().includes('pro') ||
    model.toLowerCase().includes('claude') ||
    model === 'openai/gpt-4o'
      ? 'pro'
      : 'fast';

  const hasClientKey = getProviderChain().some((p) => Boolean(p.apiKey && p.apiKey.trim()));
  if (hasClientKey) {
    for await (const part of streamWithFallback({
      messages: normalizedMessages,
      tier,
      signal,
    })) {
      if (part.chunk) {
        yield part.chunk;
      }
    }
    return;
  }

  // Server-side 3-tier fallback when API keys live only in server env vars
  const fullText = await chatCompletion(normalizedMessages, model, { signal });
  yield fullText;
}

/**
 * Image understanding via OpenRouter multi-modal vision
 */
export async function understandImageWithOpenRouter(
  prompt: string,
  base64OrUrl: string,
  mimeType: string = 'image/jpeg',
  model: string = 'openai/gpt-4o-mini'
): Promise<string> {
  const imageUrl = base64OrUrl.startsWith('data:') || base64OrUrl.startsWith('http')
    ? base64OrUrl
    : `data:${mimeType};base64,${base64OrUrl}`;

  const messages: OpenRouterMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt || 'Analyze this image in detail and describe what you see.' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];

  return await chatCompletion(messages, model);
}

/**
 * Animation code generation via OpenRouter
 */
export async function generateAnimationWithOpenRouter(
  prompt: string,
  model: string = 'openai/gpt-4o-mini'
): Promise<{ code: string; title: string }> {
  const systemPrompt = `You are an elite creative animator and generative code engineer.
Generate clean, standalone, responsive HTML5 code for an animation based on the user prompt.
Requirements:
1. Output MUST be a complete standalone HTML document inside a single \`\`\`html markdown block.
2. Include all necessary CSS inside <style> and JavaScript inside <script>.
3. Can use SVG, CSS animations, or HTML5 Canvas 2D.
4. Beautiful dark aesthetic (#090a0f background), glowing accents, smooth 60fps animations.
5. Interactive: respond to mouse move or click when appropriate.
6. Absolutely NO external CDNs or network script imports—must run safely in a sandboxed iframe.`;

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Create an animation of: ${prompt}` },
  ];

  const responseText = await chatCompletion(messages, model);

  let code = '';
  const match = responseText.match(/```html([\s\S]*?)```/i);
  if (match) {
    code = match[1].trim();
  } else {
    code = responseText.trim();
  }

  if (!code || !code.includes('<')) {
    code = `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin:0; background:#090a0f; overflow:hidden; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; color:#fff; }
  .orb { width:180px; height:180px; border-radius:50%; background:radial-gradient(circle at 30% 30%, #38bdf8, #818cf8, #c084fc); filter:drop-shadow(0 0 40px rgba(129,140,248,0.8)); animation:pulse 3s infinite ease-in-out; }
  @keyframes pulse { 0%,100% { transform:scale(1) rotate(0deg); } 50% { transform:scale(1.2) rotate(180deg); } }
  h3 { position:absolute; bottom:24px; font-size:14px; color:#94a3b8; }
</style>
</head>
<body>
  <div class="orb"></div>
  <h3>${prompt}</h3>
</body>
</html>`;
  }

  return { code, title: prompt.slice(0, 40) };
}

export const BLOCKED_PATTERNS = [
  'rahul gandhi',
  'modi',
  'narendra modi',
  'celebrity name',
  'donald trump',
  'trump',
  'joe biden',
  'biden',
  'vladimir putin',
  'putin',
  'kamala harris',
  'barack obama',
  'elon musk',
];

export function precheck_prompt(prompt: string): string | null {
  if (!prompt || typeof prompt !== 'string') {
    return 'Please describe the scene in more detail.';
  }
  const lowered = prompt.toLowerCase();
  if (BLOCKED_PATTERNS.some((name) => lowered.includes(name))) {
    return (
      "Videos of real public figures in violent, threatening or " +
      "humiliating scenarios can't be generated. Try a fictional character."
    );
  }
  if (prompt.trim().length < 10) {
    return 'Please describe the scene in more detail.';
  }
  return null;
}

export async function generateVideoWithVeo(
  prompt: string,
  outPath: string = 'output.mp4'
): Promise<{ status: 'ok' | 'rejected' | 'blocked' | 'error'; message: string; videoUrl?: string; file?: string }> {
  const error = precheck_prompt(prompt);
  if (error) {
    return { status: 'rejected', message: error };
  }

  try {
    const res = await fetch('/generate_video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, out_path: outPath }),
    });

    if (!res.ok) {
      // Server error — NOT a safety filter block
      let errMsg = `Video service error (${res.status})`;
      try {
        const errData = await res.json();
        errMsg = errData?.error || errData?.message || errMsg;
      } catch {}
      return { status: 'error', message: errMsg };
    }

    const data = await res.json();
    if (data.status === 'blocked' || data.status === 'rejected') {
      return { status: 'blocked', message: data.message || 'This prompt was blocked by the safety filter. Please try a different scene.' };
    }
    return { status: 'ok', message: data.message || 'Video ready.', videoUrl: data.videoUrl, file: data.file };
  } catch (err: any) {
    return { status: 'error', message: err?.message || 'Video generation service unavailable. Please try again.' };
  }
}
