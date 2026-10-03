/**
 * CodeCraft API Client Helper
 * Base URL: https://codecraftapi.com/v1
 * All requests are safely proxied via /api/codecraft to prevent secret exposure.
 */

export interface CodeCraftStatus {
  status: string;
  baseUrl: string;
  isKeyConfigured: boolean;
}

export interface CodeCraftChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CodeCraftChatOptions {
  model?: string; // e.g. 'claude-opus-5.5'
  messages: CodeCraftChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface CodeCraftChatResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index?: number;
    message?: {
      role: string;
      content: string;
    };
    finish_reason?: string;
  }>;
  text?: string;
  reply?: string;
  error?: string;
}

export async function checkCodeCraftStatus(): Promise<CodeCraftStatus> {
  try {
    const res = await fetch('/api/codecraft/status');
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch (err: any) {
    return {
      status: 'offline',
      baseUrl: 'https://codecraftapi.com/v1',
      isKeyConfigured: false,
    };
  }
}

export async function callCodeCraftApi<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const res = await fetch(`/api/codecraft/${cleanEndpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || errorData.details || `CodeCraft API error (${res.status})`);
  }

  return await res.json();
}

/**
 * Execute chat completion with CodeCraft API (e.g. claude-opus-5.5)
 */
export async function createCodeCraftChatCompletion(
  options: CodeCraftChatOptions
): Promise<CodeCraftChatResponse> {
  return await callCodeCraftApi<CodeCraftChatResponse>('chat/completions', {
    method: 'POST',
    body: {
      model: options.model || 'claude-opus-5.5',
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: options.stream,
    },
  });
}
