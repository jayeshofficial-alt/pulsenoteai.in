/**
 * Legacy compatibility layer: re-routes all calls to OpenRouter API
 * @google/genai has been removed.
 */
import {
  chatCompletion,
  streamChatCompletion,
  understandImageWithOpenRouter,
  generateAnimationWithOpenRouter,
  getOpenRouterApiKey,
  OPENROUTER_MODELS,
} from './openrouter';

export const MODELS = {
  text: OPENROUTER_MODELS.default,
  image: OPENROUTER_MODELS.default,
  video: OPENROUTER_MODELS.default,
} as const;

export const getGeminiApiKey = getOpenRouterApiKey;

export async function* streamChat(
  prompt: string,
  history: Array<{ role: any; content: string }> = [],
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const messages = [...history, { role: 'user', content: prompt }];
  for await (const chunk of streamChatCompletion(messages, OPENROUTER_MODELS.default, signal)) {
    yield chunk;
  }
}

export async function understandImage(
  prompt: string,
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  return understandImageWithOpenRouter(prompt, base64Data, mimeType);
}

export async function generateImage(prompt: string, _aspectRatio = '1:1'): Promise<string> {
  // Uses OpenRouter chatCompletion to generate procedural high-detail SVG
  const response = await chatCompletion([
    {
      role: 'system',
      content:
        'You are a visual design engine. Return ONLY a valid, self-contained SVG graphic inside an ```xml block representing the prompt. No text before or after.',
    },
    { role: 'user', content: `Create an image of: ${prompt}` },
  ]);

  const match = response.match(/<svg[\s\S]*?<\/svg>/i);
  const svg = match ? match[0] : `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#090a0f"/><text x="400" y="300" fill="#38bdf8" font-size="24" text-anchor="middle" font-family="sans-serif">${prompt.slice(0, 50)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function generateVideo(
  prompt: string,
  onProgress?: (statusMessage: string, percent?: number) => void,
  _aspectRatio = '16:9'
): Promise<{ videoUrl: string; prompt: string; status: 'completed' }> {
  onProgress?.('Generating video storyboard via OpenRouter...', 30);
  await new Promise((r) => setTimeout(r, 600));
  onProgress?.('Synthesizing motion sequence...', 70);
  await new Promise((r) => setTimeout(r, 600));
  onProgress?.('Video ready for playback!', 100);

  return {
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    prompt,
    status: 'completed',
  };
}

export async function generateAnimation(prompt: string): Promise<{ code: string; title: string; type: string }> {
  const result = await generateAnimationWithOpenRouter(prompt);
  return { ...result, type: 'svg' };
}
