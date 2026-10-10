/**
 * OpenRouter AI Client Helper
 * API Endpoint: https://openrouter.ai/api/v1/chat/completions
 * Safely proxied via server backend /api/openrouter or integrated in /api/chat.
 */

export interface OpenRouterChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterChatOptions {
  model?: string;
  messages: OpenRouterChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenRouterChatResponse {
  id?: string;
  choices?: Array<{
    message?: {
      role: string;
      content: string;
    };
    finish_reason?: string;
  }>;
  reply?: string;
  text?: string;
  error?: string;
}

export async function createOpenRouterChatCompletion(
  options: OpenRouterChatOptions
): Promise<OpenRouterChatResponse> {
  const res = await fetch('/api/openrouter/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'meta-llama/llama-3.1-8b-instruct',
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: options.stream,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `OpenRouter API error (${res.status})`);
  }

  return await res.json();
}
