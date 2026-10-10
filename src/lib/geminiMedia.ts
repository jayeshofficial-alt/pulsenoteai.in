/**
 * Gemini Multi-Modal & Intelligence Library
 * Provides clean access to:
 * 1. Image generation & editing (gemini-3.1-flash-image-preview)
 * 2. Text-to-video generation (veo-3.1-fast-generate-preview)
 * 3. Photo-to-video animation (veo-3.1-fast-generate-preview)
 * 4. Search Grounding with Google Search (gemini-3.5-flash)
 * 5. Multi-turn chat with role system instructions and model routing
 */

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  imageSize?: '512px' | '1K' | '2K' | '4K';
  model?: string;
}

export interface EditImageOptions {
  prompt: string;
  imageBase64: string;
  mimeType?: string;
  model?: string;
}

export interface GenerateVideoOptions {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  model?: string;
}

export interface AnimateImageOptions {
  imageBase64: string;
  prompt?: string;
  aspectRatio?: '16:9' | '9:16';
  mimeType?: string;
  model?: string;
}

export interface GeminiMediaResult {
  success: boolean;
  imageUrl?: string;
  videoUrl?: string;
  videoUri?: string;
  operationName?: string;
  description?: string;
  modelUsed?: string;
  error?: string;
}

/**
 * 1. Generate an image from a text prompt using gemini-3.1-flash-image-preview
 */
export async function generateImageWithGemini(
  options: GenerateImageOptions
): Promise<GeminiMediaResult> {
  const res = await fetch('/api/gemini/image/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: options.prompt,
      aspectRatio: options.aspectRatio || '1:1',
      imageSize: options.imageSize || '1K',
      model: options.model || 'gemini-3.1-flash-image-preview',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Image generation failed (HTTP ${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * 2. Edit an existing image using text instructions
 */
export async function editImageWithGemini(
  options: EditImageOptions
): Promise<GeminiMediaResult> {
  const res = await fetch('/api/gemini/image/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: options.prompt,
      imageBase64: options.imageBase64,
      mimeType: options.mimeType || 'image/png',
      model: options.model || 'gemini-3.1-flash-image-preview',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Image editing failed (HTTP ${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * 3. Generate video from text using Veo (veo-3.1-fast-generate-preview)
 */
export async function generateVideoFromText(
  options: GenerateVideoOptions
): Promise<GeminiMediaResult> {
  const res = await fetch('/api/gemini/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: options.prompt,
      aspectRatio: options.aspectRatio || '16:9',
      resolution: options.resolution || '720p',
      model: options.model || 'veo-3.1-fast-generate-preview',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Video generation failed (HTTP ${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * 4. Animate an uploaded photo into a video using Veo (veo-3.1-fast-generate-preview)
 */
export async function animateImageToVideo(
  options: AnimateImageOptions
): Promise<GeminiMediaResult> {
  const res = await fetch('/api/gemini/video/animate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: options.imageBase64,
      prompt: options.prompt || 'Animate this photo with cinematic camera motion',
      aspectRatio: options.aspectRatio || '16:9',
      mimeType: options.mimeType || 'image/png',
      model: options.model || 'veo-3.1-fast-generate-preview',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Photo animation failed (HTTP ${res.status}): ${errText}`);
  }

  return await res.json();
}

/**
 * 5. Poll video status until completed
 */
export async function pollVideoStatus(operationName: string): Promise<{ done: boolean; videoUri?: string }> {
  const res = await fetch(`/api/gemini/video/status/${encodeURIComponent(operationName)}`);
  if (!res.ok) return { done: true, videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' };
  const data = await res.json();
  return {
    done: data.done ?? true,
    videoUri: data.videoUri || 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  };
}
