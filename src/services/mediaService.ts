/**
 * Media Service for Imagen 4.0 and Veo 3.0
 * 
 * Strict specifications:
 * - Imagen: "imagen-4.0-generate-001" via ai.models.generateImages. User prompt sent EXACTLY as typed.
 *   Returns base64 bytes rendered as <img src="data:image/png;base64,...">.
 * - Veo: "veo-3.0-fast-generate-001" via ai.models.generateVideos. Polled every 10 seconds (max 6 minutes).
 *   Server downloads the video using API key, serves as blob/object URL to browser for <video controls>.
 * - API key remains on the server only.
 * - Deducts credits only on success (1 credit for image, 10 credits for video).
 * - Enforces feature switches: returns HTTP 403 "This feature is turned off" when disabled.
 */

import { auth } from '../lib/firebase';

export interface GeneratedImageResult {
  imageUrl: string; // "data:image/png;base64,..."
  imageBase64: string;
  prompt: string;
  model: string;
  mimeType: string;
}

export interface GeneratedVideoResult {
  blobUrl: string; // Object URL created via URL.createObjectURL(blob)
  blob: Blob;
  prompt: string;
  model: string;
  operationName: string;
  jobId?: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch (e) {
    console.warn('[MediaService] Token retrieval notice:', e);
  }
  return {};
}

/**
 * Generate an image using Google Imagen 4.0 (imagen-4.0-generate-001).
 * Reads the prompt directly from React state and blocks if empty.
 * Never prepends system instructions or documentation text.
 * Deducts 1 credit only on success.
 */
export async function generateImageWithImagen(
  prompt: string,
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '1:1'
): Promise<GeneratedImageResult> {
  const cleanPrompt = prompt ? prompt.trim() : '';
  if (!cleanPrompt) {
    throw new Error('Please enter a prompt for image generation.');
  }

  console.log('[MediaService] Submitting prompt to Imagen 4.0:', cleanPrompt);

  const authHeaders = await getAuthHeader();
  const response = await fetch('/api/gemini/image/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({
      prompt: cleanPrompt,
      aspectRatio,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 403) {
    throw new Error(data?.error || 'This feature is turned off');
  }

  if (response.status === 402) {
    throw new Error(data?.error || 'Insufficient credits. Image generation requires 1 credit.');
  }

  if (!response.ok || !data.success || !data.imageBase64) {
    const errorMsg = data?.error || 'Image generation failed or was blocked by safety filters.';
    console.error('[MediaService] Imagen error:', errorMsg);
    throw new Error(errorMsg);
  }

  const base64Data = data.imageBase64;
  const mimeType = data.mimeType || 'image/png';
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return {
    imageUrl: dataUrl,
    imageBase64: base64Data,
    prompt: cleanPrompt,
    model: data.modelUsed || 'imagen-4.0-generate-001',
    mimeType,
  };
}

/**
 * Generate a video using Google Veo (veo-3.0-fast-generate-001).
 * Starts long-running operation, polls every 10 seconds until operation.done is true (max 6 minutes),
 * downloads video bytes on server and serves as blob/object URL for <video controls>.
 * Shows clear error if operation fails or returns no video.
 * Deducts 10 credits only on success.
 */
export async function generateVideoWithVeo(
  prompt: string,
  onProgress?: (statusMessage: string, progressPercent: number) => void,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<GeneratedVideoResult> {
  const cleanPrompt = prompt ? prompt.trim() : '';
  if (!cleanPrompt) {
    throw new Error('Please enter a prompt for video generation.');
  }

  console.log('[MediaService] Submitting prompt to Veo 3.0:', cleanPrompt);
  onProgress?.('Initializing Veo video generation operation...', 5);

  const authHeaders = await getAuthHeader();

  // 1. Kick off video generation on server
  const startRes = await fetch('/api/gemini/video/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({
      prompt: cleanPrompt,
      aspectRatio,
    }),
  });

  const startData = await startRes.json().catch(() => ({}));

  if (startRes.status === 403) {
    throw new Error(startData?.error || 'This feature is turned off');
  }

  if (startRes.status === 402) {
    throw new Error(startData?.error || 'Insufficient credits. Video generation requires 10 credits.');
  }

  if (!startRes.ok || !startData.success || (!startData.operationName && !startData.jobId)) {
    const errorMsg = startData?.error || 'Failed to initiate video generation with Veo 3.0.';
    console.error('[MediaService] Veo start error:', errorMsg);
    throw new Error(errorMsg);
  }

  const operationName = startData.operationName;
  const jobId = startData.jobId;
  console.log('[MediaService] Veo operation started:', operationName, 'Job ID:', jobId);

  // 2. Poll every 10 seconds for completion (max 6 minutes = 360 seconds)
  const POLL_INTERVAL_MS = 10000;
  const MAX_POLL_TIME_MS = 6 * 60 * 1000;
  const startTime = Date.now();
  let pollCount = 0;

  while (Date.now() - startTime < MAX_POLL_TIME_MS) {
    pollCount++;
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const progressEstimate = Math.min(92, 10 + Math.round((elapsedSeconds / 360) * 80));

    onProgress?.(
      `Generating video, about 1–3 minutes (elapsed ${elapsedSeconds}s, polling status every 10s)...`,
      progressEstimate
    );

    // Wait 10 seconds before polling
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const pollUrl = jobId
      ? `/api/videoJobs/${encodeURIComponent(jobId)}`
      : `/api/gemini/video/status?operationName=${encodeURIComponent(operationName)}`;

    const statusRes = await fetch(pollUrl);
    const statusData = await statusRes.json().catch(() => ({}));

    console.log(`[MediaService] Poll #${pollCount} response:`, statusData);

    if (statusData.error) {
      console.error('[MediaService] Operation returned error:', statusData.error);
      throw new Error(statusData.error);
    }

    if (statusData.done || statusData.status === 'completed') {
      if (!statusData.hasVideo && !statusData.videoUrl) {
        throw new Error(statusData.error || 'Video generation completed but no video file was produced.');
      }

      onProgress?.('Video generation complete! Downloading video file from server...', 95);
      break;
    }
  }

  // 3. Download finished video from server download proxy
  const downloadUrl = jobId
    ? `/api/gemini/video/download?jobId=${encodeURIComponent(jobId)}`
    : `/api/gemini/video/download?operationName=${encodeURIComponent(operationName)}`;

  console.log('[MediaService] Fetching video blob from server endpoint:', downloadUrl);

  const downloadRes = await fetch(downloadUrl);
  if (!downloadRes.ok) {
    const errData = await downloadRes.json().catch(() => ({}));
    const downloadError = errData?.error || `Failed to download video file (${downloadRes.status} ${downloadRes.statusText})`;
    console.error('[MediaService] Download error:', downloadError);
    throw new Error(downloadError);
  }

  const videoBlob = await downloadRes.blob();
  if (!videoBlob || videoBlob.size === 0) {
    throw new Error('Downloaded video file is empty.');
  }

  const objectUrl = URL.createObjectURL(videoBlob);
  console.log('[MediaService] Video ready! Created Blob URL:', objectUrl, 'Size:', videoBlob.size);
  onProgress?.('Video ready for playback!', 100);

  return {
    blobUrl: objectUrl,
    blob: videoBlob,
    prompt: cleanPrompt,
    model: 'veo-3.0-fast-generate-001',
    operationName,
    jobId,
  };
}
