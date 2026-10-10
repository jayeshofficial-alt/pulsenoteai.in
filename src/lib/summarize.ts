/**
 * PulseNote AI - Transparent Summarization Service
 * Powered by OpenRouter API (openai/gpt-4o-mini)
 */

import { chatCompletion } from '../services/openrouter';

export interface SummarizeOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function summarise(
  prompt: string,
  options?: SummarizeOptions
): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('Prompt cannot be empty.');
  }

  const messages = [
    {
      role: 'system',
      content: 'You are an executive summary specialist. Summarize the following clearly, highlighting key action items, decisions, and takeaways in bullet points.',
    },
    {
      role: 'user',
      content: trimmed,
    },
  ];

  return await chatCompletion(messages, options?.model || 'openai/gpt-4o-mini', {
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxOutputTokens ?? 2048,
  });
}

export const summarize = summarise;
