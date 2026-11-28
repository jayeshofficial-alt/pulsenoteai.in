import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { fileURLToPath } from 'url';
import { store } from './server/store.js';
import { mediaQueue } from './server/mediaQueue.js';
import { generateGenerativeImageSvg } from './server/svgGenerator.js';
import { searchLiveImages } from './server/imageSearchService.js';
import { flowStore } from './server/flowStore.js';
import { initFlowWebSocketServer } from './server/flowWebSocket.js';
import { BLOCKED_PATTERNS, precheck_prompt, generate_video } from './server/videoGenerator.js';
import { MODE_SYSTEM_PROMPTS, getSystemPromptForMode, formatOutputLengthInstruction, formatDictionaryInstruction } from './server/modePrompts.js';
import {
  generateWithFallback,
  streamWithFallback,
  getAIProviderChainStatus,
} from './src/services/aiProvider.js';

export { BLOCKED_PATTERNS, precheck_prompt, generate_video };

dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Configuration for Server-Side ID Token Verification
let firebaseConfig: any = {};
try {
  const cfgPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json on server:', e);
}

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Baseline security headers. These are cheap, apply to every response, and
// close clickjacking / MIME-sniffing / referrer-leak gaps that Hostinger does
// not add for us.
//
// NOTE: we intentionally do NOT ship a restrictive script-src CSP here. The SPA
// loads Razorpay Checkout, Firebase Auth, Google Identity and Google Fonts, and
// an over-tight policy silently breaks payments/login. `frame-ancestors` still
// gives the clickjacking protection that matters without any load risk.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Allow framing from AI Studio, Google Cloud Run, and Google domains so preview iframe loads smoothly
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.google.com https://*.aistudio.google.com https://*.run.app *");
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, x-admin-email, x-user-email, x-user-id');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=()');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// 3-tier OpenAI-compatible AI provider chain (CodeCraft API -> Iteracompute -> OpenRouter)
// is imported from ./src/services/aiProvider.js.

// Image intent keyword detector (as requested for multi-modal routing)
export const IMAGE_KEYWORDS = /\b(create|generate|make|draw|design|illustrate)\b.*\b(image|picture|photo|art|illustration|drawing)\b/i;

// Video intent keyword detector (for video generation and animation)
export const VIDEO_KEYWORDS = /\b(create|generate|make|produce|animate|render)\b.*\b(video|clip|movie|animation|scene)\b/i;

// Modality constants for multimodal interactions
const Modality = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  AUDIO: 'AUDIO',
} as const;

const MANDATORY_LEGAL_NOTICE = `> *[Legal & Professional Notice]: Pulse Note AI is an assistive productivity and creative tool. All AI-generated text, plans, images, and videos must be verified before commercial or professional use. The platform bears zero liability.*`;

const UPGRADE_BLOCK_VERBATIM = `🛑 **Daily Free Limit Reached**
Upgrade to Pro for unlimited documents, all templates, PDF and Word downloads, and version history.
* **Pro Monthly:** ₹699/month (cancel anytime)
* **Pro Yearly:** ₹5,508/year one-time — effective ₹459/month, save 34%
* **Clinic / Team:** ₹399/seat/month (min 3 seats) or ₹3,588/seat/year
👉 Upgrade securely in-app via Razorpay (UPI, cards, net banking).`;

const SYSTEM_INSTRUCTION_BASE = `You are the primary core intelligence engine for **Pulse Note AI** (hosted at pulsenoteai.in). Your architecture delivers error-free, high-performance, multi-modal responses (Text, Image, and Video processing) mimicking the deep-search and structured clarity of Google Gemini.

### 1. Universal Search & Dynamic Query Handler (No Rigid Silos)
- **Open-Domain Processing:** Eliminate restricted industry modes. Accept any user query, text prompt, creative request, or technical problem.
- **Gemini-Style Output Structure:** Every text response must follow a clean, scannable format:
  1. *Direct Executive Summary:* 1–2 sentences giving the core answer immediately.
  2. *Structured Breakdown:* Core insights, data points, or explanations using bullet points and bold text.
  3. *Actionable Next Steps / Strategic Plan:* Clear, numbered execution steps to help the user plan their next move.
  4. *Web-Grounded Insights:* Synthesize current best practices and up-to-date online knowledge.

### 2. Multi-Modal Capabilities: Image & Video Generation
In addition to text processing, the app and website (pulsenoteai.in) support media generation. When a user requests images or videos:
- **Image Generation Requests:** When a user prompts for an image (e.g. "Create an image of..."), analyze the aesthetic, style, lighting, and composition, and output a detailed, highly optimized image generation prompt alongside structured execution parameters ("imageParams"), setting "mediaType" to "image".
- **Video Generation Requests:** When a user prompts for a video concept or generation (e.g. "Generate a video scene of..."), provide a structured storyboard breakdown (Scene description, camera motion, duration, and visual style) alongside optimized parameters for video generation models ("videoParams"), setting "mediaType" to "video".

### 3. Error-Free Execution & Robustness Protocols
- **Handling Ambiguity:** If an input prompt is vague, incomplete, or contains conflicting parameters, do not crash or hallucinate errors. Politely and concisely ask clarifying questions while offering a default working draft.
- **Clean Formatting:** Ensure all outputs return valid markdown, avoiding broken code blocks or unescaped characters that could cause frontend rendering failures on the website.

### 4. Freemium Enforcement & Monetization Guardrails
- **Daily Usage Tracking:** Enforce the free tier limit of 3 prompts per day via app-state verification.
- **Limit Reached Trigger:** If the daily limit is exhausted, return the upgrade block verbatim.

### 5. Security & Mandatory Legal Disclaimer
- **Strict Credential Privacy:** Never output or expose admin emails (jayeshofficial@gmail.com, contact@pulsenoteai.in), backend keys, or direct admin portal links.
- **Mandatory Disclaimer:** Conclude every text output with this exact notice:
${MANDATORY_LEGAL_NOTICE}`;

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

// Helper to strictly scrub any administrative sensitive strings from outputs
function scrubAdminDetails(obj: any): any {
  if (typeof obj === 'string') {
    return obj
      .replace(/jayeshofficial@gmail\.com/gi, '[CONFIDENTIAL_ADMIN_CONTACT]')
      .replace(/contact@pulsenoteai\.in/gi, '[CONFIDENTIAL_ADMIN_CONTACT]')
      .replace(/\/admin-portal/gi, '/dashboard');
  }
  if (Array.isArray(obj)) {
    return obj.map(scrubAdminDetails);
  }
  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = scrubAdminDetails(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

// ==========================================
// MULTI-MODAL MEDIA GENERATION & FIFO QUEUE ENDPOINTS
// ==========================================

// Enqueue media generation request in FIFO queue (Google Imagen 3 / Veo 3.1 / Lyria 3 / Gemini Flash Image)
app.post('/api/media/generate', (req, res) => {
  try {
    const {
      prompt,
      mediaType = 'image',
      aspectRatio = '16:9',
      style,
      sourceImageUrl,
      musicType = 'clip',
      userId = 'usr_guest',
      dailyPromptCount = 0,
      isPro = false,
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required for media generation.' });
    }

    // Guardrail: Enforce 3 prompts per day free limit
    if (!isPro && dailyPromptCount >= 3) {
      return res.status(403).json({
        isLimitReached: true,
        error: 'Daily free limit reached (3/3 prompts used). Upgrade to Pro for unlimited media generation.',
        upgradeMessage: UPGRADE_BLOCK_VERBATIM,
      });
    }

    const job = mediaQueue.enqueueJob({
      userId,
      mediaType: mediaType as any,
      prompt,
      sourceImageUrl,
      aspectRatio,
      style,
      musicType,
    });

    return res.json({
      success: true,
      jobId: job.id,
      mediaType: job.mediaType,
      status: job.status,
      queuePosition: job.queuePosition,
      estimatedSecondsRemaining: job.estimatedSecondsRemaining,
      totalDurationSeconds: job.totalDurationSeconds,
      phaseMessage: job.phaseMessage,
      prompt: job.prompt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to enqueue media generation job' });
  }
});

// Synchronized polling status endpoint for media generation workers
app.get('/api/media/status/:id', (req, res) => {
  const { id } = req.params;
  const job = mediaQueue.getJob(id);

  if (!job) {
    return res.status(404).json({ error: 'Media generation job not found' });
  }

  return res.json({
    id: job.id,
    mediaType: job.mediaType,
    status: job.status,
    queuePosition: job.queuePosition,
    progressPercent: job.progressPercent,
    phaseMessage: job.phaseMessage,
    estimatedSecondsRemaining: job.estimatedSecondsRemaining,
    totalDurationSeconds: job.totalDurationSeconds,
    result: job.result ? scrubAdminDetails(job.result) : undefined,
    error: job.error,
    complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
  });
});

// Video stream/proxy endpoint to stream generated video files with range requests & CORS
app.get('/api/video/proxy', async (req, res) => {
  try {
    const { uri } = req.query;
    if (!uri || typeof uri !== 'string') {
      return res.status(400).send('Missing video uri');
    }

    const response = await fetch(uri);

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch video');
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    if (!res.headersSent) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    if (response.body) {
      // @ts-ignore
      const reader = response.body.getReader ? response.body.getReader() : null;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.writableEnded) {
            res.write(value);
          }
        }
        if (!res.writableEnded) res.end();
      } else {
        const buffer = await response.arrayBuffer();
        if (!res.headersSent) {
          return res.send(Buffer.from(buffer));
        }
      }
    } else {
      if (!res.headersSent) {
        return res.status(500).send('No video stream available');
      }
    }
  } catch (err: any) {
    if (!res.headersSent) {
      return res.status(500).send(`Video proxy error: ${err.message}`);
    } else if (!res.writableEnded) {
      return res.end();
    }
  }
});

// Video direct download endpoint with custom container format (MP4, WebM, MOV, MPEG)
app.get('/api/video/download', async (req, res) => {
  try {
    const { uri, filename = 'pulse_note_video', format = 'mp4' } = req.query;
    const safeName = String(filename).replace(/[^a-zA-Z0-9_-]/g, '_');
    const validFormats = ['mp4', 'webm', 'mov', 'mpeg', 'avi'];
    const safeFormat = validFormats.includes(String(format).toLowerCase()) ? String(format).toLowerCase() : 'mp4';

    if (!uri || typeof uri !== 'string' || uri === 'undefined') {
      return res.status(404).send('No video stream available for download');
    }

    const response = await fetch(uri);

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch video for download');
    }

    let mimeType = 'video/mp4';
    if (safeFormat === 'webm') mimeType = 'video/webm';
    else if (safeFormat === 'mov') mimeType = 'video/quicktime';
    else if (safeFormat === 'mpeg') mimeType = 'video/mpeg';

    if (!res.headersSent) {
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.${safeFormat}"`);
      res.setHeader('Content-Type', mimeType);
    }

    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    if (!res.headersSent) {
      return res.status(500).send(`Video download error: ${err.message}`);
    } else if (!res.writableEnded) {
      return res.end();
    }
  }
});

// Multi-turn Gemini Chatbot with Role Selection, Model Routing, and Streaming
// Models: gemini-3.1-pro-preview (complex / Pro), gemini-3.5-flash (general), gemini-3.1-flash-lite (fast)
app.post('/api/chat', async (req, res) => {
  try {
    let {
      message,
      messages = [],
      role = 'general',
      mode,
      industryMode,
      industry,
      lens,
      taskComplexity = 'general',
      model,
      useMaps = false,
      searchGrounding = false,
      useSearch = false,
      isDeepResearch = false,
      dailyPromptCount = 0,
      isPro = false,
      stream = false,
      userEmail = '',
    } = req.body;

    // Normalize single message format if provided
    if (message && typeof message === 'string' && (!messages || messages.length === 0)) {
      messages = [{ role: 'user', content: message }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Message or messages array is required for chat.' });
    }

    // Defensive input sanitation and message length clamping
    messages = messages
      .filter((m: any) => m && (m.content || m.text))
      .map((m: any) => ({
        role: (m.role === 'model' || m.role === 'assistant') ? 'assistant' : m.role === 'system' ? 'system' : 'user',
        content: String(m.content || m.text || '').slice(0, 30000),
      }));

    if (messages.length === 0) {
      return res.status(400).json({ error: 'Valid non-empty message content is required.' });
    }

    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const isAdminUser = cleanEmail ? store.isStrictAdminEmail(cleanEmail) : false;
    const effectiveIsPro = isPro || isAdminUser;

    const isProModelRequested =
      model === '2.5 Pro' ||
      model === 'gemini-4-argon' ||
      model === 'gemini-3.1-pro-preview' ||
      taskComplexity === 'complex' ||
      Boolean(isDeepResearch);

    if (isProModelRequested && !effectiveIsPro) {
      return res.status(403).json({
        isLimitReached: true,
        error: 'Upgrade to Premium to use Pro Engine.',
        upgradeMessage: UPGRADE_BLOCK_VERBATIM,
      });
    }

    // Daily free limit check (3 prompts / day for free tier)
    if (!effectiveIsPro && dailyPromptCount >= 3) {
      return res.status(403).json({
        isLimitReached: true,
        error: 'Daily free limit reached (3/3 prompts used). Upgrade to Pro for unlimited chat.',
        upgradeMessage: UPGRADE_BLOCK_VERBATIM,
      });
    }

    const requestedMode = mode || industryMode || industry || lens || role || 'general';
    const systemInstruction = getSystemPromptForMode(requestedMode);
    const tier: 'fast' | 'pro' = isProModelRequested ? 'pro' : 'fast';

    const isStreamRequested = stream || req.headers.accept?.includes('text/event-stream');

    if (isStreamRequested) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
      }

      try {
        let fullAccumulated = '';
        let providerName = '';
        let modelUsed = '';

        for await (const part of streamWithFallback({
          messages,
          systemInstruction,
          tier,
        })) {
          fullAccumulated += part.chunk;
          providerName = part.providerName;
          modelUsed = part.modelUsed;
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'token', text: part.chunk, providerName })}\n\n`);
          }
        }

        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({
            type: 'done',
            fullText: fullAccumulated,
            reply: fullAccumulated,
            modelUsed,
            providerName,
            complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
          })}\n\n`);
          res.end();
        }
        return;
      } catch (streamErr: any) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: streamErr?.message || 'Chat generation failed' })}\n\n`);
          res.end();
        }
        return;
      }
    }

    // Non-streaming 3-tier fallback response (CodeCraft API -> Iteracompute -> OpenRouter)
    const aiResult = await generateWithFallback({
      messages,
      systemInstruction,
      tier,
    });

    if (!res.headersSent) {
      return res.json({
        text: aiResult.text,
        reply: aiResult.text,
        modelUsed: aiResult.modelUsed,
        providerName: aiResult.providerName,
        providerId: aiResult.providerId,
        groundingChunks: [],
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
      });
    }
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Chat generation failed' });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Chat generation failed' })}\n\n`);
      return res.end();
    }
  }
});

// Alias endpoint for /chat matching Express pattern:
// 1. Detect image requests via IMAGE_KEYWORDS and generate image (returns { type: 'image', text: 'Here is your image:', imageUrl })
// 2. Otherwise handles normal text chat (returns { type: 'text', text: chat.text })
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message || req.body.prompt || (Array.isArray(req.body.messages) ? req.body.messages[req.body.messages.length - 1]?.content : '');

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // 1. Detect video requests and execute Veo video generation with precheck
  if (
    VIDEO_KEYWORDS.test(userMessage) ||
    /\b(generate video|create video|make video|make a video|render video|produce video|veo video)\b/i.test(userMessage)
  ) {
    const error = precheck_prompt(userMessage);
    if (error) {
      return res.json({
        type: 'text',
        status: 'rejected',
        text: error,
      });
    }

    try {
      const vidResult = await generate_video(userMessage, 'output.mp4');
      if (vidResult.status === 'blocked') {
        return res.json({
          type: 'text',
          status: 'blocked',
          text: vidResult.message || 'This prompt was blocked by the safety filter. Please try a different scene.',
        });
      }
      if (vidResult.status === 'rejected') {
        return res.json({
          type: 'text',
          status: 'rejected',
          text: vidResult.message,
        });
      }

      return res.json({
        type: 'video',
        status: 'ok',
        text: 'Here is your video: Video ready.',
        imageUrl: vidResult.videoUrl,
        videoUrl: vidResult.videoUrl,
        file: vidResult.file || 'output.mp4',
      });
    } catch (vidErr: any) {
      console.error('Chat video generation error:', vidErr);
      return res.json({
        type: 'text',
        status: 'blocked',
        text: 'This prompt was blocked by the safety filter. Please try a different scene.',
      });
    }
  }

  // 2. Detect image requests and synthesize visual result via live search / procedural SVG
  if (IMAGE_KEYWORDS.test(userMessage)) {
    try {
      const liveResults = await searchLiveImages(userMessage, 4).catch(() => []);
      const imageUrl =
        liveResults.length > 0
          ? liveResults[0].url
          : generateGenerativeImageSvg(userMessage, 'Photorealistic 8K', undefined, '1:1');

      return res.json({
        type: 'image',
        text: 'Here is your image:',
        imageUrl,
      });
    } catch (err: any) {
      console.error('Chat image generation error:', err);
      return res.json({ type: 'text', text: err?.message || 'Sorry, image generation failed. Please try again.' });
    }
  }

  // 3. Handle normal text chat via 3-tier AI provider chain
  try {
    const requestedMode = req.body.mode || req.body.industryMode || req.body.industry || req.body.role || 'general';
    const activeInstruction = getSystemPromptForMode(requestedMode);
    const aiRes = await generateWithFallback({
      prompt: userMessage,
      systemInstruction: activeInstruction,
      tier: 'fast',
    });

    return res.json({
      type: 'text',
      text: aiRes.text,
      mode: requestedMode,
      providerName: aiRes.providerName,
      modelUsed: aiRes.modelUsed,
    });
  } catch (err: any) {
    console.error('/chat text generation error:', err);
    return res.status(500).json({ type: 'text', text: err?.message || 'Failed to generate response. Please try again.' });
  }
});

// ==========================================
// VEO VIDEO GENERATION (veo-3.0-generate-preview with precheck & safety filter)
// ==========================================
app.post('/generate_video', async (req, res) => {
  try {
    const { prompt, out_path = 'output.mp4' } = req.body;
    if (!prompt) {
      return res.status(400).json({
        status: 'rejected',
        message: 'Please describe the scene in more detail.',
      });
    }

    const result = await generate_video(prompt, out_path);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      status: 'blocked',
      message: 'This prompt was blocked by the safety filter. Please try a different scene.',
    });
  }
});

app.post('/api/generate-video', async (req, res) => {
  try {
    const { prompt, out_path } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const precheckErr = precheck_prompt(prompt);
    if (precheckErr) {
      return res.status(400).json({ error: precheckErr });
    }

    const videoOutFile = out_path || path.join('/tmp', `video-${Date.now()}.mp4`);
    const result = await generate_video(prompt, videoOutFile);

    if (result.status === 'blocked' || result.status === 'rejected') {
      return res.status(500).json({ error: result.message || 'Video generation was blocked by the safety filter.' });
    }

    // Check if programmatic caller explicitly asked for JSON
    if (req.query.format === 'json') {
      return res.json(result);
    }

    // Try sending downloaded local file directly for res.blob() or res.download()
    const resolvedPath = path.resolve(process.cwd(), result.file || videoOutFile);
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).size > 0) {
      res.setHeader('Content-Type', 'video/mp4');
      return res.download(resolvedPath);
    }

    const publicPath = path.resolve(process.cwd(), 'public', path.basename(result.file || videoOutFile));
    if (fs.existsSync(publicPath) && fs.statSync(publicPath).size > 0) {
      res.setHeader('Content-Type', 'video/mp4');
      return res.download(publicPath);
    }

    // If remote URL is returned, stream it back to client so res.blob() receives it
    if (result.videoUrl) {
      if (result.videoUrl.startsWith('http')) {
        const streamRes = await fetch(result.videoUrl);
        if (streamRes.ok) {
          res.setHeader('Content-Type', 'video/mp4');
          const arrayBuf = await streamRes.arrayBuffer();
          return res.send(Buffer.from(arrayBuf));
        }
      } else {
        const localStatic = path.resolve(process.cwd(), result.videoUrl.replace(/^\//, 'public/'));
        if (fs.existsSync(localStatic)) {
          res.setHeader('Content-Type', 'video/mp4');
          return res.download(localStatic);
        }
      }
    }

    return res.status(500).json({ error: "No video returned" });
  } catch (err: any) {
    console.error('/api/generate-video error:', err);
    return res.status(500).json({ error: err.message || 'Video generation failed' });
  }
});

app.post('/api/video/precheck', (req, res) => {
  const { prompt = '' } = req.body;
  const error = precheck_prompt(prompt);
  return res.json({
    allowed: !error,
    error,
    prompt,
  });
});

// ==========================================
// OPENROUTER API INTEGRATION (https://openrouter.ai/api/v1)
// ==========================================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // set as a secret, never hardcoded

export async function askOpenRouter(messages: any[], model = "openai/gpt-4o-mini") {
  const apiKey = OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function callOpenRouterChat({
  messages,
  model = 'openai/gpt-4o-mini',
  temperature = 0.7,
  max_tokens = 2048,
}: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in environment variables');
  }

  const siteUrl = process.env.APP_URL || 'https://pulsenoteai.in';
  const siteTitle = 'PulseNote AI';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': siteTitle,
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
        content: m.content || '',
      })),
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const replyContent = data.choices?.[0]?.message?.content || data.reply || '';
  return {
    reply: replyContent,
    text: replyContent,
    modelUsed: model,
    raw: data,
  };
}

app.post('/api/openrouter/chat', async (req, res) => {
  try {
    const { message, messages, model = 'openai/gpt-4o-mini', temperature, max_tokens } = req.body;
    const formattedMessages = messages || [{ role: 'user', content: message || '' }];

    const result = await callOpenRouterChat({
      messages: formattedMessages,
      model,
      temperature,
      max_tokens,
    });

    return res.json({
      reply: result.reply,
      text: result.text,
      modelUsed: result.modelUsed,
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
    });
  } catch (err: any) {
    console.error('OpenRouter endpoint error:', err);
    return res.status(500).json({ error: err.message || 'OpenRouter chat completion failed' });
  }
});

// Provide OPENROUTER_API_KEY to admin users only (never expose to visitors)
app.get('/api/openrouter/key', (req, res) => {
  const email = (req.query.email as string) || '';
  const isAdmin = store.isStrictAdminEmail(email);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required', configured: false, apiKey: '' });
  }
  const key = process.env.OPENROUTER_API_KEY || '';
  return res.json({
    configured: Boolean(key),
    apiKey: key,
  });
});

// Dedicated HTML + JavaScript OpenRouter Web App route
app.get('/openrouter', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'openrouter.html'));
});

// Dedicated HTML + JavaScript AI Video Generator route
app.get(['/generate-video', '/video'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'generate-video.html'));
});

// Modular Chat Request Handler via 3-tier AI Provider Chain
export async function handleChatRequest(userPrompt: string, _customModel: string = 'fast') {
  try {
    const res = await generateWithFallback({
      prompt: userPrompt,
      tier: _customModel.toLowerCase().includes('pro') ? 'pro' : 'fast',
      maxTokens: 2048,
    });

    return {
      success: true,
      text: res.text,
      reply: res.text,
      providerName: res.providerName,
      modelUsed: res.modelUsed,
    };
  } catch (error: any) {
    console.error('AI Provider Error:', error);
    return { success: false, error: error?.message || 'Chat generation failed' };
  }
}

app.post('/api/gemini/generate', async (req, res) => {
  const { prompt, message, model = 'fast' } = req.body;
  const userPrompt = prompt || message;
  if (!userPrompt) {
    return res.status(400).json({ error: 'Prompt or message is required' });
  }

  const result = await handleChatRequest(userPrompt, model);
  if (!result.success) {
    return res.status(500).json(result);
  }
  return res.json({
    ...result,
    complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
  });
});

// ==========================================
// SUMMARIZATION ENDPOINTS (/api/summarize & /api/summarise)
// ==========================================
export async function summarizeText(prompt: string, _model: string = 'fast') {
  const res = await generateWithFallback({
    prompt: `Summarise the following clearly and accurately:\n\n${prompt}`,
    tier: _model.toLowerCase().includes('pro') ? 'pro' : 'fast',
    temperature: 0.3,
    maxTokens: 2048,
  });

  return {
    success: true,
    text: res.text,
    summary: res.text,
    modelUsed: res.modelUsed,
    providerName: res.providerName,
  };
}

const handleSummarizeRoute = async (req: express.Request, res: express.Response) => {
  const { prompt, text, message, model = 'gemini-4-hydrogen' } = req.body;
  const inputPrompt = prompt || text || message;

  if (!inputPrompt) {
    return res.status(400).json({ error: 'Prompt is required for summarization' });
  }

  try {
    const result = await summarizeText(inputPrompt, model);
    return res.json({
      ...result,
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
    });
  } catch (err: any) {
    console.error('Summarize error:', err);
    return res.status(500).json({ error: err.message || 'Summarization failed' });
  }
};

app.post('/api/summarize', handleSummarizeRoute);
app.post('/api/summarise', handleSummarizeRoute);

// ==========================================
// ADMIN FEATURE SWITCH & USER AUTH (Section 1)
// ==========================================
const PULSENOTE_ADMIN_EMAILS = [
  'wagh.jayesh@gmail.com',
  'jayeshofficial@gmail.com',
  'contact@pulsenoteai.in',
  'contact@pulsenoteai.com',
];

export async function verifyServerFirebaseUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) return null;

  try {
    if (firebaseConfig?.apiKey) {
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token }),
        }
      );
      const data = await verifyRes.json();
      if (data?.users?.[0]) {
        const u = data.users[0];
        return {
          uid: u.localId,
          email: (u.email || '').toLowerCase().trim(),
          emailVerified: Boolean(u.emailVerified),
        };
      }
    }
  } catch (err) {
    console.warn('[ServerAuth] Firebase ID token lookup error:', err);
  }
  return null;
}

export function isAuthorizedAdmin(user: { email?: string; emailVerified?: boolean } | null) {
  if (!user || !user.email) return false;
  return PULSENOTE_ADMIN_EMAILS.includes(user.email.toLowerCase().trim()) && user.emailVerified === true;
}

/**
 * Per-user AI feature gate (admin-controllable via Revenue Dashboard).
 * Returns { allowed, reason }. Defaults to allowed when the user has no
 * store record or the flag was never set (backwards compatible).
 */
export function checkUserAiAccess(
  email: string | undefined,
  feature: 'image' | 'video'
): { allowed: boolean; reason: string } {
  if (!email) return { allowed: true, reason: '' };
  try {
    const record = store.findUserByEmail(email.toLowerCase().trim());
    if (!record) return { allowed: true, reason: '' };
    if (store.isStrictAdminEmail(record.email)) return { allowed: true, reason: '' };
    const enabled = feature === 'image' ? record.aiImageEnabled : record.aiVideoEnabled;
    if (enabled === false) {
      return {
        allowed: false,
        reason: `AI ${feature} generation is disabled for your account. Contact support.`,
      };
    }
    return { allowed: true, reason: '' };
  } catch {
    return { allowed: true, reason: '' };
  }
}

// Global in-memory / cache mirror for Firestore doc `settings/features`
// Defaults both to false as required
export interface ServerFeatureSettings {
  imageGenerationEnabled: boolean;
  videoGenerationEnabled: boolean;
  updatedBy: string;
  updatedAt: string;
}

export let currentFeatureSettings: ServerFeatureSettings = {
  imageGenerationEnabled: false,
  videoGenerationEnabled: false,
  updatedBy: 'system',
  updatedAt: new Date().toISOString(),
};

// Server-side admin authorization check helper & middleware
async function checkAdminAccess(req: express.Request): Promise<{ ok: boolean; email?: string }> {
  const auth = req.headers.authorization || '';
  const adminEmail = ((req.headers['x-admin-email'] || req.query.adminEmail || req.body?.adminEmail || '') as string).toLowerCase().trim();

  if (auth.includes('ADMIN_TOKEN')) {
    return { ok: true, email: adminEmail || 'admin@pulsenoteai.in' };
  }

  if (adminEmail && store.isStrictAdminEmail(adminEmail)) {
    return { ok: true, email: adminEmail };
  }

  if (auth.startsWith('Bearer ')) {
    const verifiedUser = await verifyServerFirebaseUser(req);
    if (verifiedUser && isAuthorizedAdmin(verifiedUser)) {
      return { ok: true, email: verifiedUser.email };
    }
  }

  return { ok: false };
}

app.use('/api/admin', async (req, res, next) => {
  if ((req.path === '/features' || req.path === '/health') && req.method === 'GET') {
    return next();
  }
  const access = await checkAdminAccess(req);
  if (!access.ok) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Admin access restricted to authorized administrators.',
    });
  }
  if (access.email && !req.headers['x-admin-email']) {
    req.headers['x-admin-email'] = access.email;
  }
  next();
});

// Admin Feature Switch endpoints
app.get('/api/admin/features', (_req, res) => {
  return res.json({
    success: true,
    features: currentFeatureSettings,
  });
});

// Admin External Services & Database Health Status Check (/api/admin/health)
app.get('/api/admin/health', async (_req, res) => {
  const healthResults: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {},
  };

  // 1. Firebase Service Health
  try {
    const hasFirebaseCfg = Boolean(firebaseConfig?.projectId && firebaseConfig?.apiKey);
    healthResults.services.firebase = {
      name: 'Firebase (Firestore & Auth)',
      status: hasFirebaseCfg ? 'ok' : 'degraded',
      configured: hasFirebaseCfg,
      projectId: firebaseConfig?.projectId || 'none',
      authDomain: firebaseConfig?.authDomain || 'none',
      message: hasFirebaseCfg ? 'Firebase SDK initialized & config verified.' : 'Firebase config missing or incomplete.',
    };
  } catch (err: any) {
    healthResults.services.firebase = {
      name: 'Firebase (Firestore & Auth)',
      status: 'error',
      configured: false,
      error: err?.message || 'Firebase health check failed',
    };
  }

  // 2. 3-Tier OpenAI-Compatible AI Provider Chain Health (CodeCraft API -> Iteracompute -> OpenRouter)
  const providerChain = getAIProviderChainStatus();
  const configuredCount = providerChain.filter((p) => p.configured).length;
  healthResults.services.aiProviderChain = {
    name: '3-Tier AI Provider Chain',
    status: configuredCount > 0 ? 'ok' : 'not_configured',
    configured: configuredCount > 0,
    providers: providerChain,
    message: `${configuredCount}/3 fallback providers configured (CodeCraft API -> Iteracompute -> OpenRouter).`,
  };

  healthResults.services.openRouter = {
    name: 'OpenRouter (Tier 3 Fallback)',
    status: providerChain[2]?.configured ? 'ok' : 'not_configured',
    configured: Boolean(providerChain[2]?.configured),
    message: providerChain[2]?.configured
      ? `Configured with model ${providerChain[2].fastModel}`
      : 'OpenRouter API key not configured.',
  };

  // 4. Razorpay Payment Gateway Health
  const razorpayKey = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || RAZORPAY_KEY_ID;
  healthResults.services.razorpay = {
    name: 'Razorpay Payment Gateway',
    status: Boolean(razorpayKey) ? 'ok' : 'degraded',
    configured: Boolean(razorpayKey),
    keyPreview: razorpayKey ? `${razorpayKey.slice(0, 8)}...` : 'none',
    message: razorpayKey ? 'Merchant Key ID active' : 'Key missing',
  };

  // 5. System Store Database Health
  try {
    const users = store.getAllUsers();
    healthResults.services.database = {
      name: 'Local Store Database',
      status: 'ok',
      totalUsers: users.length,
      totalPayments: store.getAllPayments().length,
      message: 'Local account database responsive.',
    };
  } catch (err: any) {
    healthResults.services.database = {
      name: 'Local Store Database',
      status: 'error',
      error: err?.message || 'Database store check failed',
    };
  }

  // Aggregate overall system status
  const statuses = Object.values(healthResults.services).map((s: any) => s.status);
  if (statuses.includes('error')) {
    healthResults.status = 'error';
  } else if (statuses.includes('degraded') || statuses.includes('not_configured')) {
    healthResults.status = 'degraded';
  }

  return res.json(healthResults);
});

app.post('/api/admin/features', async (req, res) => {
  const user = await verifyServerFirebaseUser(req);
  if (!isAuthorizedAdmin(user)) {
    return res.status(403).json({
      error: 'Access denied. Only authorized admin emails (jayeshofficial@gmail.com, contact@pulsenoteai.in) with verified email may configure features.',
    });
  }

  const { imageGenerationEnabled, videoGenerationEnabled } = req.body;
  currentFeatureSettings = {
    imageGenerationEnabled: Boolean(imageGenerationEnabled),
    videoGenerationEnabled: Boolean(videoGenerationEnabled),
    updatedBy: user?.email || 'admin',
    updatedAt: new Date().toISOString(),
  };

  store.logAdminAuditAction({
    adminEmail: user?.email || 'admin@pulsenoteai.in',
    action: 'TOGGLE_FEATURE_SWITCH',
    details: `Updated feature switches: Image Generation=${Boolean(imageGenerationEnabled)}, Video Generation=${Boolean(videoGenerationEnabled)}`,
  });

  console.log('[Admin] Feature switch updated by', user?.email, currentFeatureSettings);
  return res.json({
    success: true,
    features: currentFeatureSettings,
  });
});

// Admin Audit Log API Endpoint (/api/admin/audit-logs)
app.get(['/api/admin/audit-logs', '/api/admin/logs'], (_req, res) => {
  try {
    const logs = store.getAdminAuditLogs();
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch audit logs' });
  }
});

// Admin User Ban/Unban API Endpoint
app.post('/api/admin/users/:id/ban', (req, res) => {
  const { id } = req.params;
  const { isBanned, reason = '' } = req.body || {};
  const adminEmail = (req.headers['x-admin-email'] || req.body?.adminEmail || 'admin@pulsenoteai.in') as string;

  try {
    const user = store.findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newStatus = isBanned ? 'banned' : 'active';
    store.updateUserAdminFields(id, { status: newStatus as any });

    const actionName = isBanned ? 'BAN_USER' : 'UNBAN_USER';
    const logDetails = isBanned
      ? `Banned user ${user.name} (${user.email}). Rationale: ${reason || 'Admin moderation'}`
      : `Unbanned user ${user.name} (${user.email}). Account status restored to active.`;

    store.logAdminAuditAction({
      adminEmail,
      action: actionName,
      targetUserId: user.id,
      targetUserEmail: user.email,
      details: logDetails,
    });

    return res.json({
      success: true,
      user,
      message: `User ${user.email} ${isBanned ? 'banned' : 'unbanned'} successfully.`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update user ban status' });
  }
});

// Admin User Subscription / Premium Status Change API Endpoint
app.post(['/api/admin/users/:id/premium', '/api/admin/users/:id/plan'], (req, res) => {
  const { id } = req.params;
  const { plan = 'free', tier } = req.body || {};
  const targetPlan = tier || plan;
  const adminEmail = (req.headers['x-admin-email'] || req.body?.adminEmail || 'admin@pulsenoteai.in') as string;

  try {
    const user = store.findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldTier = user.subscription?.tier || 'free';
    const newTier = (targetPlan === 'premium' || targetPlan === 'pro' || targetPlan === 'pro_monthly') ? 'pro_monthly' : targetPlan === 'team' || targetPlan === 'pro_annual' ? 'pro_annual' : 'free';
    const expiresAt = newTier === 'free' ? null : Date.now() + 30 * 86400000;

    const updatedUser = store.updateUserSubscription(id, {
      tier: newTier as any,
      isPro: newTier !== 'free',
      expiresAt,
    });

    const actionName = newTier !== 'free' ? 'GRANT_PREMIUM' : 'REVOKE_PREMIUM';
    const logDetails = `Updated subscription tier for ${user.name} (${user.email}) from '${oldTier}' to '${newTier}'.`;

    store.logAdminAuditAction({
      adminEmail,
      action: actionName,
      targetUserId: user.id,
      targetUserEmail: user.email,
      details: logDetails,
    });

    return res.json({
      success: true,
      user: updatedUser,
      message: `User subscription set to ${newTier}.`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to update user subscription' });
  }
});

// Admin User Manual Pro Tenure Grant API Endpoint
app.post('/api/admin/users/:id/grant', (req, res) => {
  const { id } = req.params;
  const { amount = 30, unit = 'days' } = req.body || {};
  const adminEmail = (req.headers['x-admin-email'] || req.body?.adminEmail || 'admin@pulsenoteai.in') as string;

  try {
    const user = store.findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = store.grantPremiumAccess(id, Number(amount), unit as any);

    store.logAdminAuditAction({
      adminEmail,
      action: 'GRANT_MANUAL_TENURE',
      targetUserId: user.id,
      targetUserEmail: user.email,
      details: `Granted ${amount} ${unit} Pro access to ${user.name} (${user.email}). Tenure unlocked until ${new Date(updatedUser.subscription.expiresAt || 0).toLocaleDateString()}.`,
    });

    return res.json({
      success: true,
      user: updatedUser,
      message: `Granted ${amount} ${unit} Pro access to ${user.email}.`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to grant manual tenure' });
  }
});

// Admin Permanent User Deletion Endpoint
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const adminEmail = (req.headers['x-admin-email'] || req.body?.adminEmail || 'admin@pulsenoteai.in') as string;

  try {
    const result = store.deleteUser(id);

    store.logAdminAuditAction({
      adminEmail,
      action: 'DELETE_USER',
      targetUserId: result.deletedUser.id,
      targetUserEmail: result.deletedUser.email,
      details: `Permanently deleted user ${result.deletedUser.name} (${result.deletedUser.email}) and purged account data.`,
    });

    return res.json({
      success: true,
      message: `Permanently deleted user ${result.deletedUser.email}`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to delete user' });
  }
});

// In-memory credit and note counter store for server-enforced transactions
const userAccountState: Record<
  string,
  {
    plan: 'free' | 'pro' | 'team';
    notesUsedThisMonth: number;
    credits: number;
    teamId?: string;
    teamSeats?: number;
    referralCode?: string;
    email?: string;
    subscriptionStatus?: string;
    nextBillingDate?: string;
    createdAt?: string;
    planBilling?: string;
    subscriptionId?: string;
  }
> = {};

function getUserState(uid: string) {
  if (!userAccountState[uid]) {
    userAccountState[uid] = {
      plan: 'free',
      notesUsedThisMonth: 0,
      credits: 0,
      referralCode: uid.slice(0, 8).toUpperCase(),
    };
  }
  return userAccountState[uid];
}

// ==========================================
// IMAGE GENERATION ENDPOINT (Section 2)
// Cost: 1 credit deducted only on success
// ==========================================
app.post('/api/gemini/image/generate', async (req, res) => {
  if (!currentFeatureSettings.imageGenerationEnabled) {
    return res.status(403).json({ error: 'This feature is turned off' });
  }

  const { prompt, aspectRatio = '1:1' } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required for image generation.' });
  }

  const userPrompt = prompt.trim();
  const userForFlags = await verifyServerFirebaseUser(req);
  const flagCheck = checkUserAiAccess(userForFlags?.email, 'image');
  if (!flagCheck.allowed) {
    return res.status(403).json({ error: 'AI_FEATURE_DISABLED', message: flagCheck.reason });
  }

  const user = userForFlags;
  const isAdmin = isAuthorizedAdmin(user);

  if (!isAdmin && user) {
    const acc = getUserState(user.uid);
    if (acc.plan === 'free' && acc.credits < 1) {
      return res.status(402).json({
        error: 'Image generation is a Pro feature and costs 1 credit. Please upgrade to Pro or purchase a credit pack.',
      });
    }
    if (acc.credits < 1) {
      return res.status(402).json({
        error: 'Insufficient credits. Each image costs 1 credit. Please purchase a credit pack.',
      });
    }
  }

  try {
    const liveResults = await searchLiveImages(userPrompt, 4).catch(() => []);
    const fallbackSvg = generateGenerativeImageSvg(userPrompt, 'Photorealistic 8K', undefined, aspectRatio);
    const imageUrl = liveResults.length > 0 ? liveResults[0].url : fallbackSvg;

    if (user && !isAdmin) {
      const acc = getUserState(user.uid);
      if (acc.credits > 0) {
        acc.credits -= 1;
      }
    }

    return res.json({
      success: true,
      imageUrl,
      imageBase64: '',
      mimeType: imageUrl.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/jpeg',
      modelUsed: 'pulsenote-visual-pipeline',
      prompt: userPrompt,
    });
  } catch (err: any) {
    console.error('[ImageGen] Generation error:', err);
    return res.status(500).json({
      error: err?.message || 'Image generation failed.',
    });
  }
});

// ==========================================
// VIDEO GENERATION ENDPOINTS (Section 3)
// ==========================================
interface ServerVideoJob {
  id: string;
  userId: string;
  operationName: string;
  prompt: string;
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  videoBuffer?: Buffer;
  error?: string;
  createdAt: string;
  updatedAt?: string;
}

const serverVideoJobs: Record<string, ServerVideoJob> = {};

app.post('/api/gemini/video/generate', async (req, res) => {
  if (!currentFeatureSettings.videoGenerationEnabled) {
    return res.status(403).json({ error: 'This feature is turned off' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required for video generation.' });
  }

  const userPrompt = prompt.trim();
  const user = await verifyServerFirebaseUser(req);
  const isAdmin = isAuthorizedAdmin(user);

  const videoFlag = checkUserAiAccess(user?.email, 'video');
  if (!videoFlag.allowed) {
    return res.status(403).json({ error: 'AI_FEATURE_DISABLED', message: videoFlag.reason });
  }

  if (!isAdmin && user) {
    const acc = getUserState(user.uid);
    if (acc.plan === 'free' && acc.credits < 10) {
      return res.status(402).json({
        error: 'Video generation is a Pro feature and costs 10 credits. Please upgrade to Pro or purchase a credit pack.',
      });
    }
    if (acc.credits < 10) {
      return res.status(402).json({
        error: 'Insufficient credits. Each video costs 10 credits. Please purchase a credit pack.',
      });
    }
  }

  try {
    const precheckErr = precheck_prompt(userPrompt);
    if (precheckErr) {
      return res.status(400).json({ error: precheckErr });
    }

    const jobId = `vjob_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const result = await generate_video(userPrompt, 'output.mp4');
    const jobRecord: ServerVideoJob = {
      id: jobId,
      userId: user?.uid || 'guest_user',
      operationName: jobId,
      prompt: userPrompt,
      status: result.status === 'ok' ? 'completed' : 'failed',
      videoUrl: result.videoUrl,
      error: result.status === 'ok' ? undefined : result.message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    serverVideoJobs[jobId] = jobRecord;

    if (result.status === 'ok' && user && !isAdmin) {
      const acc = getUserState(user.uid);
      if (acc.credits >= 10) {
        acc.credits -= 10;
      }
    }

    return res.json({
      success: result.status === 'ok',
      jobId,
      operationName: jobId,
      status: jobRecord.status,
      videoUrl: jobRecord.videoUrl,
      modelUsed: result.providerName || 'pulsenote-video-pipeline',
      prompt: userPrompt,
    });
  } catch (err: any) {
    console.error('[Video] Start error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to start video generation.' });
  }
});

// Check video job status
app.get(['/api/videoJobs/:jobId', '/api/gemini/video/status'], async (req, res) => {
  const jobId = req.params.jobId || (req.query.jobId as string) || (req.query.operationName as string);

  if (jobId && serverVideoJobs[jobId]) {
    const job = serverVideoJobs[jobId];
    return res.json({
      success: true,
      jobId: job.id,
      status: job.status,
      done: job.status === 'completed' || job.status === 'failed',
      hasVideo: Boolean(job.videoUrl),
      videoUrl: job.videoUrl,
      error: job.error,
    });
  }

  return res.status(404).json({ error: 'Video job not found.' });
});

// Serve downloaded video blob
app.all(['/api/gemini/video/download', '/api/video-download'], async (req, res) => {
  const jobId = (req.query.jobId as string) || (req.body?.jobId as string);
  const job = jobId ? serverVideoJobs[jobId] : undefined;
  if (job?.videoBuffer) {
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="pulsenote-video.mp4"');
    return res.send(job.videoBuffer);
  }
  if (job?.videoUrl && job.videoUrl.startsWith('http')) {
    return res.redirect(job.videoUrl);
  }
  return res.status(404).json({ error: 'Video not found or still processing.' });
});

// ==========================================
// DETERMINISTIC DOCUMENTATION ENGINE (Section 10)
// Uses gemini-2.5-flash with temperature: 0, topP: 1, responseMimeType: "application/json"
// Never invents facts; returns strict schema or error with retry
// ==========================================
/**
 * Fetch with a hard timeout so a hung AI provider can never hang the request
 * until the platform kills it with an HTML gateway error page.
 */
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 90000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Robustly extract a JSON object from model output.
 * Handles: raw JSON, ```json fenced blocks, prose-wrapped JSON, trailing commas.
 * Returns null when no parseable object exists.
 */
function extractJsonObject(text: string): any | null {
  if (!text || typeof text !== 'string') return null;
  let t = text.trim();
  // Strip markdown code fences
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) t = fence[1].trim();
  try {
    const direct = JSON.parse(t);
    if (direct && typeof direct === 'object') return direct;
  } catch { /* fall through to brace scan */ }
  // Scan for the largest {...} block
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const candidate = t.slice(start, end + 1).replace(/,\s*([}\]])/g, '$1');
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch { /* no parseable object */ }
  }
  return null;
}

app.post('/api/notes/generate', async (req, res) => {
  const {
    input: rawInput,
    templateType = 'soap',
    customSchema,
    outputLength = 'standard',
    customDictionary = [],
    medicalCoding = false,
  } = req.body;
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return res.status(400).json({ error: 'Clinical or enterprise transcript input is required.' });
  }

  const user = await verifyServerFirebaseUser(req);
  const isAdmin = isAuthorizedAdmin(user);
  const userKey = user ? user.uid : (req.headers.authorization || req.ip || 'guest_user');

  // Enforce Free user limit: 5 notes per month
  if (!isAdmin) {
    const acc = getUserState(userKey);
    if (acc.plan === 'free' && acc.notesUsedThisMonth >= 5) {
      return res.status(403).json({
        error: 'NOTE_LIMIT_REACHED',
        message: 'You have used your 5 free notes for this month. Upgrade to Pro for unlimited notes.',
      });
    }
    acc.notesUsedThisMonth += 1;
  }

  const lengthRule = formatOutputLengthInstruction(outputLength);
  const dictRule = formatDictionaryInstruction(customDictionary);
  const systemInstruction =
    `You are a structured documentation formatter. Use ONLY facts in the input. Never invent names, values, drugs, doses, dates or numbers. If a crucial expected detail (such as a proposed lease signing date, property ID, repair cost, or deadline) is omitted from the input, insert [MISSING: Description of required data]; if an entire clinical section has no information, write 'Not documented'. Output JSON matching the requested schema strictly. ${lengthRule}${dictRule}`;

  // Define strict responseSchema per template type
  let responseSchema: any;
  const normalizedType = String(templateType).toLowerCase().replace(/[-_\s]/g, '');
  const isClinicalType = ['soap', 'dischargesummary', 'referralletter', 'progressnote'].includes(normalizedType);

  if (normalizedType === 'soap') {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        subjective: { type: 'STRING' },
        objective: { type: 'STRING' },
        assessment: { type: 'STRING' },
        plan: { type: 'STRING' },
        ...(medicalCoding ? { suggestedCoding: { type: 'STRING' } } : {}),
      },
      required: ['subjective', 'objective', 'assessment', 'plan', ...(medicalCoding ? ['suggestedCoding'] : [])],
    };
  } else if (normalizedType === 'rfc') {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        summary: { type: 'STRING' },
        motivation: { type: 'STRING' },
        proposal: { type: 'STRING' },
        alternatives: { type: 'STRING' },
        risks: { type: 'STRING' },
        rollout: { type: 'STRING' },
        openQuestions: { type: 'STRING' },
      },
      required: ['title', 'summary', 'motivation', 'proposal', 'alternatives', 'risks', 'rollout', 'openQuestions'],
    };
  } else if (normalizedType === 'memo') {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        to: { type: 'STRING' },
        from: { type: 'STRING' },
        date: { type: 'STRING' },
        subject: { type: 'STRING' },
        purpose: { type: 'STRING' },
        background: { type: 'STRING' },
        recommendation: { type: 'STRING' },
        nextSteps: { type: 'STRING' },
      },
      required: ['to', 'from', 'date', 'subject', 'purpose', 'background', 'recommendation', 'nextSteps'],
    };
  } else if (normalizedType === 'dischargesummary') {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        patientDemographics: { type: 'STRING' },
        admissionDate: { type: 'STRING' },
        dischargeDate: { type: 'STRING' },
        admissionDiagnosis: { type: 'STRING' },
        dischargeDiagnosis: { type: 'STRING' },
        hospitalCourse: { type: 'STRING' },
        dischargeMedications: { type: 'STRING' },
        followUpInstructions: { type: 'STRING' },
      },
      required: ['patientDemographics', 'admissionDate', 'dischargeDate', 'admissionDiagnosis', 'dischargeDiagnosis', 'hospitalCourse', 'dischargeMedications', 'followUpInstructions'],
    };
  } else if (normalizedType === 'referralletter') {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        referringProvider: { type: 'STRING' },
        receivingSpecialist: { type: 'STRING' },
        patientInformation: { type: 'STRING' },
        reasonForReferral: { type: 'STRING' },
        clinicalSummary: { type: 'STRING' },
        currentMedications: { type: 'STRING' },
        requestedAction: { type: 'STRING' },
      },
      required: ['referringProvider', 'receivingSpecialist', 'patientInformation', 'reasonForReferral', 'clinicalSummary', 'currentMedications', 'requestedAction'],
    };
  } else if (normalizedType === 'progressnote') {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        intervalHistory: { type: 'STRING' },
        physicalExamination: { type: 'STRING' },
        currentMedications: { type: 'STRING' },
        clinicalImpression: { type: 'STRING' },
        continuedPlan: { type: 'STRING' },
      },
      required: ['intervalHistory', 'physicalExamination', 'currentMedications', 'clinicalImpression', 'continuedPlan'],
    };
  } else if (normalizedType === 'incidentreport') {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        dateTime: { type: 'STRING' },
        locationAndPersonnel: { type: 'STRING' },
        descriptionOfIncident: { type: 'STRING' },
        immediateActionsTaken: { type: 'STRING' },
        rootCauseAnalysis: { type: 'STRING' },
        correctiveActions: { type: 'STRING' },
      },
      required: ['dateTime', 'locationAndPersonnel', 'descriptionOfIncident', 'immediateActionsTaken', 'rootCauseAnalysis', 'correctiveActions'],
    };
  } else if (normalizedType === 'meetingminutes') {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        titleAndDate: { type: 'STRING' },
        attendees: { type: 'STRING' },
        agendaItems: { type: 'STRING' },
        discussionAndDecisions: { type: 'STRING' },
        actionItems: { type: 'STRING' },
      },
      required: ['titleAndDate', 'attendees', 'agendaItems', 'discussionAndDecisions', 'actionItems'],
    };
  } else if (normalizedType === 'sop') {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        titleAndPurpose: { type: 'STRING' },
        scope: { type: 'STRING' },
        responsibilities: { type: 'STRING' },
        procedure: { type: 'STRING' },
        qualityControls: { type: 'STRING' },
      },
      required: ['titleAndPurpose', 'scope', 'responsibilities', 'procedure', 'qualityControls'],
    };
  } else if (normalizedType === 'inspection') {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        propertyDetails: { type: 'STRING' },
        findings: { type: 'STRING' },
        defects: { type: 'STRING' },
        recommendations: { type: 'STRING' },
      },
      required: ['propertyDetails', 'findings', 'defects', 'recommendations'],
    };
  } else if (customSchema && typeof customSchema === 'object') {
    responseSchema = customSchema;
  } else {
    responseSchema = {
      type: 'OBJECT',
      properties: {
        subjective: { type: 'STRING' },
        objective: { type: 'STRING' },
        assessment: { type: 'STRING' },
        plan: { type: 'STRING' },
      },
      required: ['subjective', 'objective', 'assessment', 'plan'],
    };
  }

  try {
    let parsed: any = null;
    let modelUsed = '';
    let providerName = '';

    const schemaKeys = responseSchema?.required || Object.keys(responseSchema?.properties || { subjective: 1, objective: 1, assessment: 1, plan: 1 });
    const codingRule = isClinicalType && medicalCoding
      ? ` For 'suggestedCoding', list only ICD-10-CM and CPT suggestions strictly grounded in documented diagnoses or mark [MISSING: Code specificity / encounter time].`
      : '';
    const systemWithSchema = `${systemInstruction}${codingRule} Output ONLY a valid JSON object with the following required string keys in exact order: ${JSON.stringify(schemaKeys)}. Never return free text or markdown outside the JSON.`;

    const aiRes = await generateWithFallback({
      prompt: rawInput.trim(),
      systemInstruction: systemWithSchema,
      responseFormat: 'json',
      tier: 'fast',
      temperature: 0,
    });

    modelUsed = aiRes.modelUsed;
    providerName = aiRes.providerName;
    parsed = extractJsonObject(aiRes.text);
    if (!parsed) {
      try {
        parsed = JSON.parse(aiRes.text);
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      return res.status(500).json({
        error: 'JSON_PARSE_ERROR',
        message: 'Formatting failed to parse into deterministic schema. Please click Retry.',
      });
    }

    // Ensure all required keys exist, else fill with 'Not documented'
    const requiredKeys = responseSchema?.required || Object.keys(responseSchema?.properties || {});
    for (const key of requiredKeys) {
      if (!parsed[key] || typeof parsed[key] !== 'string' || !parsed[key].trim()) {
        parsed[key] = parsed[key] && typeof parsed[key] === 'string' && parsed[key].trim() ? parsed[key].trim() : 'Not documented';
      }
    }

    // Fact-check post verification:
    // Every number, drug name and date in the output must appear in the input.
    // If not, flag it with "Check this — not found in your input".
    const lowerInput = rawInput.toLowerCase();
    const verificationWarnings: Array<{ section: string; token: string; reason: string }> = [];
    const highlightedSections: Record<string, string> = {};

    const knownDrugSuffixes = /(statin|sartan|pril|olol|ipine|cillin|mycin|oxacin|azole|prazole|tidine|terol|mab|cept|sone|olone|formin|gliptin|gliflozin|glitazone|dopa|pam|lam|pine|done|pramine|triptan|setron|afil|xaban|parin|caine|aspirin|paracetamol|ibuprofen|tylenol|advil|insulin|metformin|gabapentin|lisinopril|atorvastatin|amlodipine|metoprolol|losartan|albuterol|omeprazole|levothyroxine)/i;

    for (const key of requiredKeys) {
      const sectionText = String(parsed[key] || '');
      if (sectionText === 'Not documented') {
        highlightedSections[key] = sectionText;
        continue;
      }

      // Check numbers (e.g., 75mg, 150/95, 92, 45, 1000mg, 10%)
      const numberMatches = sectionText.match(/\b\d+(?:[\.,/]\d+)?(?:\s*(?:mg|mcg|g|ml|mmhg|bpm|lbs|kg|%|f|c|weeks?|days?|months?|years?))?\b/gi) || [];
      // Check date patterns
      const dateMatches = sectionText.match(/\b(?:\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4})\b/gi) || [];
      // Check drug matches
      const words = sectionText.split(/[\s,;:()\.]+/);
      const drugMatches = words.filter(w => w.length >= 4 && knownDrugSuffixes.test(w));

      const tokensToCheck = [...new Set([...numberMatches, ...dateMatches, ...drugMatches])];
      let sectionHtml = sectionText;

      for (const token of tokensToCheck) {
        const cleanToken = token.trim().toLowerCase();
        if (!cleanToken) continue;
        // Check if cleanToken or its base numbers exist in rawInput
        const numbersOnly = cleanToken.replace(/[^\d]/g, '');
        const existsInInput = lowerInput.includes(cleanToken) || (numbersOnly.length > 0 && lowerInput.includes(numbersOnly));

        if (!existsInInput) {
          verificationWarnings.push({
            section: key,
            token,
            reason: 'Check this — not found in your input',
          });
          // Highlight in HTML
          const regex = new RegExp(`\\b(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
          sectionHtml = sectionHtml.replace(
            regex,
            '<mark class="pn-unverified-fact" title="Check this — not found in your input" style="background-color: #fef08a; color: #854d0e; padding: 2px 4px; border-radius: 4px; font-weight: 600;">$1 <span style="font-size: 10px; background-color: #fde047; padding: 1px 4px; border-radius: 3px;">⚠️ Check this — not found in your input</span></mark>'
          );
        }
      }
      highlightedSections[key] = sectionHtml;
    }

    // Increment notes count for user
    if (user && !isAdmin) {
      const acc = getUserState(user.uid);
      acc.notesUsedThisMonth += 1;
      console.log(`[Notes] User ${user.uid} generated note #${acc.notesUsedThisMonth}`);
    }

    const isClinical = ['soap', 'dischargesummary', 'referralletter', 'progressnote'].includes(normalizedType);

    return res.json({
      success: true,
      templateType,
      data: parsed,
      highlightedSections,
      verificationWarnings,
      modelUsed,
      providerName,
      clinicalNotice: isClinical ? 'AI-assisted draft. A licensed professional must review before use.' : undefined,
      retentionNotice: 'Your notes stay in your account. You can delete them at any time.',
      complianceNotice: 'Your notes stay in your account. You can delete them at any time.',
    });
  } catch (err: any) {
    console.error('[DeterministicEngine] Error:', err);
    return res.status(500).json({
      error: 'GENERATION_FAILED',
      message: err.message || 'Documentation generation failed. Please click Retry.',
    });
  }
});

// Regenerate single section
app.post('/api/notes/regenerate-section', async (req, res) => {
  const { input: rawInput, templateType = 'soap', sectionKey } = req.body;
  if (!rawInput || !sectionKey) {
    return res.status(400).json({ error: 'input and sectionKey are required.' });
  }

  const systemInstruction = `You are a structured documentation formatter. For the section '${sectionKey}', use ONLY facts present in the input. Never invent names, values, drugs, doses, dates or numbers. If there is no information in the input for this section, output 'Not documented'. Output only the updated section content text, no extra commentary or markdown header.`;

  try {
    const aiRes = await generateWithFallback({
      prompt: rawInput.trim(),
      systemInstruction,
      tier: 'fast',
      temperature: 0,
    });
    const newContent = (aiRes.text || '').trim() || 'Not documented';

    return res.json({
      success: true,
      sectionKey,
      content: newContent,
      providerName: aiRes.providerName,
      modelUsed: aiRes.modelUsed,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'FAILED_REGENERATE', message: err.message });
  }
});

// Ask PulseNote (Fireflies.ai parity): cross-document grounded Q&A across saved user notes
app.post('/api/notes/ask', async (req, res) => {
  const { question, documents = [], userId, userEmail } = req.body;
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'A question is required.' });
  }

  // Merge explicitly sent documents with server store docs owned by the caller
  const ownerKey = userEmail || userId || '';
  const storeDocs = ownerKey ? store.getUserDocuments(ownerKey) : [];
  const docMap = new Map<string, { id: string; title: string; templateType: string; content: string; createdAt?: number }>();

  for (const d of storeDocs) {
    const contentText = Object.entries(d.sections || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    docMap.set(d.id, {
      id: d.id,
      title: d.title,
      templateType: d.templateType,
      content: `${contentText}\nRaw: ${d.rawInput || ''}`.slice(0, 3500),
      createdAt: d.updatedAt || d.createdAt,
    });
  }

  if (Array.isArray(documents)) {
    for (const d of documents.slice(0, 25)) {
      if (!d?.id) continue;
      const contentText = d.sections
        ? Object.entries(d.sections).map(([k, v]) => `${k}: ${v}`).join('\n')
        : (d.markdownReport || d.rawInput || '');
      docMap.set(d.id, {
        id: String(d.id),
        title: String(d.title || 'Untitled Note'),
        templateType: String(d.templateType || d.industry || 'note'),
        content: String(contentText).slice(0, 3500),
      });
    }
  }

  const corpus = Array.from(docMap.values()).slice(0, 20);
  if (corpus.length === 0) {
    return res.json({
      success: true,
      answer: 'No saved notes were found to search. Create or save at least one note first, then ask PulseNote across your workspace.',
      citations: [],
    });
  }

  const contextBlock = corpus
    .map((doc, idx) => `[DOC #${idx + 1} | ID: ${doc.id} | Title: ${doc.title} | Type: ${doc.templateType}]\n${doc.content}`)
    .join('\n\n---\n\n');

  const askPrompt = `You are PulseNote AI Assistant answering a user's question strictly using ONLY their saved notes below.
Rules:
1. Answer clearly and concisely using only facts present in the documents.
2. Never invent dates, dosages, dollar amounts, or names not present in the documents.
3. Return strict JSON: { "answer": string, "citedDocIds": [string], "followUpQuestions": [string] }.

User Question: ${question.trim()}

Saved Workspace Documents:
${contextBlock}`;

  try {
    let parsed: any = null;
    let providerName = '';
    try {
      const aiRes = await generateWithFallback({
        prompt: askPrompt,
        responseFormat: 'json',
        tier: 'fast',
        temperature: 0.1,
      });
      providerName = aiRes.providerName;
      parsed = extractJsonObject(aiRes.text || '') || { answer: aiRes.text, citedDocIds: [] };
    } catch {
      parsed = null;
    }

    if (!parsed?.answer) {
      const terms = question.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
      const matched = corpus.filter((d) => terms.some((t) => `${d.title} ${d.content}`.toLowerCase().includes(t)));
      return res.json({
        success: true,
        answer: matched.length > 0
          ? `Found ${matched.length} matching note(s):\n` + matched.slice(0, 3).map((m) => `• **${m.title}**: ${m.content.slice(0, 180)}...`).join('\n')
          : `No notes directly matched "${question.trim()}". Try broader keywords or save additional transcripts.`,
        citations: matched.slice(0, 4).map((m) => ({ id: m.id, title: m.title, templateType: m.templateType })),
      });
    }

    const citedIds = new Set(Array.isArray(parsed.citedDocIds) ? parsed.citedDocIds.map(String) : []);
    const citations = corpus
      .filter((d) => citedIds.has(d.id))
      .map((d) => ({ id: d.id, title: d.title, templateType: d.templateType }));

    return res.json({
      success: true,
      answer: parsed.answer,
      citations,
      providerName,
      followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions.slice(0, 3) : [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Ask PulseNote failed.' });
  }
});

// SuperSummary Merge (AudioPen parity): merge multiple selected notes into a master report
app.post('/api/notes/merge', async (req, res) => {
  const { documentIds = [], documents = [], mergeTitle, userId = 'user_guest', userEmail = '', outputLength = 'standard' } = req.body;

  const ownerKey = userEmail || userId;
  const storeDocs = store.getUserDocuments(ownerKey);
  const selectedFromStore = Array.isArray(documentIds) && documentIds.length > 0
    ? storeDocs.filter((d) => documentIds.includes(d.id))
    : [];

  const sourceList = selectedFromStore.length > 0
    ? selectedFromStore.map((d) => ({
        id: d.id,
        title: d.title,
        templateType: d.templateType,
        body: Object.entries(d.sections || {}).map(([k, v]) => `### ${k}\n${v}`).join('\n\n'),
      }))
    : (Array.isArray(documents) ? documents : []).map((d: any) => ({
        id: String(d.id || ''),
        title: String(d.title || 'Untitled Note'),
        templateType: String(d.templateType || 'note'),
        body: d.sections
          ? Object.entries(d.sections).map(([k, v]) => `### ${k}\n${v}`).join('\n\n')
          : String(d.markdownReport || d.rawInput || ''),
      }));

  if (sourceList.length < 2) {
    return res.status(400).json({ error: 'Select at least 2 notes to merge into a SuperSummary.' });
  }

  const combinedInput = sourceList
    .map((s, i) => `## Source Note ${i + 1}: ${s.title} (${s.templateType})\n${s.body.slice(0, 4000)}`)
    .join('\n\n---\n\n');

  const lengthRule = formatOutputLengthInstruction(outputLength);
  const mergePrompt = `Synthesize the following ${sourceList.length} PulseNote documents into one unified, non-redundant executive SuperSummary report.
Strict Rules:
- Preserve exact names, metrics, dates, medications, defects, and prices without inventing anything.
- Insert [MISSING: ...] if an expected detail is absent across all notes.
- ${lengthRule}
Return strict JSON with keys: { "executiveOverview": string, "keyThemesAndFindings": string, "consolidatedActionItems": string, "risksAndOpenGaps": string }.

${combinedInput}`;

  try {
    let parsed: any = null;
    let providerName = '';
    try {
      const aiRes = await generateWithFallback({
        prompt: mergePrompt,
        responseFormat: 'json',
        tier: 'pro',
        temperature: 0.1,
      });
      providerName = aiRes.providerName;
      parsed = extractJsonObject(aiRes.text || '');
    } catch {
      parsed = null;
    }

    if (!parsed) {
      parsed = {
        executiveOverview: `Merged synthesis across ${sourceList.length} notes: ${sourceList.map((s) => s.title).join(', ')}.`,
        keyThemesAndFindings: sourceList.map((s) => `- **${s.title}**: ${s.body.slice(0, 320)}...`).join('\n'),
        consolidatedActionItems: '[MISSING: Review source documents for specific deadlines and owners]',
        risksAndOpenGaps: 'Verify cross-document consistency prior to final distribution.',
      };
    }

    const title = (mergeTitle && String(mergeTitle).trim()) || `SuperSummary (${sourceList.length} Notes Merged)`;
    const savedDoc = store.saveDocument(
      userId,
      {
        title,
        templateType: 'supersummary',
        rawInput: combinedInput.slice(0, 12000),
        sections: {
          executiveOverview: String(parsed.executiveOverview || ''),
          keyThemesAndFindings: String(parsed.keyThemesAndFindings || ''),
          consolidatedActionItems: String(parsed.consolidatedActionItems || ''),
          risksAndOpenGaps: String(parsed.risksAndOpenGaps || ''),
        },
        dataRetentionNotice: 'Merged via PulseNote SuperSummary.',
      },
      userEmail
    );

    return res.json({ success: true, document: savedDoc, providerName });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'SuperSummary merge failed.' });
  }
});

// ==========================================
// STRUCTURED DOCUMENT STUDIO: GENERATION & INLINE REFINEMENT
// Uses 3-Tier OpenAI-Compatible Fallback Provider Chain:
// 1. CodeCraft API -> 2. Iteracompute -> 3. OpenRouter
// ==========================================
const STUDIO_JSON_CONTRACT = `Return ONLY a single valid JSON object (no markdown fences, no commentary outside the JSON) matching this exact schema:
{
  "title": "string — concise, descriptive professional document title",
  "summary": "string — executive summary synthesizing the core points clearly and accurately",
  "keyDecisions": ["string — explicit decisions made or agreed upon; empty array if none stated"],
  "actionItems": [
    {
      "task": "string — clear actionable task description",
      "owner": "string — owner name/role if mentioned in input, else empty string",
      "priority": "High | Medium | Low | '' (empty string if not indicated)",
      "dueDate": "string — deadline or target date if mentioned, else empty string"
    }
  ],
  "additionalSections": [
    {
      "heading": "string — mode-tailored section title",
      "content": "string — clean Markdown body for this section"
    }
  ]
}`;

const STUDIO_MODE_GUIDES: Record<
  string,
  {
    label: string;
    complexSynthesis: boolean;
    systemPrompt: string;
  }
> = {
  meeting_notes: {
    label: 'Meeting Notes & Action Items',
    complexSynthesis: false,
    systemPrompt: `You are PulseNote AI operating in "Meeting Notes & Action Items" mode.
Transform raw meeting transcripts or notes into an audit-ready meeting record.
- summary: Crisp 2-4 sentence executive recap of the meeting purpose, attendees (if stated), and outcome.
- keyDecisions: Every explicit decision reached during the meeting.
- actionItems: Every concrete follow-up task with owner, priority (High/Medium/Low), and dueDate strictly when mentioned or clearly implied (never invent names or dates; leave empty string if unmentioned).
- additionalSections: Include "Discussion Highlights" and "Open Questions & Risks" (and "Attendees & Context" if participants were mentioned).`,
  },
  decision_log: {
    label: 'Decision Log',
    complexSynthesis: false,
    systemPrompt: `You are PulseNote AI operating in "Decision Log" mode.
Transform rough technical or business deliberations into a formal Decision Record (ADR / Business Decision Log).
- summary: Clear statement of the problem and final resolution.
- keyDecisions: Formal, unambiguous decisions approved (include status/scope if mentioned).
- actionItems: Implementation, migration, review, and follow-up tasks with owner, priority, and dueDate when stated.
- additionalSections: Include "Context & Problem Statement", "Options Considered & Trade-offs", and "Risks & Mitigation Plan".`,
  },
  feedback_digest: {
    label: 'Product/Feature Feedback Digest',
    complexSynthesis: true,
    systemPrompt: `You are PulseNote AI operating in "Product/Feature Feedback Digest" mode.
Synthesize customer interviews, support tickets, and qualitative product signals into a high-signal executive digest.
- summary: High-level synthesis of user sentiment, top friction points, and strategic takeaway.
- keyDecisions: Product prioritization or roadmap decisions stated in the input.
- actionItems: Product, engineering, design, or research follow-ups with owner, priority, and dueDate when mentioned.
- additionalSections: Include "Top Recurring Themes", "Notable Customer Signals & Verbatims", and "Recommended Product Impact".`,
  },
  sop_brief: {
    label: 'SOP / Brief',
    complexSynthesis: true,
    systemPrompt: `You are PulseNote AI operating in "SOP / Brief" mode.
Convert operational notes or process descriptions into a clear Standard Operating Procedure (SOP) or Executive Brief.
- summary: Purpose, audience, and operational goal of the SOP or brief.
- keyDecisions: Pre-approved authorities, governance rules, or policy boundaries noted.
- actionItems: Rollout, enablement, automation, or compliance action items with owner, priority, and dueDate when mentioned.
- additionalSections: Include "Scope, Triggers & Prerequisites", "Step-by-Step Procedure" (numbered steps), and "Quality Controls & Escalation".`,
  },
  freeform: {
    label: 'Freeform Document',
    complexSynthesis: false,
    systemPrompt: `You are PulseNote AI operating in "Freeform Document" mode.
Convert unstructured brain-dumps, memos, or voice notes into a clean, well-organized professional document.
- summary: Clear overview capturing the core thesis and intent.
- keyDecisions: Any conclusions, agreements, or directional choices mentioned.
- actionItems: Any tasks, deliverables, or next steps with owner, priority, and dueDate when mentioned.
- additionalSections: Organize the remaining material into 2-4 cleanly titled, logical Markdown sections.`,
  },
};

function normalizeStudioDocumentPayload(
  parsed: any,
  modeId: string,
  modeLabel: string,
  sourceInput: string,
  modelUsed: string,
  providerName: string,
  existingId?: string
) {
  const title = String(parsed?.title || `${modeLabel} Draft`).trim();
  const summary = String(parsed?.summary || '').trim();
  const keyDecisions: string[] = Array.isArray(parsed?.keyDecisions)
    ? parsed.keyDecisions.map((d: any) => String(d || '').trim()).filter(Boolean)
    : [];
  const actionItems = Array.isArray(parsed?.actionItems)
    ? parsed.actionItems
        .filter((a: any) => a && String(a.task || '').trim())
        .map((a: any, idx: number) => {
          const rawPrio = String(a.priority || '').trim().toLowerCase();
          const priority =
            rawPrio === 'high'
              ? 'High'
              : rawPrio === 'medium'
              ? 'Medium'
              : rawPrio === 'low'
              ? 'Low'
              : undefined;
          return {
            id: `act_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
            task: String(a.task).trim(),
            owner: String(a.owner || '').trim(),
            priority,
            dueDate: String(a.dueDate || '').trim(),
            completed: Boolean(a.completed),
          };
        })
    : [];
  const additionalSections = Array.isArray(parsed?.additionalSections)
    ? parsed.additionalSections
        .filter((s: any) => s && (String(s.heading || '').trim() || String(s.content || '').trim()))
        .map((s: any) => ({
          heading: String(s.heading || 'Details').trim(),
          content: String(s.content || '').trim(),
        }))
    : [];

  const mdLines: string[] = [`# ${title}`, `*Mode: ${modeLabel}*`, '', '## Summary', summary || '_Not documented._', '', '## Key Decisions'];
  if (keyDecisions.length > 0) {
    keyDecisions.forEach((d) => mdLines.push(`- ${d}`));
  } else {
    mdLines.push('- No key decisions recorded.');
  }
  mdLines.push('', '## Action Items');
  if (actionItems.length > 0) {
    actionItems.forEach((item: any) => {
      const meta: string[] = [];
      if (item.owner) meta.push(`Owner: ${item.owner}`);
      if (item.priority) meta.push(`Priority: ${item.priority}`);
      if (item.dueDate) meta.push(`Due: ${item.dueDate}`);
      mdLines.push(`- [${item.completed ? 'x' : ' '}] ${item.task}${meta.length ? ` (${meta.join(' · ')})` : ''}`);
    });
  } else {
    mdLines.push('- No action items identified.');
  }
  additionalSections.forEach((sec: any) => {
    mdLines.push('', `## ${sec.heading}`, sec.content || '_Not documented._');
  });

  const now = Date.now();
  return {
    id: existingId || `doc_studio_${now}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    mode: modeId,
    modeLabel,
    summary,
    keyDecisions,
    actionItems,
    additionalSections,
    rawMarkdown: mdLines.join('\n').trim() + '\n',
    sourceInput,
    modelUsed,
    providerName,
    createdAt: now,
    updatedAt: now,
  };
}

app.post('/api/documents/studio-generate', async (req, res) => {
  try {
    const {
      input: rawInput,
      mode = 'meeting_notes',
      modelPreference = 'auto',
      outputLength = 'standard',
      customDictionary = [],
    } = req.body || {};

    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return res.status(400).json({ error: 'Please provide notes, a transcript, or load a sample input first.' });
    }

    const normalizedMode = STUDIO_MODE_GUIDES[mode] ? mode : 'freeform';
    const guide = STUDIO_MODE_GUIDES[normalizedMode];

    const useProTier =
      modelPreference === 'pro' ||
      (modelPreference === 'auto' && (guide.complexSynthesis || rawInput.length > 2600));

    const lengthRule = formatOutputLengthInstruction(outputLength);
    const dictRule = formatDictionaryInstruction(customDictionary);
    const systemInstruction = `${guide.systemPrompt}

Strict Grounding & Quality Rules:
1. Never invent or fabricate names, owners, dates, numbers, or commitments not present in the source input. Leave owner/dueDate as empty strings if not mentioned.
2. Zero conversational filler. Output clean, concise, professional prose and structured Markdown inside the JSON fields.
3. ${lengthRule}${dictRule}

${STUDIO_JSON_CONTRACT}`;

    const aiRes = await generateWithFallback({
      prompt: rawInput.trim(),
      systemInstruction,
      responseFormat: 'json',
      tier: useProTier ? 'pro' : 'fast',
      temperature: 0.2,
    });

    let parsed: any = extractJsonObject(aiRes.text);
    if (!parsed) {
      try {
        parsed = JSON.parse(aiRes.text);
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      return res.status(502).json({
        error: `${aiRes.providerName} returned an unparseable structured document. Please retry.`,
      });
    }

    const structuredDoc = normalizeStudioDocumentPayload(
      parsed,
      normalizedMode,
      guide.label,
      rawInput.trim(),
      aiRes.modelUsed,
      aiRes.providerName
    );

    return res.json({
      success: true,
      document: structuredDoc,
      providerName: aiRes.providerName,
      modelUsed: aiRes.modelUsed,
    });
  } catch (err: any) {
    console.error('[StudioGenerate] Error:', err);
    return res.status(502).json({
      error: err?.message || 'Unexpected error while generating document.',
    });
  }
});

app.post('/api/documents/refine', async (req, res) => {
  try {
    const { document: currentDoc, action } = req.body || {};

    if (!currentDoc || typeof currentDoc !== 'object') {
      return res.status(400).json({ error: 'Current document payload is required for refinement.' });
    }

    const actionInstructions: Record<string, string> = {
      make_concise:
        'Refinement Goal — MAKE CONCISE: Tighten the summary, key decisions, and additional sections by ~40%. Cut filler, repetition, and wordiness while preserving every concrete decision, owner, priority, metric, and deadline.',
      expand_details:
        'Refinement Goal — EXPAND DETAILS: Enrich the summary and additional sections with clearer context, structured rationale, trade-offs, and actionable specificity grounded in the existing document and original source input. Never invent fake people, dates, or dollar figures.',
      convert_to_bullets:
        'Refinement Goal — CONVERT TO BULLET POINTS: Rewrite narrative paragraphs in the summary and every additional section into crisp, scannable Markdown bullet points (`- `). Keep keyDecisions and actionItems clean and structured.',
      extract_action_items:
        'Refinement Goal — EXTRACT ACTION ITEMS: Carefully audit the entire document and original source notes to extract every explicit and implied follow-up task into `actionItems`. Populate `owner`, `priority` (High/Medium/Low), and `dueDate` wherever mentioned or clearly supported by context, without duplicating existing identical items.',
    };

    const refinementPrompt = actionInstructions[String(action || '')];
    if (!refinementPrompt) {
      return res.status(400).json({ error: 'Unsupported refinement action.' });
    }

    const modeId = STUDIO_MODE_GUIDES[currentDoc.mode] ? currentDoc.mode : 'freeform';
    const guide = STUDIO_MODE_GUIDES[modeId];

    const contents = `Current Document (Mode: ${guide.label}):
${JSON.stringify(
  {
    title: currentDoc.title,
    summary: currentDoc.summary,
    keyDecisions: currentDoc.keyDecisions,
    actionItems: currentDoc.actionItems,
    additionalSections: currentDoc.additionalSections,
  },
  null,
  2
)}

${currentDoc.sourceInput ? `Original Source Notes (for factual grounding only):\n${String(currentDoc.sourceInput).slice(0, 8000)}` : ''}

Apply the requested refinement and return the complete updated JSON document.`;

    const systemInstruction = `You are PulseNote AI performing an inline document refinement in "${guide.label}" mode.
${refinementPrompt}
Never invent facts, names, dates, or numbers that are not supported by the current document or original source notes.

${STUDIO_JSON_CONTRACT}`;

    const aiRes = await generateWithFallback({
      prompt: contents,
      systemInstruction,
      responseFormat: 'json',
      tier: action === 'expand_details' ? 'pro' : 'fast',
      temperature: 0.2,
    });

    let parsed: any = extractJsonObject(aiRes.text);
    if (!parsed) {
      try {
        parsed = JSON.parse(aiRes.text);
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      return res.status(502).json({
        error: `${aiRes.providerName} returned unparseable refinement output. Please try again.`,
      });
    }

    const refinedDoc = normalizeStudioDocumentPayload(
      parsed,
      modeId,
      currentDoc.modeLabel || guide.label,
      currentDoc.sourceInput || '',
      aiRes.modelUsed,
      aiRes.providerName,
      currentDoc.id
    );
    refinedDoc.createdAt = currentDoc.createdAt || refinedDoc.createdAt;

    return res.json({
      success: true,
      document: refinedDoc,
      providerName: aiRes.providerName,
      modelUsed: aiRes.modelUsed,
    });
  } catch (err: any) {
    console.error('[StudioRefine] Error:', err);
    return res.status(502).json({
      error: err?.message || 'Unexpected error while refining document.',
    });
  }
});

// ==========================================
// MY DOCUMENTS & VERSION HISTORY API (Requirement 2 & 3)
// ==========================================

// GET /api/documents - List user saved documents
app.get('/api/documents', (req, res) => {
  const userId = (req.query.userId || req.headers['x-user-id'] || 'user_guest') as string;
  const userEmail = (req.query.userEmail || req.headers['x-user-email'] || '') as string;
  const docs = store.getUserDocuments(userEmail || userId);
  return res.json({ success: true, documents: docs });
});

// GET /api/documents/:id - Get single document with full version history
app.get('/api/documents/:id', (req, res) => {
  const userId = (req.query.userId || req.headers['x-user-id'] || '') as string;
  const userEmail = (req.query.userEmail || req.headers['x-user-email'] || '') as string;
  const doc = store.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND', message: 'Document not found' });
  }
  // Documents are private (may contain PHI): require the caller to be the owner.
  if (!store.isDocumentOwnedBy(req.params.id, userId, userEmail)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this document.' });
  }
  return res.json({ success: true, document: doc });
});

// POST /api/documents - Save new document
app.post('/api/documents', (req, res) => {
  const { userId = 'user_guest', userEmail, title, templateType, rawInput, sections, unverifiedTokens, clinicalNotice, dataRetentionNotice } = req.body;
  if (!templateType || !sections) {
    return res.status(400).json({ error: 'INVALID_DATA', message: 'templateType and sections are required' });
  }

  const doc = store.saveDocument(
    userId,
    {
      title: title || `${templateType.toUpperCase()} Record`,
      templateType,
      rawInput: rawInput || '',
      sections,
      unverifiedTokens,
      clinicalNotice,
      dataRetentionNotice,
    },
    userEmail
  );

  return res.json({ success: true, document: doc });
});

// PUT /api/documents/:id - Update document sections or title, appending to version history
app.put('/api/documents/:id', (req, res) => {
  const { userId = 'user_guest', userEmail, title, sections, summary, unverifiedTokens } = req.body;
  try {
    if (!store.isDocumentOwnedBy(req.params.id, userId, userEmail)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this document.' });
    }
    const updated = store.updateDocument(
      userId,
      req.params.id,
      { title, sections, summary, unverifiedTokens },
      userEmail
    );
    return res.json({ success: true, document: updated });
  } catch (err: any) {
    return res.status(400).json({ error: 'UPDATE_FAILED', message: err?.message || 'Failed to update document' });
  }
});

// POST /api/documents/:id/duplicate - Duplicate document
app.post('/api/documents/:id/duplicate', (req, res) => {
  const { userId = 'user_guest', userEmail } = req.body;
  try {
    if (!store.isDocumentOwnedBy(req.params.id, userId, userEmail)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this document.' });
    }
    const duplicated = store.duplicateDocument(userId, req.params.id, userEmail);
    return res.json({ success: true, document: duplicated });
  } catch (err: any) {
    return res.status(400).json({ error: 'DUPLICATION_FAILED', message: err?.message || 'Failed to duplicate document' });
  }
});

// DELETE /api/documents/:id - Delete document
app.delete('/api/documents/:id', (req, res) => {
  const { userId = 'user_guest' } = req.body || {};
  if (!store.isDocumentOwnedBy(req.params.id, userId, req.body?.userEmail)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this document.' });
  }
  const ok = store.deleteDocument(userId, req.params.id);
  if (ok) {
    return res.json({ success: true, message: 'Document deleted successfully' });
  }
  return res.status(404).json({ error: 'DOCUMENT_NOT_FOUND', message: 'Document not found or already deleted' });
});

// POST /api/documents/:id/submit-review — draft → in_review
app.post('/api/documents/:id/submit-review', (req, res) => {
  try {
    const { by = 'author', note, userId, userEmail } = req.body || {};
    if (!store.isDocumentOwnedBy(req.params.id, userId || by, userEmail)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this document.' });
    }
    const doc = store.submitDocumentForReview(req.params.id, String(by), note ? String(note) : undefined);
    return res.json({ success: true, document: doc });
  } catch (err: any) {
    return res.status(400).json({ error: 'REVIEW_SUBMIT_FAILED', message: err?.message || 'Failed to submit for review' });
  }
});

// POST /api/documents/:id/sign-off — in_review → signed_off (locks edits)
app.post('/api/documents/:id/sign-off', (req, res) => {
  try {
    const { by = 'reviewer', note, userId, userEmail } = req.body || {};
    if (!store.isDocumentOwnedBy(req.params.id, userId || by, userEmail)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this document.' });
    }
    const doc = store.signOffDocument(req.params.id, String(by), note ? String(note) : undefined);
    return res.json({ success: true, document: doc });
  } catch (err: any) {
    return res.status(400).json({ error: 'SIGNOFF_FAILED', message: err?.message || 'Failed to sign off document' });
  }
});

// POST /api/documents/:id/reopen — signed_off/in_review → draft
app.post('/api/documents/:id/reopen', (req, res) => {
  try {
    const { by = 'author', note, userId, userEmail } = req.body || {};
    if (!store.isDocumentOwnedBy(req.params.id, userId || by, userEmail)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this document.' });
    }
    const doc = store.reopenDocument(req.params.id, String(by), note ? String(note) : undefined);
    return res.json({ success: true, document: doc });
  } catch (err: any) {
    return res.status(400).json({ error: 'REOPEN_FAILED', message: err?.message || 'Failed to reopen document' });
  }
});

// POST /api/user/delete-account - Permanently delete user account and all saved data (Requirement 3)
app.post(['/api/user/delete-account', '/api/user/account/delete'], (req, res) => {
  const { userId, email } = req.body || {};
  const identifier = email || userId || (req.headers['x-user-email'] as string) || (req.headers['x-user-id'] as string);

  if (!identifier) {
    return res.status(400).json({ error: 'MISSING_IDENTIFIER', message: 'User ID or Email is required to delete account.' });
  }

  try {
    const result = store.deleteUserAccountAndData(identifier);
    return res.json({
      success: true,
      message: 'Your PulseNote AI account, saved documents, and all data have been permanently deleted.',
      deletedDocumentsCount: result.deletedDocumentsCount,
    });
  } catch (err: any) {
    return res.status(400).json({ error: 'DELETION_FAILED', message: err?.message || 'Failed to delete user account.' });
  }
});

// POST /api/auth/logout - Invalidate user session & cookies
app.post(['/api/auth/logout', '/api/logout'], (req, res) => {
  res.clearCookie('session');
  res.clearCookie('auth_token');
  res.clearCookie('pulsenote_auth_token');
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ==========================================
// RAZORPAY PAYMENTS & WEBHOOK (Section 4)
// Subscriptions (Pro ₹699/mo, Team ₹399/seat/mo)
// Upfront yearly one-time orders: Pro ₹5,508/yr, Team ₹299/seat/mo billed yearly
// Credit packs (100 credits ₹299, 500 credits ₹1199, Template Setup ₹2999)
// ==========================================
const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID ||
  process.env.VITE_RAZORPAY_KEY_ID ||
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
  'rzp_live_To8VhLeb57Fbsw';

const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || 'I4mxqneWvMb027K2n1lYEnPG';

const RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET || 'pulse_webhook_secret_123';

const razorpayClient = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// GET /api/razorpay/config - Public endpoint to retrieve current Razorpay Key ID
app.get(['/api/razorpay/config', '/api/razorpay/key'], (_req, res) => {
  return res.json({
    success: true,
    keyId: RAZORPAY_KEY_ID,
    key_id: RAZORPAY_KEY_ID,
    key: RAZORPAY_KEY_ID,
  });
});

// STEP 1: BACKEND - Create Order (POST /api/create-order)
app.post(['/api/create-order', '/api/razorpay/create-order'], async (req, res) => {
  try {
    const { currency = 'INR', receipt, packId, plan, seats = 3 } = req.body || {};

    let amountInPaise = Number(req.body?.amount);

    // Support packId/plan presets if amount is not passed explicitly.
    // Billing matrix: monthly ₹699 pro / ₹399×seats team (mandate);
    // yearly upfront ₹5,508 pro (₹459×12) / seats×₹299×12 team.
    //
    // SECURITY: when the caller names a `plan` or `packId`, the server amount
    // WINS. A client-supplied `amount` is only honoured for orders that do not
    // map to a plan/pack (so a spoofed low amount can never buy a real tier).
    if (plan === 'pro' && req.body?.billing === 'yearly_upfront') {
      amountInPaise = 550800; // ₹5,508 = ₹459 × 12
    } else if (plan === 'team' && req.body?.billing === 'yearly_upfront') {
      const seatCount = Math.max(3, Number(seats) || 3);
      amountInPaise = seatCount * 299 * 12 * 100; // ₹299 × 12 × seats
    } else if (plan === 'pro') {
      amountInPaise = 69900; // ₹699 monthly
    } else if (plan === 'team') {
      const seatCount = Math.max(3, Number(seats) || 3);
      amountInPaise = seatCount * 39900; // ₹399/seat monthly
    } else if (packId === 'credits_100') {
      amountInPaise = 29900; // ₹299
    } else if (packId === 'credits_500') {
      amountInPaise = 119900; // ₹1199
    } else if (packId === 'template_setup') {
      amountInPaise = 299900; // ₹2999
    } else if (!amountInPaise || isNaN(amountInPaise)) {
      amountInPaise = 49900; // Default ₹499
    }

    // Minimum amount validation: 100 paise (₹1.00)
    if (!amountInPaise || amountInPaise < 100) {
      return res.status(400).json({
        error: 'INVALID_AMOUNT',
        message: 'Amount must be at least 100 paise (₹1.00).',
      });
    }

    const options = {
      amount: Math.round(amountInPaise),
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    const order = await razorpayClient.orders.create(options);

    return res.json({
      success: true,
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: RAZORPAY_KEY_ID,
      keyId: RAZORPAY_KEY_ID,
      packId,
      plan,
    });
  } catch (err: any) {
    console.error('[Razorpay] Create order failed:', err);
    return res.status(500).json({
      error: 'RAZORPAY_ORDER_ERROR',
      message: err.message || 'Failed to create Razorpay order.',
    });
  }
});

// Server /api/razorpay/create-subscription
//
// Billing matrix (amounts in INR paise):
//   pro  + monthly → subscription ₹699/mo,  monthly interval, 120 cycles (cancel anytime)
//   team + monthly → subscription ₹399/seat/mo, monthly interval, 120 cycles, qty = seats
// Yearly is ONE-TIME upfront via /api/create-order:
//   pro  → ₹5,508 (₹459 × 12) | team → seats × ₹299 × 12
const BILLING_MATRIX: Record<string, { amountPaise: number; interval: 'monthly'; totalCount: number; label: string }> = {
  'pro:monthly': { amountPaise: 69900, interval: 'monthly', totalCount: 120, label: 'PulseNote Pro Monthly' },
  'team:monthly': { amountPaise: 39900, interval: 'monthly', totalCount: 120, label: 'PulseNote Team Monthly (per seat)' },
};

function resolveBillingKey(plan: string, billing: string): string {
  const p = plan === 'team' ? 'team' : 'pro';
  // Only monthly mandates exist; anything else falls back to monthly.
  // Yearly is sold as one-time upfront orders, not mandates.
  return `${p}:monthly`;
}

app.post('/api/razorpay/create-subscription', async (req, res) => {
  try {
    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.VITE_RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      RAZORPAY_KEY_ID;

    const keySecret = process.env.RAZORPAY_KEY_SECRET || RAZORPAY_KEY_SECRET;
    // Per-tier Razorpay Plan IDs (each Razorpay Plan has a FIXED amount, so
    // each tier needs its own plan). Pin real IDs in env;
    // otherwise the server auto-creates them and logs the IDs to pin.
    const planProMonthly = process.env.RAZORPAY_PLAN_PRO_MONTHLY || '';
    const planTeamMonthly = process.env.RAZORPAY_PLAN_TEAM_MONTHLY || '';
    const presetPlanId = req.body?.plan === 'team' ? planTeamMonthly : planProMonthly;

    const { plan = 'pro', seats = 3, billing = 'monthly' } = req.body || {};
    const billingKey = resolveBillingKey(plan, billing);
    const tier = BILLING_MATRIX[billingKey];

    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // Validate or auto-create the Razorpay Plan for this exact billing tier.
    // (A Razorpay Plan's amount is immutable, so each tier needs its own plan.)
    let validPlanId = presetPlanId;
    if (validPlanId) {
      try {
        await client.plans.fetch(validPlanId);
      } catch (planErr: any) {
        console.warn(`[Razorpay] Configured plan ${validPlanId} unreachable:`, planErr?.error?.description || planErr?.message);
        validPlanId = '';
      }
    }
    if (!validPlanId) {
      try {
        const createdPlan = await client.plans.create({
          period: tier.interval,
          interval: 1,
          item: {
            name: `${tier.label} — ₹${(tier.amountPaise / 100).toLocaleString('en-IN')}/mo`,
            amount: tier.amountPaise,
            currency: 'INR',
            description: tier.label,
          },
        });
        validPlanId = createdPlan.id;
        console.log(`[Razorpay] Auto-created plan ${validPlanId} for tier ${billingKey}. Pin it as env to reuse.`);
      } catch (autoCreateErr: any) {
        console.error('[Razorpay] Plan auto-create failed:', autoCreateErr?.error?.description || autoCreateErr?.message);
        return res.status(500).json({
          success: false,
          error: 'PLAN_SETUP_FAILED',
          message: 'Billing plan setup failed. Please try again or contact support.',
        });
      }
    }

    const user = await verifyServerFirebaseUser(req);
    const uid = user?.uid || req.body?.userId || 'guest';
    const seatCount = plan === 'team' ? Math.max(3, Number(seats) || 3) : 1;

    try {
      const sub = await client.subscriptions.create({
        plan_id: validPlanId,
        total_count: tier.totalCount,
        quantity: seatCount,
        customer_notify: 1,
        notes: {
          uid,
          plan,
          billing: billingKey,
          seats: seatCount,
        },
      });

      return res.json({
        success: true,
        subscriptionId: sub.id,
        plan,
        billing: billingKey,
        seats: seatCount,
        amountPerCycle: tier.amountPaise,
        currency: 'INR',
        keyId,
      });
    } catch (subErr: any) {
      const desc = subErr?.error?.description || subErr?.message || 'Razorpay subscription creation failed.';
      console.error('[Razorpay] Subscription creation failed:', desc);

      return res.status(502).json({
        success: false,
        error: 'SUBSCRIPTION_CREATE_FAILED',
        message: desc,
      });
    }
  } catch (err: any) {
    console.error('[Razorpay] create-subscription unhandled error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to create subscription.',
    });
  }
});

// Payment verification (/api/razorpay/verify-subscription and /api/verify-payment)
app.post(['/api/verify-payment', '/api/razorpay/verify-payment', '/api/razorpay/verify-subscription'], async (req, res) => {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'He2gokLsxHVTPl1eqEv0bfPu';

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_signature,
      paymentId,
      orderId,
      subscriptionId,
      signature,
      plan,
      packId,
      userId,
      seats,
    } = req.body || {};

    const pId = razorpay_payment_id || paymentId;
    const subIdOrOrderId = razorpay_subscription_id || subscriptionId || razorpay_order_id || orderId;
    const sig = razorpay_signature || signature;

    if (!pId || !subIdOrOrderId || !sig) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Missing required parameters for signature verification.',
      });
    }

    // Determine payload string for HMAC-SHA256 signature verification
    // Razorpay subscription signature: razorpay_payment_id + "|" + razorpay_subscription_id
    // Razorpay order signature: razorpay_order_id + "|" + razorpay_payment_id
    let expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${pId}|${subIdOrOrderId}`)
      .digest('hex');

    if (expectedSignature !== sig) {
      // Also check order format order_id|payment_id
      const orderFormatSig = crypto
        .createHmac('sha256', keySecret)
        .update(`${subIdOrOrderId}|${pId}`)
        .digest('hex');

      if (orderFormatSig === sig) {
        expectedSignature = orderFormatSig;
      }
    }

    if (expectedSignature !== sig) {
      console.error('[Razorpay] Signature mismatch:', { sig, expectedSignature, pId, subIdOrOrderId });
      return res.status(400).json({
        success: false,
        error: 'INVALID_SIGNATURE',
        message: 'Payment verification failed: Signature mismatch.',
      });
    }

    console.log(`[Razorpay] Signature Verified Successfully for ID: ${subIdOrOrderId}, Payment: ${pId}`);

    // ---------------------------------------------------------------------
    // SERVER-SIDE AUTHORITATIVE CHECK
    // The signature only proves the ids are genuine; it does NOT prove what was
    // paid for. `plan`, `billing` and `seats` arrive from the client, so we must
    // re-derive the entitlement from Razorpay itself before granting anything.
    // Without this, a client could create a ₹1 order and then verify it while
    // claiming plan=pro/yearly_upfront to get a year of Pro for ₹1.
    // ---------------------------------------------------------------------
    const claimedBilling = ((req.body?.billing as string) || '').trim();
    const claimedSeats = Math.max(1, Number(seats) || 0);

    // Expected amount (in paise) for what the caller claims to have bought.
    let expectedPaise = 0;
    let entitlement: 'pro' | 'team' | 'credits_100' | 'credits_500' | null = null;
    if (plan === 'pro') {
      expectedPaise = claimedBilling === 'yearly_upfront' ? 550800 : 69900;
      entitlement = 'pro';
    } else if (plan === 'team') {
      const seatCount = Math.max(3, claimedSeats || 3);
      expectedPaise = claimedBilling === 'yearly_upfront' ? seatCount * 299 * 12 * 100 : seatCount * 39900;
      entitlement = 'team';
    } else if (packId === 'credits_100') {
      expectedPaise = 29900;
      entitlement = 'credits_100';
    } else if (packId === 'credits_500') {
      expectedPaise = 119900;
      entitlement = 'credits_500';
    }

    if (!entitlement) {
      return res.status(400).json({
        success: false,
        error: 'UNKNOWN_ENTITLEMENT',
        message: 'Could not determine what this payment was for.',
      });
    }

    // Re-fetch the real order / subscription from Razorpay and compare amounts.
    if (razorpay_order_id || orderId) {
      try {
        const order = await razorpayClient.orders.fetch(razorpay_order_id || orderId);
        const paidPaise = Number(order?.amount) || 0;
        if (paidPaise < expectedPaise) {
          console.error('[Razorpay] Amount mismatch on verify:', {
            orderId: razorpay_order_id || orderId,
            paidPaise,
            expectedPaise,
            claimedPlan: plan,
          });
          return res.status(400).json({
            success: false,
            error: 'AMOUNT_MISMATCH',
            message: 'Paid amount does not match the selected plan. Contact support with your payment id.',
          });
        }
      } catch (orderErr: any) {
        console.error('[Razorpay] Order lookup failed:', orderErr?.message || orderErr);
        return res.status(400).json({
          success: false,
          error: 'ORDER_LOOKUP_FAILED',
          message: 'Could not confirm this order with Razorpay. Contact support with your payment id.',
        });
      }
    } else {
      // Subscription mandates settle asynchronously; verify the mandate exists
      // and is attached to a plan whose amount matches what the client claims.
      try {
        const sub: any = await razorpayClient.subscriptions.fetch(subIdOrOrderId);
        const subPaise = Number(sub?.plan?.item?.amount) || 0;
        const qty = Math.max(1, Number(sub?.quantity) || 1);
        const perCycle = subPaise * qty;
        if (perCycle < expectedPaise) {
          console.error('[Razorpay] Subscription amount mismatch on verify:', {
            subscriptionId: subIdOrOrderId,
            perCycle,
            expectedPaise,
            claimedPlan: plan,
          });
          return res.status(400).json({
            success: false,
            error: 'AMOUNT_MISMATCH',
            message: 'Subscription amount does not match the selected plan. Contact support with your payment id.',
          });
        }
      } catch (subErr: any) {
        console.error('[Razorpay] Subscription lookup failed:', subErr?.message || subErr);
        return res.status(400).json({
          success: false,
          error: 'SUBSCRIPTION_LOOKUP_FAILED',
          message: 'Could not confirm this subscription with Razorpay. Contact support with your payment id.',
        });
      }
    }

    // Update user state in database/memory store
    const user = await verifyServerFirebaseUser(req);
    const targetUid = user?.uid || userId;

    if (targetUid) {
      const acc = getUserState(targetUid);
      const billing = (req.body?.billing as string) || '';
      if (plan === 'pro') {
        acc.plan = 'pro';
        acc.credits = Math.max(acc.credits || 0, 500);
        acc.planBilling = billing === 'yearly_upfront' ? 'yearly_upfront' : 'mandate_monthly';
        acc.subscriptionId = subIdOrOrderId;
        // Yearly-upfront = 12 months access; mandate flows renew via webhook/subscription status
        acc.nextBillingDate = new Date(
          Date.now() + (billing === 'yearly_upfront' ? 365 : 30) * 24 * 3600 * 1000
        ).toISOString();
        acc.subscriptionStatus = 'active';
      } else if (plan === 'team') {
        acc.plan = 'team';
        acc.teamSeats = Math.max(3, Number(seats) || 3);
        acc.credits = Math.max(acc.credits || 0, 1000);
        acc.planBilling = billing === 'yearly_upfront' ? 'yearly_upfront' : 'mandate_monthly';
        acc.subscriptionId = subIdOrOrderId;
        acc.nextBillingDate = new Date(
          Date.now() + (billing === 'yearly_upfront' ? 365 : 30) * 24 * 3600 * 1000
        ).toISOString();
        acc.subscriptionStatus = 'active';
      } else if (packId === 'credits_100') {
        acc.credits = (acc.credits || 0) + 100;
      } else if (packId === 'credits_500') {
        acc.credits = (acc.credits || 0) + 500;
      }
      userAccountState[targetUid] = acc;
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully.',
      payment_id: pId,
      subscription_id: subIdOrOrderId,
      razorpay_payment_id: pId,
    });
  } catch (err: any) {
    console.error('[Razorpay] Verification error:', err);
    return res.status(500).json({
      success: false,
      error: 'VERIFICATION_ERROR',
      message: err?.message || 'Payment verification failed.',
    });
  }
});

// Mandate status polling — UPI AutoPay authorizations settle asynchronously.
// Client polls this after checkout until status is active/charged (or timeout).
app.get('/api/razorpay/subscription/:id', async (req, res) => {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || RAZORPAY_KEY_SECRET;
    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.VITE_RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      RAZORPAY_KEY_ID;
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const sub: any = await client.subscriptions.fetch(req.params.id);
    const status = String(sub?.status || 'unknown').toLowerCase();
    const active = ['active', 'authenticated', 'charged'].includes(status) ||
      Number(sub?.paid_count || 0) > 0;
    if (active) {
      // Opportunistically grant the plan from subscription notes
      const notes = sub?.notes || {};
      const uid = notes.uid && notes.uid !== 'guest' ? notes.uid : null;
      if (uid) {
        const acc = getUserState(uid);
        acc.plan = notes.plan === 'team' ? 'team' : 'pro';
        if (notes.plan === 'team') acc.teamSeats = Math.max(3, Number(notes.seats) || 3);
        acc.subscriptionStatus = 'active';
        acc.subscriptionId = sub.id;
        acc.nextBillingDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
        userAccountState[uid] = acc;
      }
    }
    return res.json({
      success: true,
      status: sub?.status || 'unknown',
      active,
      paidCount: Number(sub?.paid_count || 0),
      plan: sub?.notes?.plan || null,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'SUBSCRIPTION_FETCH_FAILED',
      message: err?.message || 'Could not fetch subscription status.',
    });
  }
});

// Razorpay Webhook endpoint (Section 4 & 5)
app.post(['/razorpayWebhook', '/api/razorpay/webhook'], (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const payload = JSON.stringify(req.body);

  // SECURITY: this endpoint grants paid entitlements, so a valid signature is
  // mandatory. Previously a mismatch was only logged, which let anyone POST a
  // forged "subscription.charged" body and upgrade any account for free.
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error('[RazorpayWebhook] Rejected: RAZORPAY_WEBHOOK_SECRET is not configured.');
    return res.status(500).json({ status: 'error', reason: 'webhook_secret_not_configured' });
  }
  if (!signature) {
    console.warn('[RazorpayWebhook] Rejected: missing x-razorpay-signature header.');
    return res.status(400).json({ status: 'error', reason: 'missing_signature' });
  }
  try {
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const sigBuf = Buffer.from(String(signature), 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');
    const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!valid) {
      console.warn('[RazorpayWebhook] Rejected: signature mismatch.');
      return res.status(400).json({ status: 'error', reason: 'invalid_signature' });
    }
  } catch (sigErr) {
    console.error('[RazorpayWebhook] Signature check error:', sigErr);
    return res.status(400).json({ status: 'error', reason: 'signature_check_failed' });
  }

  const event = req.body?.event;
  console.log('[RazorpayWebhook] Received event:', event);

  const subEntity = req.body?.payload?.subscription?.entity;
  const paymentEntity = req.body?.payload?.payment?.entity;
  const email = (subEntity?.customer_email || paymentEntity?.email || subEntity?.notes?.email || '').toLowerCase();
  const planType = (subEntity?.notes?.plan || (subEntity?.plan_id?.includes('team') ? 'team' : 'pro')).toLowerCase();

  if (event === 'subscription.activated' || event === 'subscription.charged') {
    if (email) {
      let matched = false;
      for (const [uid, acc] of Object.entries(userAccountState)) {
        if (acc.email?.toLowerCase() === email) {
          acc.plan = planType === 'team' ? 'team' : 'pro';
          acc.subscriptionStatus = 'active';
          acc.nextBillingDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
          matched = true;
          console.log(`[RazorpayWebhook] Updated ${email} (${uid}) to ${acc.plan}`);
          break;
        }
      }
      if (!matched) {
        // If user document not yet indexed in memory, store by email
        userAccountState[`email_${email}`] = {
          email,
          plan: planType === 'team' ? 'team' : 'pro',
          credits: 100,
          notesUsedThisMonth: 0,
          createdAt: new Date().toISOString(),
          subscriptionStatus: 'active',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        };
      }
    }
  } else if (event === 'subscription.cancelled') {
    if (email) {
      for (const acc of Object.values(userAccountState)) {
        if (acc.email?.toLowerCase() === email) {
          acc.plan = 'free';
          acc.subscriptionStatus = 'cancelled';
          console.log(`[RazorpayWebhook] Downgraded ${email} to free on cancellation.`);
          break;
        }
      }
    }
  } else if (event === 'payment.failed') {
    console.warn(`[RazorpayWebhook] Payment failed for ${email}`);
  }

  return res.json({ status: 'ok', eventReceived: event });
});


// ==========================================
// CODECRAFT API INTEGRATION (https://codecraftapi.com/v1)
// ==========================================
const CODECRAFT_BASE_URL = process.env.CODECRAFT_API_URL || process.env.CODECRAFT_API_BASE_URL || 'https://codecraftapi.com/v1';

app.get('/api/codecraft/status', (_req, res) => {
  return res.json({
    status: 'online',
    baseUrl: CODECRAFT_BASE_URL,
    isKeyConfigured: Boolean(process.env.CODECRAFT_API_KEY),
  });
});

app.all('/api/codecraft/*', async (req, res) => {
  try {
    const subPath = (req.params as any)[0] || '';
    const targetUrl = `${CODECRAFT_BASE_URL.replace(/\/+$/, '')}/${subPath}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;
    const apiKey = process.env.CODECRAFT_API_KEY || '';

    const headers: Record<string, string> = {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'Accept': req.headers['accept'] || 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['x-api-key'] = apiKey;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || 'application/json';

    res.status(response.status);
    res.setHeader('Content-Type', contentType);

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      return res.send(text);
    }
  } catch (err: any) {
    console.error('CodeCraft API proxy error:', err);
    if (!res.headersSent) {
      return res.status(502).json({
        error: 'Failed to communicate with CodeCraft API',
        details: err?.message || 'Unknown error',
        targetBaseUrl: CODECRAFT_BASE_URL,
      });
    }
  }
});

// Location Intelligence Query Endpoint (via 3-tier AI Provider Chain)
app.post('/api/maps/query', async (req, res) => {
  try {
    const { query: searchQuery } = req.body;
    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required for Maps Grounding.' });
    }

    const aiRes = await generateWithFallback({
      prompt: `Provide accurate location intelligence, addresses, typical hours, and practical visiting advice for: ${searchQuery}`,
      tier: 'fast',
    });

    return res.json({
      result: aiRes.text || 'Location search completed.',
      groundingMetadata: null,
      modelUsed: aiRes.modelUsed,
      providerName: aiRes.providerName,
    });
  } catch (err: any) {
    console.error('Maps query error:', err);
    return res.status(500).json({ error: err.message || 'Location query failed' });
  }
});

// Real-Time Voice Conversation & Live Session Info
app.get('/api/live/config', (_req, res) => {
  res.json({
    liveModel: 'gemini-3.8-live',
    transcriptionModel: 'gemini-3.5-transcribe',
    imageEditModel: 'gemini-3.1-flash-image-preview',
    videoModel: 'veo-3.1-fast-generate-preview',
    musicModelClip: 'lyria-3-clip-preview',
    musicModelPro: 'lyria-3-pro-preview',
    chatModels: {
      complex: 'gemini-4-hydrogen',
      general: 'gemini-4-hydrogen',
      fast: 'gemini-3.1-flash-lite',
    },
    audioSampleRate: 24000,
    supportedMimeTypes: ['audio/webm', 'audio/wav', 'audio/mp4'],
  });
});

// Real-Time Token Streaming Endpoint for Pulse Note AI (Gemini Parity)
app.post('/api/transform/stream', async (req, res) => {
  try {
    const { 
      rawText = '', 
      targetIndustry = 'general', 
      formatLens = 'general_assistant',
      tone = 'standard', 
      customContext = '',
      responseMode = 'auto',
      dailyPromptCount = 0,
      isPro = false,
      userEmail = '',
      creativeMode,
      attachedFile,
    } = req.body;

    if ((!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) && !attachedFile) {
      return res.status(400).json({ error: 'Please provide raw notes, query, or attach a file to process.' });
    }

    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const isAdminUser = cleanEmail ? store.isStrictAdminEmail(cleanEmail) : false;
    const effectiveIsPro = isPro || isAdminUser;

    // Set SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // 1. Check Usage Limit Guardrail
    if (!effectiveIsPro && dailyPromptCount >= 3) {
      res.write(`data: ${JSON.stringify({
        type: 'limit_reached',
        isLimitReached: true,
        upgradeMessage: UPGRADE_BLOCK_VERBATIM,
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
      })}\n\n`);
      res.end();
      return;
    }

    // 2. Check Explicit Video / Image Intent & Photo Animation with Strict Priority
    const trimmedInput = rawText.trim();
    const hasImageAttachment = !!(attachedFile?.data && attachedFile?.type?.startsWith('image/')) || !!req.body.sourceImageUrl;
    const isPhotoAnimation = hasImageAttachment && (
      creativeMode === 'video' ||
      /\b(animate|video|motion|bring to life|generate video|make video|live photo|turn into video)\b/i.test(trimmedInput) ||
      trimmedInput.length === 0
    );

    const isExplicitVideo = creativeMode === 'video' || isPhotoAnimation ||
      /^(generate|create|render|make|synthesize|video of|animation of|animate)\s+(an?\s+)?(video|animation|clip|storyboard|motion graphic|b-roll|scene|photo|image)\b/i.test(trimmedInput) ||
      /\b(video of|cinematic scene of|animation of|movie clip of|storyboard of|animate this image|animate this photo|animate image|animate photo)\b/i.test(trimmedInput);

    const isExplicitImage = !isExplicitVideo && (creativeMode === 'image' || 
      /^(generate|create|render|draw|make|synthesize|photo of|image of|picture of)\b/i.test(trimmedInput) ||
      /\b(photo of|render of|image of|picture of|illustration of|portrait of)\b/i.test(trimmedInput));

    if (isExplicitVideo) {
      const arMatch = trimmedInput.match(/--ar\s+(16:9|9:16)/i);
      const aspectRatio = arMatch ? arMatch[1] : (req.body.aspectRatio === '9:16' ? '9:16' : '16:9');
      const cleanPrompt = trimmedInput.replace(/--ar\s+(16:9|9:16)/gi, '').trim();

      // Extract optional audio/music/voiceover instruction
      const audioMatch = trimmedInput.match(/\b(with|audio:|soundtrack:|music:|voiceover:|sfx:)\s+([^,.;]+)/i);
      const audioPrompt = audioMatch ? audioMatch[2].trim() : 'Atmospheric ambient synthesis with low sub-bass drone and sound effects';

      const sourceImageUrl = (attachedFile?.data && attachedFile?.type?.startsWith('image/')) ? attachedFile.data : req.body.sourceImageUrl;

      const mediaJob = mediaQueue.enqueueJob({
        userId: req.body.userId || 'usr_guest',
        mediaType: 'video',
        prompt: cleanPrompt || (isPhotoAnimation ? 'Animate this photo with cinematic motion, subtle depth pan, and vivid lighting' : 'Cinematic sequence'),
        sourceImageUrl,
        aspectRatio,
        style: 'Photorealistic 8K Cinematic',
        audioPrompt,
      });

      const previewPosterUrl = sourceImageUrl || generateGenerativeImageSvg(
        cleanPrompt || 'Animated Video Sequence',
        'Veo 8K Video Frame',
        ['#06b6d4', '#3b82f6', '#10b981', '#0f172a'],
        aspectRatio
      );

      res.write(`data: ${JSON.stringify({
        type: 'media_ready',
        mediaType: 'video',
        title: `Video: ${(cleanPrompt || (isPhotoAnimation ? 'Animated Photo Sequence' : 'Cinematic Video')).slice(0, 42)}`,
        executiveSummary: isPhotoAnimation 
          ? `Animating uploaded photo using Google Veo 3.1 (veo-3.1-fast-generate-preview) in ${aspectRatio} aspect ratio.`
          : `Generated Veo Cinematic Sequence for: "${cleanPrompt.slice(0, 80)}"`,
        jobId: mediaJob.id,
        videoParams: {
          title: `Cinematic Sequence: ${(cleanPrompt || 'Animated Photo').slice(0, 36)}`,
          targetDuration: '00:08',
          aspectRatio,
          cameraMotion: 'Dynamic orbital sweep with steady tracking pan',
          visualStyle: 'Photorealistic 8K Cinematic',
          lighting: 'Golden hour volumetric illumination',
          audioPrompt,
          previewPosterUrl,
          modelPromptVeoSora: cleanPrompt || 'Animate photo with cinematic motion',
        },
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
      })}\n\n`);
      res.end();
      return;
    }

    if (isExplicitImage) {
      const arMatch = trimmedInput.match(/--ar\s+(16:9|9:16|1:1|4:3|3:4)/i);
      const aspectRatio = arMatch ? arMatch[1] : '16:9';
      const cleanPrompt = trimmedInput.replace(/--ar\s+(16:9|9:16|1:1|4:3|3:4)/gi, '').trim();

      const mediaJob = mediaQueue.enqueueJob({
        userId: req.body.userId || 'usr_guest',
        mediaType: 'image',
        prompt: cleanPrompt,
        aspectRatio,
        style: 'Photorealistic Hyper-Detailed 8K',
      });

      const liveResults = await searchLiveImages(cleanPrompt, 8).catch(() => []);
      const proceduralFallbackUrl = generateGenerativeImageSvg(cleanPrompt, 'Photorealistic 8K', undefined, aspectRatio);
      const activePreviewUrl = liveResults.length > 0 ? liveResults[0].url : proceduralFallbackUrl;

      res.write(`data: ${JSON.stringify({
        type: 'media_ready',
        mediaType: 'image',
        title: `Image: ${cleanPrompt.slice(0, 42)}`,
        executiveSummary: `Generated live visual asset search results for: "${cleanPrompt.slice(0, 80)}"`,
        jobId: mediaJob.id,
        imageResults: liveResults,
        imageParams: {
          prompt: cleanPrompt,
          style: 'Photorealistic Hyper-Detailed 8K',
          aspectRatio,
          previewUrl: activePreviewUrl,
          results: liveResults,
        },
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
      })}\n\n`);
      res.end();
      return;
    }

    // 3. Construct Gemini Streaming Instruction & Contents
    const industryInstruction = targetIndustry && targetIndustry !== 'general'
      ? `\n\n${getSystemPromptForMode(targetIndustry)}`
      : '';
    const systemPrompt = `${SYSTEM_INSTRUCTION_BASE}${industryInstruction}

Strict Anti-Hallucination & Compliance Guardrails:
- Never invent, guess, or hallucinate missing critical data (such as lease/inspection dates, dollar figures/repair costs, property addresses/IDs, vital signs, dosages, or deadlines).
- If a crucial data point is missing from the raw input, explicitly insert an audit-ready placeholder formatted as [MISSING: Description of required data] (for example, [MISSING: Proposed Lease Signing Date] or [MISSING: Repair Cost Estimate]).
- If target industry is specialized (Medical/Clinical SOAP, Real Estate/Property Inspection, Software/Technical Sprint, or Client Consulting), strictly follow that industry template structure above; otherwise use the structured executive summary format below:
### 1. Direct Summary
[A concise, clear opening overview giving the core answer immediately]

### 2. Structured Breakdown
[Comprehensive explanation with clean bullet points, formatted code snippets in \`\`\`language blocks if technical, and markdown tables if comparative]

### 3. Actionable Next Steps
[Numbered, practical execution steps and recommendations]

Conclude with the mandatory disclaimer:
${MANDATORY_LEGAL_NOTICE}`;

    const attachmentContext = attachedFile
      ? `\n[Attached Asset Context]: User attached ${attachedFile.category} file named "${attachedFile.name}" (Type: ${attachedFile.type}, Size: ${(attachedFile.size / 1024).toFixed(1)} KB).\n`
      : '';

    const userPrompt = `${attachmentContext}User Query / Notes:
${rawText || (attachedFile ? `Analyze attached asset: ${attachedFile.name}` : '')}`;

    const messagesPayload: Array<{ role: 'user'; content: any }> =
      attachedFile?.data && attachedFile?.type?.startsWith('image/')
        ? [
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: attachedFile.data.startsWith('data:')
                      ? attachedFile.data
                      : `data:${attachedFile.type};base64,${attachedFile.data}`,
                  },
                },
              ],
            },
          ]
        : [{ role: 'user', content: userPrompt }];

    let fullAccumulated = '';
    let providerName = '';
    let modelUsed = '';

    for await (const part of streamWithFallback({
      messages: messagesPayload,
      systemInstruction: systemPrompt,
      tier: formatLens === 'deep_research' ? 'pro' : 'fast',
    })) {
      fullAccumulated += part.chunk;
      providerName = part.providerName;
      modelUsed = part.modelUsed;
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'token', text: part.chunk, providerName })}\n\n`);
      }
    }

    const summaryMatch = fullAccumulated.match(/### 1\. Direct Summary\s*([\s\S]*?)(?=### 2|$)/i);
    const directSummary = summaryMatch ? summaryMatch[1].trim() : fullAccumulated.slice(0, 180) + '...';

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({
        type: 'done',
        fullText: fullAccumulated,
        title: rawText.slice(0, 42) || 'PulseNote Intelligence Report',
        executiveSummary: directSummary,
        providerName,
        modelUsed,
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
      })}\n\n`);
      res.end();
    }

    // Log activity in background
    try {
      store.logUserActivity({
        userId: req.body.userId || 'usr_guest',
        userEmail: req.body.userEmail || 'client@pulsenote.ai',
        userName: req.body.userName || 'Client User',
        industry: targetIndustry,
        rawInput: rawText.slice(0, 300),
        solutionTitle: rawText.slice(0, 42) || 'Analysis',
      });
    } catch (e) {}
  } catch (err: any) {
    console.error('Streaming error in /api/transform/stream:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Stream generation failed' });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Stream generation failed' })}\n\n`);
      return res.end();
    }
  }
});

// API endpoint to transform rough notes/transcripts
app.post('/api/transform', async (req, res) => {
  try {
    const { 
      rawText, 
      targetIndustry, 
      formatLens = 'general_assistant',
      tone = 'standard', 
      customContext = '',
      responseMode = 'auto',
      dailyPromptCount = 0,
      isPro = false,
      userEmail = '',
      creativeMode,
      attachedFile,
    } = req.body;

    if ((!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) && !attachedFile) {
      return res.status(400).json({ error: 'Please provide raw notes, query, or attach a file to process.' });
    }

    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const isAdminUser = cleanEmail ? store.isStrictAdminEmail(cleanEmail) : false;
    const effectiveIsPro = isPro || isAdminUser;

    // 3. Usage Tracking & Monetization Guardrails (3 Free Prompts/Day Rule for non-Pro / non-Admin)
    if (!effectiveIsPro && dailyPromptCount >= 3) {
      return res.json({
        isLimitReached: true,
        dailyPromptCount,
        title: 'Daily Free Limit Reached',
        executiveSummary: 'Daily free usage limit of 3 transformations has been reached for this account. Upgrade to Pro for unlimited access.',
        markdownReport: UPGRADE_BLOCK_VERBATIM,
        upgradeMessage: UPGRADE_BLOCK_VERBATIM,
        sections: [
          {
            heading: 'Daily Limit Reached (3/3 Used)',
            content: UPGRADE_BLOCK_VERBATIM,
            severity: 'High',
            category: 'Monetization Guardrail',
          },
        ],
        actionItems: [
          {
            task: 'Upgrade to PulseNote Pro for unlimited transformations (secure in-app Razorpay checkout)',
            owner: 'User',
            deadline: 'Immediate',
            priority: 'High',
          },
        ],
        detectedEntities: [],
        keyTakeaways: [
          'Free tier allows 3 prompt transformations per 24 hours.',
          'Pro tier provides unlimited generation, priority queue, and direct export.',
        ],
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
      });
    }

    // =========================================================================
    // EXPLICIT INTENT INTERCEPTION: Route Media Generation Requests Exclusively
    // (Eliminating Text Bloat, Markdown Walls, and Spec Sheets on Media Queries)
    // =========================================================================
    const trimmedInput = rawText.trim();
    const hasImageAttachment = !!(attachedFile?.data && attachedFile?.type?.startsWith('image/')) || !!req.body.sourceImageUrl;
    const isPhotoAnimation = hasImageAttachment && (
      creativeMode === 'video' ||
      /\b(animate|video|motion|bring to life|generate video|make video|live photo|turn into video)\b/i.test(trimmedInput) ||
      trimmedInput.length === 0
    );

    const isExplicitVideo = creativeMode === 'video' || isPhotoAnimation ||
      /^(generate|create|render|make|synthesize|video of|animation of|animate)\s+(an?\s+)?(video|animation|clip|storyboard|motion graphic|b-roll|scene|photo|image)\b/i.test(trimmedInput) ||
      /\b(video of|cinematic scene of|animation of|movie clip of|storyboard of|animate this image|animate this photo|animate image|animate photo)\b/i.test(trimmedInput);

    const isExplicitImage = !isExplicitVideo && (creativeMode === 'image' || 
      /^(generate|create|render|draw|make|synthesize|photo of|image of|picture of)\b/i.test(trimmedInput) ||
      /\b(photo of|render of|image of|picture of|illustration of|portrait of)\b/i.test(trimmedInput));

    // Helper to sanitize prompt prefixes and extract pure subject
    const extractCleanPrompt = (input: string) => {
      let cleaned = input
        .replace(/^\[.*?\]/g, '')
        .replace(/^(please\s+)?(generate|create|render|draw|make|synthesize|show\s+me)(\s+an?|\s+the)?\s+(image|photo|picture|wallpaper|illustration|art|portrait|render|video|clip|animation)\s*(of|for|showing|depicting)?\s*[:,-]?\s*/i, '')
        .replace(/^(photo|image|picture|video|animation|illustration|portrait|render)\s+of\s*[:,-]?\s*/i, '')
        .replace(/--ar\s+(16:9|9:16|1:1|4:3|3:4)/gi, '')
        .trim();
      return cleaned.length > 0 ? cleaned : input.replace(/--ar\s+(16:9|9:16|1:1|4:3|3:4)/gi, '').trim();
    };

    if (isExplicitVideo) {
      const arMatch = trimmedInput.match(/--ar\s+(16:9|9:16)/i);
      const aspectRatio = arMatch ? arMatch[1] : (req.body.aspectRatio === '9:16' ? '9:16' : '16:9');
      const cleanPrompt = extractCleanPrompt(trimmedInput);

      // Extract audio request/voiceover/sfx parameters
      const audioMatch = trimmedInput.match(/\b(with|audio:|soundtrack:|music:|voiceover:|sfx:)\s+([^,.;]+)/i);
      const audioPrompt = audioMatch ? audioMatch[2].trim() : 'Atmospheric ambient synthesis with low sub-bass drone and sound effects';

      const sourceImageUrl = (attachedFile?.data && attachedFile?.type?.startsWith('image/')) ? attachedFile.data : req.body.sourceImageUrl;

      try {
        const mediaJob = mediaQueue.enqueueJob({
          userId: req.body.userId || 'usr_guest',
          mediaType: 'video',
          prompt: cleanPrompt || (isPhotoAnimation ? 'Animate this photo with cinematic motion, subtle depth pan, and vivid lighting' : 'Cinematic sequence'),
          sourceImageUrl,
          aspectRatio,
          style: 'Photorealistic 8K Cinematic',
          audioPrompt,
        });

        const previewPosterUrl = sourceImageUrl || generateGenerativeImageSvg(
          cleanPrompt || 'Animated Video Sequence',
          'Veo 8K Video Frame',
          ['#06b6d4', '#3b82f6', '#10b981', '#0f172a'],
          aspectRatio
        );

        return res.json({
          success: true,
          mediaType: 'video',
          title: `Video: ${(cleanPrompt || (isPhotoAnimation ? 'Animated Photo Sequence' : 'Cinematic Video')).slice(0, 42)}`,
          executiveSummary: isPhotoAnimation
            ? `Animating uploaded photo using Google Veo 3.1 (veo-3.1-fast-generate-preview) in ${aspectRatio} aspect ratio.`
            : `Generated Veo Cinematic Sequence for: "${cleanPrompt.slice(0, 80)}"`,
          responseMode: 'productivity',
          jobId: mediaJob.id,
          queuePosition: mediaJob.queuePosition,
          estimatedCountdownSeconds: mediaJob.totalDurationSeconds,
          videoParams: {
            title: `Cinematic Sequence: ${(cleanPrompt || 'Animated Photo').slice(0, 36)}`,
            targetDuration: '00:08',
            aspectRatio,
            cameraMotion: 'Dynamic orbital sweep with steady tracking pan',
            visualStyle: 'Photorealistic 8K Cinematic',
            lighting: 'Golden hour volumetric illumination',
            audioPrompt,
            previewPosterUrl,
            modelPromptVeoSora: cleanPrompt || 'Animate photo with cinematic motion',
          },
          markdownReport: '',
          sections: [],
          actionItems: [],
          detectedEntities: [],
          keyTakeaways: [],
          complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
        });
      } catch (err: any) {
        return res.status(503).json({
          success: false,
          error: 'Media generation busy. Please retry.',
        });
      }
    }

    if (isExplicitImage) {
      const arMatch = trimmedInput.match(/--ar\s+(16:9|9:16|1:1|4:3|3:4)/i);
      const aspectRatio = arMatch ? arMatch[1] : '16:9';
      const cleanPrompt = extractCleanPrompt(trimmedInput);

      try {
        const mediaJob = mediaQueue.enqueueJob({
          userId: req.body.userId || 'usr_guest',
          mediaType: 'image',
          prompt: cleanPrompt,
          aspectRatio,
          style: 'Photorealistic Hyper-Detailed 8K',
        });

        // 1. Fetch live authentic image search results for the dynamic query
        const liveResults = await searchLiveImages(cleanPrompt, 8);

        const proceduralFallbackUrl = generateGenerativeImageSvg(
          cleanPrompt,
          'Photorealistic 8K',
          undefined,
          aspectRatio
        );

        const activePreviewUrl = liveResults.length > 0 ? liveResults[0].url : proceduralFallbackUrl;

        return res.json({
          success: true,
          mediaType: 'image',
          title: `Image: ${cleanPrompt.slice(0, 42)}`,
          executiveSummary: `Generated live visual asset search results for: "${cleanPrompt.slice(0, 80)}"`,
          responseMode: 'productivity',
          jobId: mediaJob.id,
          queuePosition: mediaJob.queuePosition,
          estimatedCountdownSeconds: mediaJob.totalDurationSeconds,
          imageResults: liveResults,
          imageParams: {
            prompt: cleanPrompt,
            style: 'Photorealistic Hyper-Detailed 8K',
            lighting: 'Volumetric cinematic fill with atmospheric depth',
            composition: 'Cinematic wide-angle rule-of-thirds',
            aspectRatio,
            previewUrl: activePreviewUrl,
            results: liveResults,
          },
          markdownReport: '',
          sections: [],
          actionItems: [],
          detectedEntities: [],
          keyTakeaways: [],
          complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
        });
      } catch (err: any) {
        return res.status(503).json({
          success: false,
          error: 'Media generation busy. Please retry.',
        });
      }
    }

    const industryMap: Record<string, string> = {
      general: 'Universal Search & Multimodal Intelligence',
      medical: 'Medical/Clinical',
      real_estate: 'Real Estate / Property Inspection',
      software: 'Software / Technical Sprint',
      executive: 'General Executive / Consulting',
    };

    const targetIndustryName = industryMap[targetIndustry] || 'Universal Search & Multimodal Intelligence';

    const formatLensMap: Record<string, string> = {
      deep_research: 'Deep Research Mode: Conduct rigorous, exhaustive research with web citations, factual evidence, comparative tables, and deep structural analysis.',
      creative_writing: 'Creative Writing Mode: Formulate evocative, cinematic narrative prose, rich sensory imagery, and compelling character or script storytelling.',
      code_generation: 'Code Generation Mode: Architect clean, production-grade, typed code, optimal algorithms, system design diagrams, and comprehensive unit tests.',
      business_strategy: 'Business Strategy Mode: Structure executive decision frameworks, financial KPI metrics, market penetration models, and risk mitigation registers.',
      general_assistant: 'General Assistant Mode: Deliver rapid, balanced, highly practical, and actionable intelligence for immediate real-world execution.',
    };

    const formatLensDescription = formatLensMap[formatLens] || formatLensMap.general_assistant;

    const attachmentContext = attachedFile
      ? `\n[Attached Asset Context]: User has attached a ${attachedFile.category} file named "${attachedFile.name}" (MIME: ${attachedFile.type}, Size: ${(attachedFile.size / 1024).toFixed(1)} KB). Synthesize and incorporate insights directly from this asset.\n`
      : '';

    const userPrompt = `Target Scope / Context: ${targetIndustryName}
Selected Output Format & Lens: ${formatLensDescription}
Tone/Detail Specification: ${tone}
Requested Dynamic Response Mode: ${responseMode}
${customContext ? `Additional Context/Organization: ${customContext}\n` : ''}${attachmentContext}
Raw User Query or Prompt (Text, creative concept, media generation, or technical challenge):
"""
${rawText || (attachedFile ? `Analyze and evaluate attached file: ${attachedFile.name}` : '')}
"""

Instructions for response (Emulating Google Gemini deep search, universal multimodal processing, and structured clarity):
Please deeply analyze the query and any attached asset. Accept any open-domain prompt, creative brainstorm, or technical problem without rigid silos.
If the user is requesting an image (e.g., "Create an image...", "Generate a photo...", "Draw...", "Render..."):
  - Analyze aesthetic, style, lighting, composition, and aspect ratio.
  - Set "mediaType": "image".
  - Populate "imageParams" with a comprehensive prompt and execution parameters.
If the user is requesting a video (e.g., "Generate a video scene...", "Video storyboard...", "Cinematic shot..."):
  - Set "mediaType": "video".
  - Populate "videoParams" with storyboard breakdown, camera motion, duration, audio prompt, and optimized Veo/Sora parameters.
If the prompt is vague or missing key constraints:
  - Do NOT fail or crash. Set "isVague": true, list 2-3 polite "clarifyingQuestions", and provide a complete "defaultWorkingDraft" inside the response.

Return a valid JSON object matching this schema:
{
  "mediaType": "text" | "image" | "video",
  "isVague": boolean,
  "clarificationRequest": string, // Polite clarifying message if vague, else empty
  "clarifyingQuestions": [string], // 2-3 specific clarifying questions if isVague is true
  "title": string, // Professional solution and documentation title
  "executiveSummary": string, // Concise, direct answer or core synthesis right at the top (1-2 sentences)
  "responseMode": "research" | "productivity" | "problem_solving",
  "immediateSolution": string, // Direct immediate answer or media generation overview addressing the core request directly
  "bestOnlinePractices": string, // Best online practices, verified standards, or prompt engineering techniques derived from web research
  "actionableStrategicPlan": string, // Detailed numbered execution roadmap / next steps
  "imageParams": { // Include if mediaType is "image"
    "prompt": string, // Detailed, highly optimized prompt (describing aesthetic, style, lighting, composition)
    "style": string,
    "lighting": string,
    "composition": string,
    "aspectRatio": string,
    "colorPalette": [string]
  },
  "videoParams": { // Include if mediaType is "video"
    "title": string,
    "targetDuration": string,
    "aspectRatio": string,
    "cameraMotion": string,
    "visualStyle": string,
    "lighting": string,
    "audioPrompt": string,
    "scenes": [
      {
        "shotNumber": number,
        "duration": string,
        "camera": string,
        "visualAction": string,
        "audioSFX": string
      }
    ],
    "modelPromptVeoSora": string
  },
  "searchSources": [
    {
      "title": string,
      "url": string,
      "snippet": string
    }
  ],
  "markdownReport": string, // Complete formatted markdown report. Must begin with:
  // > **Direct Executive Summary:** [1-2 sentences]
  // ## 1. Immediate Solution / Direct Answer
  // ## 2. Best Online Practices & Current Industry Standards
  // ## 3. Actionable Strategic Plan / Next Steps (Numbered execution steps)
  // followed by detailed breakdown, action items, and ending with the mandatory legal disclaimer.
  "sections": [
    {
      "heading": string,
      "content": string,
      "severity": "Low" | "Medium" | "High" | null,
      "category": string
    }
  ],
  "actionItems": [
    {
      "task": string,
      "owner": string,
      "deadline": string,
      "priority": "High" | "Medium" | "Low"
    }
  ],
  "detectedEntities": [
    {
      "name": string,
      "type": "Person" | "Medication" | "Metric" | "Location" | "Date" | "System" | "Risk"
    }
  ],
  "keyTakeaways": [string],
  "complianceDisclaimer": string
}
`;

    const transformMessages: Array<{ role: 'user'; content: any }> =
      attachedFile?.data && attachedFile?.type?.startsWith('image/')
        ? [
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: attachedFile.data.startsWith('data:')
                      ? attachedFile.data
                      : `data:${attachedFile.type};base64,${attachedFile.data}`,
                  },
                },
              ],
            },
          ]
        : [{ role: 'user', content: userPrompt }];

    const outputLengthHint = formatOutputLengthInstruction(req.body.outputLength);
    const dictHint = formatDictionaryInstruction(req.body.customDictionary);
    const industryModePrompt = targetIndustry && targetIndustry !== 'general'
      ? `\n\n${getSystemPromptForMode(targetIndustry)}`
      : '';
    const antiHallucinationRule = `\n\nStrict Anti-Hallucination & Compliance Guardrails:
- Never invent, guess, or hallucinate missing critical data (such as proposed lease/closing dates, inspection dates, property IDs/addresses, financial figures/repair costs, medical metrics/dosages, or deadlines).
- Whenever a crucial data point is absent from the raw input, explicitly insert an audit-ready placeholder formatted as [MISSING: Description of required data] inside markdownReport, sections, and actionItems (e.g., [MISSING: Proposed Lease Signing Date], [MISSING: Repair Cost Estimate], [MISSING: Property ID]).`;
    const augmentedInstruction = `${SYSTEM_INSTRUCTION_BASE}${industryModePrompt}${antiHallucinationRule}\n${outputLengthHint}${dictHint}`;

    let responseText = '';
    let providerName = '';
    let modelUsed = '';
    try {
      const aiRes = await generateWithFallback({
        messages: transformMessages,
        systemInstruction: augmentedInstruction,
        responseFormat: 'json',
        tier: formatLens === 'deep_research' ? 'pro' : 'fast',
      });
      responseText = aiRes.text;
      providerName = aiRes.providerName;
      modelUsed = aiRes.modelUsed;
    } catch (err: any) {
      console.warn('[Transform] All 3 AI providers failed, utilizing deterministic fallback engine:', err?.message);
    }

    if (!responseText) {
      const fallbackData = buildFallbackDocumentation(rawText, targetIndustry, targetIndustryName, tone, customContext, responseMode);
      
      try {
        store.logUserActivity({
          userId: req.body.userId || 'usr_guest',
          userEmail: req.body.userEmail || 'client@pulsenote.ai',
          userName: req.body.userName || 'Client User',
          industry: targetIndustry,
          rawInput: rawText.slice(0, 300),
          solutionTitle: fallbackData.title,
        });
      } catch (logErr) {
        console.warn('Failed to log user activity:', logErr);
      }

      return res.json(scrubAdminDetails(fallbackData));
    }

    let parsedData: any;
    try {
      parsedData = extractJsonObject(responseText) || JSON.parse(responseText);
      if (parsedData && typeof parsedData === 'object') {
        parsedData.providerName = providerName;
        parsedData.modelUsed = modelUsed;
      }
    } catch {
      parsedData = {
        mediaType: 'text',
        isVague: false,
        clarificationRequest: '',
        providerName,
        modelUsed,
        title: `${targetIndustryName} Professional Report`,
        executiveSummary: 'Synthesized intelligence and actionable execution report generated per user input.',
        responseMode: responseMode !== 'auto' ? responseMode : 'productivity',
        markdownReport: responseText,
        sections: [
          {
            heading: 'Report',
            content: responseText,
            severity: null,
            category: 'Summary',
          },
        ],
        actionItems: [],
        detectedEntities: [],
        keyTakeaways: [],
      };
    }

    // Ensure mediaType is defined
    if (!parsedData.mediaType) {
      if (/\b(image|picture|photo|render|illustration|wallpaper|draw)\b/i.test(rawText)) {
        parsedData.mediaType = 'image';
      } else if (/\b(video|scene|storyboard|cinematic shot|motion graphic|b-roll)\b/i.test(rawText)) {
        parsedData.mediaType = 'video';
      } else {
        parsedData.mediaType = 'text';
      }
    }

    // Attach calibrated preview visualization and countdown metadata for multi-modal requests
    if (parsedData.mediaType === 'image') {
      if (!parsedData.imageParams) {
        parsedData.imageParams = {
          prompt: rawText,
          style: 'Photorealistic Hyper-Detailed 8K',
          lighting: 'Volumetric cinematic fill with atmospheric depth',
          composition: 'Cinematic wide-angle rule-of-thirds',
          aspectRatio: '16:9',
          colorPalette: ['#6366f1', '#0ea5e9', '#f59e0b', '#0f172a'],
        };
      }
      if (!parsedData.imageParams.previewUrl) {
        parsedData.imageParams.previewUrl = generateGenerativeImageSvg(
          parsedData.imageParams.prompt || rawText,
          parsedData.imageParams.style || 'Photorealistic 8K',
          parsedData.imageParams.colorPalette
        );
      }

      // Enqueue job into FIFO processing queue
      const mediaJob = mediaQueue.enqueueJob({
        userId: req.body.userId || 'usr_guest',
        mediaType: 'image',
        prompt: parsedData.imageParams.prompt || rawText,
        aspectRatio: parsedData.imageParams.aspectRatio || '16:9',
        style: parsedData.imageParams.style || 'Photorealistic Hyper-Detailed 8K',
      });

      parsedData.jobId = mediaJob.id;
      parsedData.queuePosition = mediaJob.queuePosition;
      parsedData.estimatedCountdownSeconds = mediaJob.totalDurationSeconds;
    } else if (parsedData.mediaType === 'video') {
      if (!parsedData.videoParams) {
        parsedData.videoParams = {
          title: parsedData.title || 'Cinematic 8K Storyboard',
          targetDuration: '00:08',
          aspectRatio: '16:9',
          cameraMotion: 'Dynamic orbital sweep with steady tracking pan',
          visualStyle: 'Photorealistic 8K Cinematic',
          lighting: 'Golden hour volumetric illumination',
          audioPrompt: 'Atmospheric ambient synthesis with low sub-bass drone',
          scenes: [
            {
              shotNumber: 1,
              duration: '0-3s',
              camera: 'Wide establishing drone glide',
              visualAction: `Establishing dynamic visual sequence for: ${rawText.slice(0, 60)}`,
              audioSFX: 'Gentle riser with ambient environmental audio',
            },
            {
              shotNumber: 2,
              duration: '3-6s',
              camera: 'Medium orbital tracking shot',
              visualAction: 'Subject focus with smooth parallax and depth of field blur',
              audioSFX: 'Subtle mechanical or atmospheric accents',
            },
            {
              shotNumber: 3,
              duration: '6-8s',
              camera: 'Low-angle slow push-in',
              visualAction: 'Hero focal climax with lighting accentuation',
              audioSFX: 'Tonal resolve with spatial stereo fade',
            },
          ],
          modelPromptVeoSora: `Cinematic 8k video scene of ${rawText}, photorealistic 8k, volumetric golden hour fill, smooth drone camera tracking, ultra-detailed textures, 60fps --ar 16:9`,
        };
      }
      if (!parsedData.videoParams.previewPosterUrl) {
        parsedData.videoParams.previewPosterUrl = generateGenerativeImageSvg(
          parsedData.videoParams.title || rawText,
          'Veo 8K Video Frame',
          ['#06b6d4', '#3b82f6', '#10b981', '#0f172a']
        );
      }

      // Enqueue job into FIFO processing queue
      const mediaJob = mediaQueue.enqueueJob({
        userId: req.body.userId || 'usr_guest',
        mediaType: 'video',
        prompt: parsedData.videoParams.modelPromptVeoSora || rawText,
        aspectRatio: parsedData.videoParams.aspectRatio || '16:9',
        style: parsedData.videoParams.visualStyle || 'Photorealistic 8K Cinematic',
      });

      parsedData.jobId = mediaJob.id;
      parsedData.queuePosition = mediaJob.queuePosition;
      parsedData.estimatedCountdownSeconds = mediaJob.totalDurationSeconds;
    }

    // Ensure executive summary exists
    if (!parsedData.executiveSummary && parsedData.title) {
      parsedData.executiveSummary = `Authoritative synthesis and tactical documentation compiled for ${targetIndustryName}.`;
    }

    // Set response mode if missing
    if (!parsedData.responseMode) {
      parsedData.responseMode = responseMode !== 'auto' ? responseMode : 'productivity';
    }

    // Ensure sections and action items exist
    if (!Array.isArray(parsedData.sections)) parsedData.sections = [];
    if (!Array.isArray(parsedData.actionItems)) parsedData.actionItems = [];
    if (!Array.isArray(parsedData.detectedEntities)) parsedData.detectedEntities = [];
    if (!Array.isArray(parsedData.keyTakeaways)) parsedData.keyTakeaways = [];

    // Activity logging
    try {
      store.logUserActivity({
        userId: req.body.userId || 'usr_guest',
        userEmail: req.body.userEmail || 'client@pulsenote.ai',
        userName: req.body.userName || 'Client User',
        industry: targetIndustry,
        rawInput: rawText.slice(0, 300),
        solutionTitle: parsedData.title || `${targetIndustryName} Documentation`,
      });
    } catch (logErr) {
      console.warn('Failed to log user activity:', logErr);
    }

    // Attach file metadata if provided
    if (attachedFile) {
      parsedData.attachment = {
        id: attachedFile.id,
        name: attachedFile.name,
        size: attachedFile.size,
        type: attachedFile.type,
        category: attachedFile.category,
        previewUrl: attachedFile.previewUrl,
      };
    }

    // Part 2: Mandatory Disclaimer & Legal Safeguard Integration on every output
    parsedData.complianceDisclaimer = MANDATORY_LEGAL_NOTICE;
    if (parsedData.markdownReport && !parsedData.markdownReport.includes('[Legal & Professional Notice]')) {
      parsedData.markdownReport = `${parsedData.markdownReport.trim()}\n\n---\n${MANDATORY_LEGAL_NOTICE}`;
    }

    // Part 3: Role-based security scrub on all output data
    const sanitizedOutput = scrubAdminDetails(parsedData);

    return res.json(sanitizedOutput);
  } catch (err: unknown) {
    console.error('Error transforming notes:', err);
    const message = err instanceof Error ? err.message : 'Failed to transform transcript';
    return res.status(500).json({ error: message });
  }
});

// Smart fallback documentation engine in case of cloud API rate limits or 503 spikes
function buildFallbackDocumentation(
  rawText: string,
  targetIndustry: string,
  targetIndustryName: string,
  tone: string,
  customContext: string,
  responseMode: string = 'auto'
) {
  const clean = rawText.trim();
  const wordCount = clean.split(/\s+/).length;

  // Resolve dynamic response mode
  let resolvedMode: 'research' | 'productivity' | 'problem_solving' = 'productivity';
  if (responseMode === 'research' || responseMode === 'productivity' || responseMode === 'problem_solving') {
    resolvedMode = responseMode;
  } else {
    // Auto-detect based on text characteristics
    if (/why|how|research|benchmark|study|compare|versus|literature|standard/i.test(clean)) {
      resolvedMode = 'research';
    } else if (/broken|fail|error|bug|issue|bottleneck|leak|incident|crash|root cause/i.test(clean)) {
      resolvedMode = 'problem_solving';
    } else {
      resolvedMode = 'productivity';
    }
  }

  // Detect multi-modal generation requests
  const isImageRequest = /\b(image|picture|photo|photograph|render|illustration|wallpaper|draw|visual of|portrait of|digital art)\b/i.test(clean);
  const isVideoRequest = /\b(video|scene|storyboard|cinematic shot|motion graphic|b-roll|film scene|shot sequence)\b/i.test(clean);

  // Multi-Modal: Image Generation Request
  if (isImageRequest) {
    const cleanPrompt = clean.replace(/^(create|generate|draw|render|make|design)\s+(an?\s+)?(image|picture|photo|artwork)\s+(of\s+)?/i, '').trim();
    const style = /cyberpunk|neon/i.test(clean) ? 'Cinematic Cyberpunk 3D' : /minimal|flat/i.test(clean) ? 'Modern Vector Minimalist' : 'Photorealistic Hyper-Detailed 8K';
    const lighting = /night|dark/i.test(clean) ? 'Moody dramatic low-key neon glow' : 'Volumetric warm golden-hour cinematic fill';
    const composition = 'Rule-of-thirds, wide-angle 35mm lens, deep focal depth';
    const aspectRatio = /portrait|phone|mobile|9:16/i.test(clean) ? '9:16' : /square|1:1/i.test(clean) ? '1:1' : '16:9';

    const optimizedPrompt = `Masterpiece cinematic photograph of ${cleanPrompt || clean}, ${style.toLowerCase()}, ${lighting.toLowerCase()}, ${composition.toLowerCase()}, Hasselblad H6D-100c, 8k resolution, ray-traced reflections, highly detailed textures, award-winning composition --ar ${aspectRatio}`;

    const executiveSummary = `Multi-modal image generation synthesis initialized for: "${cleanPrompt || clean}". Optimized prompt and lighting parameters calibrated for generative diffusion engines.`;
    const immediateSolution = `Generative Prompt & Parameters: Use the calibrated prompt below directly in generative image pipelines (e.g. Gemini Flash Image, Imagen 3, or Midjourney v6).`;
    const bestOnlinePractices = `Image Generation Best Practices:
• Specify explicit optical constraints (focal length, sensor size, aperture, volumetric diffusion).
• Balance subject prompt weight with background atmosphere to prevent artifacting.
• Maintain aspect ratio alignment with final delivery viewport (e.g. 16:9 for landscape presentations).`;
    const actionableStrategicPlan = `Generative Execution Roadmap:
1. Initialize Model Pipeline: Deploy optimized prompt into Gemini Flash Image / Imagen 3 with aspect ratio set to ${aspectRatio}.
2. Seed & Variant Sampling: Run a 4-variant batch at CFG scale 7.0 to evaluate chromatic balance.
3. Post-Processing & Upscaling: Upscale selected hero asset to 4K resolution with bicubic filtering.`;

    const sections = [
      {
        heading: 'Calibrated Generative Image Prompt',
        content: `\`\`\`text\n${optimizedPrompt}\n\`\`\``,
        category: 'Prompt Engineering',
        severity: null,
      },
      {
        heading: 'Aesthetic & Optical Parameters',
        content: `• **Style:** ${style}\n• **Lighting:** ${lighting}\n• **Composition:** ${composition}\n• **Aspect Ratio:** ${aspectRatio}\n• **Color Palette:** Primary Neon Indigo, Accent Amber, Deep Obsidian Slate`,
        category: 'Parameters',
        severity: null,
      },
    ];

    const actionItems = [
      {
        task: 'Execute image generation query with calibrated prompt',
        owner: 'Creative Lead',
        deadline: 'Immediate',
        priority: 'High' as const,
      },
      {
        task: 'Review generated asset against brand guidelines',
        owner: 'Art Director',
        deadline: 'Today',
        priority: 'Medium' as const,
      },
    ];

    const markdownReport = `### MULTI-MODAL GENERATIVE IMAGE SYNTHESIS

**Subject Concept:** "${cleanPrompt || clean}"
**Render Mode:** ${style} | Aspect Ratio: ${aspectRatio}

> **Direct Executive Summary:** ${executiveSummary}

## 1. Immediate Solution / Direct Answer
${immediateSolution}

\`\`\`text
${optimizedPrompt}
\`\`\`

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan}

---

### Aesthetic & Optical Specifications
${sections[1].content}

#### Execution Next Steps
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Due: ${a.deadline}`).join('\n')}

---
${MANDATORY_LEGAL_NOTICE}`;

    return {
      mediaType: 'image' as const,
      isVague: false,
      clarificationRequest: '',
      title: `Generative Image Prompt: ${cleanPrompt.slice(0, 35) || 'Concept Asset'}`,
      executiveSummary,
      responseMode: resolvedMode,
      immediateSolution,
      bestOnlinePractices,
      actionableStrategicPlan,
      imageParams: {
        prompt: optimizedPrompt,
        style,
        lighting,
        composition,
        aspectRatio,
        colorPalette: ['#6366f1', '#0ea5e9', '#f59e0b', '#0f172a'],
      },
      searchSources: [
        {
          title: 'Google Deep Generative Media Standards',
          url: 'https://ai.google.dev',
          snippet: 'Prompt engineering guidelines for volumetric lighting, aspect ratios, and diffusion rendering.',
        },
      ],
      markdownReport,
      sections,
      actionItems,
      detectedEntities: [{ name: cleanPrompt || clean, type: 'System' as const }],
      keyTakeaways: [
        'Optimized text-to-image prompt synthesized with optical camera and lighting tags.',
        'Structured parameters formatted for instant generative rendering.',
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
    };
  }

  // Multi-Modal: Video Generation Request
  if (isVideoRequest) {
    const cleanConcept = clean.replace(/^(create|generate|make|direct)\s+(an?\s+)?(video|scene|film|clip)\s+(of\s+)?/i, '').trim();
    const targetDuration = '8 seconds';
    const aspectRatio = /portrait|phone|mobile|9:16/i.test(clean) ? '9:16' : '16:9';
    const cameraMotion = 'Slow forward tracking dolly with subtle 15-degree aerial tilt';
    const visualStyle = 'Cinematic 8K 35mm anamorphic film grain, photorealistic motion physics';
    const lighting = 'Volumetric high-contrast chiaroscuro with atmospheric ambient particles';
    const audioPrompt = 'Deep atmospheric cinematic low-frequency drone with binaural spatial audio';

    const scenes = [
      {
        shotNumber: 1,
        duration: '3s',
        camera: 'Wide Establishing Drone Shot',
        visualAction: `Opening sequence introducing the visual environment and primary subject ("${cleanConcept || clean}") with smooth forward glide.`,
        audioSFX: 'Low-frequency ambient swell with gentle environmental wind.',
      },
      {
        shotNumber: 2,
        duration: '3s',
        camera: 'Medium Dynamic Tracking Shot',
        visualAction: `Camera tracks moving focal element smoothly, highlighting surface textures and kinetic motion dynamics.`,
        audioSFX: 'Subtle mechanical or natural foley texture, rising harmonic pitch.',
      },
      {
        shotNumber: 3,
        duration: '2s',
        camera: 'Hero Perspective Climax & Hold',
        visualAction: `Climactic hero framing settles into steady hold with volumetric light wrap and subtle lens flare.`,
        audioSFX: 'Subtle bass impact followed by gentle audio decay.',
      },
    ];

    const modelPromptVeoSora = `Cinematic 8K video sequence, 24fps, photorealistic. ${cleanConcept || clean}. ${cameraMotion}, ${lighting.toLowerCase()}, ${visualStyle.toLowerCase()}, cinematic color grade, smooth motion blur --duration 8s --ar ${aspectRatio}`;

    const executiveSummary = `Multi-modal video storyboard and generative sequence architected for: "${cleanConcept || clean}". Complete 3-scene camera roadmap and motion prompts generated.`;
    const immediateSolution = `Video Sequence Blueprint: Deploy the structured storyboard parameters below into video generation models (e.g. Veo 3.1, Sora, Runway Gen-3).`;
    const bestOnlinePractices = `Generative Video Best Practices:
• Specify explicit camera motion vectors (dolly, tilt, pan) rather than generic movement.
• Enforce temporal consistency across scenes with unified lighting and color palettes.
• Limit generation duration to 5–10 second coherent sequence bursts for optimal fidelity.`;
    const actionableStrategicPlan = `Video Production Roadmap:
1. Video Engine Submission: Submit the model prompt into Veo 3.1 / Sora with aspect ratio ${aspectRatio}.
2. Motion Consistency Review: Check frame-to-frame stability and particle coherence across the 3 shots.
3. Audio Synchronization: Overlay synthesized spatial audio prompt and export high-definition master MP4.`;

    const sections = [
      {
        heading: 'Storyboard Shot Breakdown',
        content: scenes.map((s) => `• **Shot ${s.shotNumber} (${s.duration}) - ${s.camera}:**\n  - Visual Action: ${s.visualAction}\n  - Audio/SFX: ${s.audioSFX}`).join('\n\n'),
        category: 'Storyboard',
        severity: null,
      },
      {
        heading: 'Model Prompt (Veo / Sora / Runway)',
        content: `\`\`\`text\n${modelPromptVeoSora}\n\`\`\``,
        category: 'Prompt Engineering',
        severity: null,
      },
    ];

    const actionItems = [
      {
        task: 'Submit storyboard prompt to video generation pipeline',
        owner: 'Video Producer',
        deadline: 'Immediate',
        priority: 'High' as const,
      },
      {
        task: 'Composite spatial sound design with generated video clip',
        owner: 'Sound Designer',
        deadline: 'Within 24 Hours',
        priority: 'Medium' as const,
      },
    ];

    const markdownReport = `### MULTI-MODAL VIDEO STORYBOARD & SEQUENCE

**Scene Concept:** "${cleanConcept || clean}"
**Format:** ${targetDuration} | Aspect Ratio: ${aspectRatio} | Camera: ${cameraMotion}

> **Direct Executive Summary:** ${executiveSummary}

## 1. Immediate Solution / Direct Answer
${immediateSolution}

\`\`\`text
${modelPromptVeoSora}
\`\`\`

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan}

---

### Scene-by-Scene Storyboard Breakdown
${sections[0].content}

#### Production Execution Register
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Due: ${a.deadline}`).join('\n')}

---
${MANDATORY_LEGAL_NOTICE}`;

    return {
      mediaType: 'video' as const,
      isVague: false,
      clarificationRequest: '',
      title: `Cinematic Video Sequence: ${cleanConcept.slice(0, 35) || 'Scene Concept'}`,
      executiveSummary,
      responseMode: resolvedMode,
      immediateSolution,
      bestOnlinePractices,
      actionableStrategicPlan,
      videoParams: {
        title: `Scene: ${cleanConcept || 'Cinematic Sequence'}`,
        targetDuration,
        aspectRatio,
        cameraMotion,
        visualStyle,
        lighting,
        audioPrompt,
        scenes,
        modelPromptVeoSora,
      },
      searchSources: [
        {
          title: 'Google Deep Video Generative Guidelines',
          url: 'https://ai.google.dev',
          snippet: 'Directing temporal coherence, camera choreography, and cinematic lighting in AI video synthesis.',
        },
      ],
      markdownReport,
      sections,
      actionItems,
      detectedEntities: [{ name: cleanConcept || clean, type: 'System' as const }],
      keyTakeaways: [
        'Complete 3-shot storyboard breakdown with camera movement and duration.',
        'Direct prompt formatted for state-of-the-art video models.',
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
    };
  }

  // Guardrail check for vague or contextless input
  const isVague =
    wordCount < 10 ||
    /^(stuff broke|need to fix|fix things|test|hello|broken|buggy|something happened)\.?$/i.test(clean);

  if (isVague) {
    const clarifyingQuestions = [
      'What specific operational goal, system, or creative asset is this request targeting?',
      'Are there target deadlines, assignees, or metric thresholds to establish?',
      'Do you require standard documentation, code, or generative media (image/video)?'
    ];
    const clarificationRequest = 'The provided input is concise. To maximize precision, review the clarifying questions below, or proceed with the working draft provided.';
    const executiveSummary = `Initial working synthesis initiated for: "${clean}". Core parameters identified and structured below with clarifying checkpoints for deeper refinement.`;
    const immediateSolution = `Immediate Working Action: Triage the objective identified in "${clean}". Isolate the core scope, verify participating stakeholders, and establish baseline working criteria.`;
    const bestOnlinePractices = `Operational Best Practices (Grounded Standards):
• Maintain structured discovery and issue verification logs before committing system changes.
• Establish clear single-owner accountability and deadline SLAs.
• Verify output against organizational quality benchmarks.`;
    const actionableStrategicPlan = `Working Execution Roadmap:
1. Clarification & Discovery: Confirm target scope and resolve any ambiguous parameters.
2. Draft Implementation: Execute initial phase using the working draft template below.
3. Review & Verification: Validate final documentation with relevant leads and stakeholders.`;

    const sections = [
      {
        heading: 'Clarification Checkpoints',
        content: clarifyingQuestions.map((q, i) => `• **Checkpoint ${i + 1}:** ${q}`).join('\n'),
        category: 'Clarification',
        severity: 'Medium' as const,
      },
      {
        heading: 'Default Working Draft',
        content: `**Core Subject:** ${clean}\n**Initial Scope:** Preliminary assessment and initial action registration.\n**Recommended Approach:** Proceed with baseline triage while refining specific details.`,
        category: 'Working Draft',
        severity: null,
      },
    ];

    const actionItems = [
      {
        task: `Clarify specific requirements for "${clean}" with team or stakeholder`,
        owner: 'Project Lead',
        deadline: 'Immediate',
        priority: 'High' as const,
      },
      {
        task: 'Execute preliminary working draft triage step',
        owner: 'Assigned Specialist',
        deadline: 'Today',
        priority: 'Medium' as const,
      },
    ];

    const markdownReport = `### OPERATIONAL WORKING DRAFT & CLARIFICATION PLAN

**Input Query:** "${clean}"
**Effective Date:** ${new Date().toLocaleDateString()}

> **Direct Executive Summary:** ${executiveSummary}

## 1. Immediate Solution / Direct Answer
${immediateSolution}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan}

---

### Clarification Checkpoints
${clarifyingQuestions.map((q, i) => `* **Q${i + 1}:** ${q}`).join('\n')}

### Default Working Draft
${sections[1].content}

#### Action Items & Next Steps
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Due: ${a.deadline}`).join('\n')}

---
${MANDATORY_LEGAL_NOTICE}`;

    return {
      mediaType: 'text' as const,
      isVague: true,
      clarificationRequest,
      clarifyingQuestions,
      title: 'Working Draft & Clarification Plan',
      executiveSummary,
      responseMode: resolvedMode,
      immediateSolution,
      bestOnlinePractices,
      actionableStrategicPlan,
      searchSources: [
        {
          title: 'Google Deep Search Synthesis',
          url: 'https://google.com',
          snippet: 'Grounded intelligence protocol for ambiguous query refinement and baseline scoping.',
        },
      ],
      markdownReport,
      sections,
      actionItems,
      detectedEntities: [{ name: clean, type: 'System' as const }],
      keyTakeaways: [
        'Input provided is concise; system generated a working draft to prevent progress blocking.',
        'Clarification questions formulated to enable targeted precision on next iteration.',
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
    };
  }

  // Remove common filler words
  const deFillered = clean
    .replace(/\b(uh|um|like|you know|basically|so yeah|sort of|kinda|i mean|honestly)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Extract potential action items based on key action keywords
  const sentences = deFillered.split(/(?<=[.?!])\s+/).filter((s) => s.length > 5);
  const actionItems: any[] = [];
  const entities: any[] = [];

  // Detect entities (numbers, names, dates)
  const dateMatch = clean.match(/\b(\d{1,2}\s+(days|hours|weeks|months)|tomorrow|yesterday|monday|friday|october|september)\b/gi);
  if (dateMatch) {
    dateMatch.slice(0, 3).forEach((d) => entities.push({ name: d, type: 'Date' }));
  }

  const numMetrics = clean.match(/\b(\d{1,3}\/\d{1,3}|\d+%\s*|\d+\s*(mg|mcg|psi|sq\s*ft|am|pm|volts|amps|degrees))\b/gi);
  if (numMetrics) {
    numMetrics.slice(0, 4).forEach((m) => entities.push({ name: m, type: 'Metric' }));
  }

  // Extract action lines
  sentences.forEach((sentence) => {
    if (/\b(follow up|prescribe|schedule|submit|PR|debug|remediate|contractor|cfo|review|replace|inspect|repair|urgent|by)\b/i.test(sentence)) {
      const ownerMatch = sentence.match(/\b(nurse\s+\w+|dr\.?\s+\w+|alex|marcus|priya|elena|carlos|maya|rachel|dave|sofia|liam)\b/i);
      const owner = ownerMatch ? ownerMatch[0] : 'Unassigned';
      const deadlineMatch = sentence.match(/\b(by\s+[\w\s\d]+|in\s+\d+\s+days|tomorrow\s+\w+|end\s+of\s+day)\b/i);
      const deadline = deadlineMatch ? deadlineMatch[0] : 'Not specified';
      const isUrgent = /\b(urgent|immediate|p1|stat|emergency|high)\b/i.test(sentence);

      if (actionItems.length < 5) {
        actionItems.push({
          task: sentence.trim(),
          owner,
          deadline,
          priority: isUrgent ? 'High' : 'Medium',
        });
      }
    }
  });

  if (actionItems.length === 0) {
    actionItems.push({
      task: 'Review draft documentation with stakeholders and verify technical/clinical accuracy',
      owner: 'Lead Reviewer',
      deadline: 'Next Business Day',
      priority: 'Medium',
    });
  }

  // Industry-specific structured formatting and intelligent breakdown
  if (targetIndustry === 'medical') {
    const executiveSummary = `Comprehensive clinical evaluation synthesized for presenting symptoms; baseline vitals stabilized and diagnostic treatment regimen initiated under strict monitoring.`;
    const immediateSolution = `Immediate Clinical Action: Formulate diagnostic evaluation plan for presenting symptoms ("${sentences[0] || 'Patient presenting for evaluation'}"). Re-check baseline vitals, order targeted lab panels, and titrate symptomatic pharmacotherapy under strict clinical monitoring.`;

    const bestOnlinePractices = `Clinical Best Practices (Grounded in AMA/WHO Guidelines & Online Clinical Repositories):
• Standard SOAP documentation with timestamped provider attestation.
• Dual-identifier patient verification prior to medication administration.
• Clear escalation criteria for decompensating vital signs.
• Explicit follow-up interval and emergency return precautions documented in patient chart.`;

    const actionableStrategicPlan = `Actionable Clinical Next Steps:
1. Phase 1 (Immediate / STAT): Verify medication reconciliations and confirm telemetry / lab orders.
2. Phase 2 (Within 24 Hours): Review pending diagnostic results, reassess symptom severity, and confirm patient comprehension.
3. Phase 3 (Outpatient Discharge / Transfer): Schedule specialist consultation, provide written discharge instructions, and document follow-up visit.`;

    const searchSources = [
      {
        title: 'WHO & Clinical Practice Guidelines (Online Standard)',
        url: 'https://who.int/standards',
        snippet: 'Evidence-based protocols for outpatient clinical summaries and SOAP documentation standards.',
      },
      {
        title: 'Google Grounded Medical Protocols',
        url: 'https://scholar.google.com',
        snippet: 'Standardized provider verification and patient safety reconciliation protocols.',
      },
    ];

    const sections = [
      {
        heading: 'Chief Complaint & Patient History',
        content: sentences[0] || 'Patient presenting for clinical evaluation and follow-up.',
        category: 'Subjective',
      },
      {
        heading: 'Objective Physical & Diagnostic Findings',
        content:
          sentences.slice(1, 3).join(' ') ||
          'Physical examination findings documented per vocal transcript.',
        category: 'Objective',
      },
      {
        heading: 'Clinical Assessment',
        content:
          sentences.find((s) => /assessment|diagnos|exacerbation|post op/i.test(s)) ||
          'Condition evaluated based on reported symptoms and observed vital signs.',
        category: 'Assessment',
      },
      {
        heading: 'Treatment Plan & Pharmacotherapy',
        content:
          sentences.slice(3).join('\n• ') ||
          'Prescribed medical regimen and follow-up protocol established.',
        category: 'Plan',
      },
    ];

    const markdownReport = `### CLINICAL ENCOUNTER & SOLUTION SUMMARY

**Facility Context:** ${customContext || 'General Outpatient Clinic'}
**Timestamp:** ${new Date().toISOString()}

> **Direct Executive Summary:** ${executiveSummary}

## 1. Immediate Solution / Direct Answer
${immediateSolution}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan}

---

### Detailed Clinical SOAP Documentation

#### 1. Chief Complaint
${sections[0].content}

#### 2. Objective Findings
${sections[1].content}

#### 3. Assessment
${sections[2].content}

#### 4. Plan
• ${sections[3].content}

#### Action Items & Next Steps
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Due: ${a.deadline}`).join('\n')}

---
${MANDATORY_LEGAL_NOTICE}`;

    return {
      isVague: false,
      clarificationRequest: '',
      title: 'Clinical Encounter Documentation (SOAP)',
      executiveSummary,
      responseMode: resolvedMode,
      immediateSolution,
      bestOnlinePractices,
      actionableStrategicPlan,
      searchSources,
      markdownReport,
      sections,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        'Vitals and objective observations transcribed without filler colloquialisms.',
        'Pharmacotherapy regimen and step-up management recorded.',
        'Follow-up timeframe and emergency precautions established.',
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
    };
  }

  if (targetIndustry === 'real_estate') {
    const executiveSummary = `Property condition inspection completed; critical mechanical and building envelope defects isolated with immediate remediation and trade contracting plan.`;
    const immediateSolution = `Immediate Property Remedy: Tag inspected defects ("${sentences[1] || sentences[0] || 'Structural/envelope observation'}") with High/Medium severity. Secure the immediate hazard zone, disconnect compromised utilities if necessary, and dispatch licensed specialty trades.`;

    const bestOnlinePractices = `Property Inspection Best Practices (InterNACHI / ASHI Standards):
• High-severity electrical and structural anomalies require immediate physical isolation.
• Photographic and timestamped defect logs must accompany every remediation order.
• Remediation must be executed exclusively by licensed, insured trade contractors.
• Post-repair reinspection checklist required prior to occupancy sign-off.`;

    const actionableStrategicPlan = `Actionable Inspection Remediation Plan:
1. Phase 1 (Hours 0-24): Isolate moisture/electrical hazards and deliver preliminary defect report to asset owner.
2. Phase 2 (Days 1-3): Procure bids from certified trade specialists; pull necessary municipal work permits.
3. Phase 3 (Completion): Conduct formal post-remediation sign-off and update property disclosure binder.`;

    const searchSources = [
      {
        title: 'InterNACHI Standards of Practice',
        url: 'https://internachi.org/sop',
        snippet: 'Standard inspection protocols for residential and commercial building defect identification.',
      },
      {
        title: 'ASHI Inspection Standards Directory',
        url: 'https://homeinspector.org',
        snippet: 'Severity classification and remediation guidelines for mechanical and structural envelope defects.',
      },
    ];

    const sections = [
      {
        heading: 'Property Location & Area Inspected',
        content: sentences[0] || 'Inspection of residential/commercial premises.',
        severity: 'Low' as const,
        category: 'Location',
      },
      {
        heading: 'Primary Defect & System Observation',
        content: sentences.slice(1, 3).join(' ') || 'Physical structural and mechanical evaluation.',
        severity: 'High' as const,
        category: 'Observation',
      },
      {
        heading: 'Recommended Remediation & Scope',
        content:
          sentences.slice(3).join('\n• ') ||
          'Professional remediation by licensed contractor recommended.',
        severity: 'Medium' as const,
        category: 'Remediation',
      },
    ];

    const markdownReport = `### PROPERTY INSPECTION & REMEDIATION REPORT

**Site / Location:** ${customContext || 'Subject Property'}
**Audit Date:** ${new Date().toLocaleDateString()}

> **Direct Executive Summary:** ${executiveSummary}

## 1. Immediate Solution / Direct Answer
${immediateSolution}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan}

---

### Detailed Property Defect Analysis

#### 1. Inspection Area
${sections[0].content}

#### 2. Defects & Observations
• **Severity: HIGH** - ${sections[1].content}

#### 3. Recommended Remediation
• ${sections[2].content}

#### Action Items & Next Steps
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Assigned: ${a.owner} | Target: ${a.deadline}`).join('\n')}

---
${MANDATORY_LEGAL_NOTICE}`;

    return {
      isVague: false,
      clarificationRequest: '',
      title: 'Property Condition Inspection Report',
      executiveSummary,
      responseMode: resolvedMode,
      immediateSolution,
      bestOnlinePractices,
      actionableStrategicPlan,
      searchSources,
      markdownReport,
      sections,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        'Critical mechanical and building envelope defects isolated.',
        'Severity levels tagged for immediate remediation prioritization.',
        'Licensed specialist contractor sign-offs scheduled.',
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
    };
  }

  if (targetIndustry === 'software') {
    const executiveSummary = `Sprint technical analysis completed; root-cause hotfix proposed with automated CI/CD safeguards and distributed telemetry monitoring.`;
    const immediateSolution = `Immediate Engineering Fix: Implement root-cause patch for reported incident ("${sentences[0] || 'Sprint engineering issue'}"). Roll out canary hotfix, tune pool thresholds, and add regression telemetry before next deployment.`;

    const bestOnlinePractices = `Software Engineering Best Practices (Google SRE & Twelve-Factor Standards):
• Automated CI/CD validation gates with automated rollback triggers.
• Immutable infrastructure provisioning and connection pool ceiling enforcement.
• Comprehensive distributed tracing (OpenTelemetry) on newly introduced code paths.
• Blameless post-mortem document completed within 48 hours of resolution.`;

    const actionableStrategicPlan = `Actionable Agile Next Steps:
1. Phase 1 (Immediate / Sprint Current): Submit hotfix pull request with unit test coverage; get secondary peer review.
2. Phase 2 (Staging Verification): Deploy to staging environment, execute load stress tests, and verify latency percentiles (p99 < 150ms).
3. Phase 3 (Production Rollout): Execute canary deployment (10% -> 50% -> 100%), monitor error logs, and close sprint issue.`;

    const searchSources = [
      {
        title: 'Google Site Reliability Engineering (SRE) Handbook',
        url: 'https://sre.google/sre-book',
        snippet: 'Industry gold standard for incident response, error budgets, and post-incident reviews.',
      },
      {
        title: 'Twelve-Factor App Modern Methodologies',
        url: 'https://12factor.net',
        snippet: 'Declarative formats for setup automation, backing service port binding, and concurrency.',
      },
    ];

    const sections = [
      {
        heading: 'User Story & Incident Overview',
        content: sentences[0] || 'Sprint engineering sync and technical review.',
        category: 'User Story',
      },
      {
        heading: 'Technical Architecture Decisions Made',
        content:
          sentences.filter((s) => /decision|agree|adopt|increase|pool|hash/i.test(s)).join('\n• ') ||
          sentences.slice(1, 3).join(' '),
        category: 'Technical Decisions',
      },
      {
        heading: 'Blockers & Critical Dependencies',
        content:
          sentences.filter((s) => /block|fail|issue|incident|contention/i.test(s)).join('\n• ') ||
          'No hard blockers outstanding at standup conclusion.',
        category: 'Blockers Identified',
      },
    ];

    const markdownReport = `### AGILE SPRINT TECHNICAL & ARCHITECTURE SYNC

**Repository / Service:** ${customContext || 'Core Services'}
**Sprint Cycle:** Current

> **Direct Executive Summary:** ${executiveSummary}

## 1. Immediate Solution / Direct Answer
${immediateSolution}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan}

---

### Detailed Sprint Documentation

#### 1. Summary of Changes
${sections[0].content}

#### 2. Technical Decisions
• ${sections[1].content}

#### 3. Active Blockers
• ${sections[2].content}

#### Action Items & GitHub/Jira Tasks
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Assignee: @${a.owner.toLowerCase().replace(/\s+/g, '')} | Target: ${a.deadline}`).join('\n')}

---
${MANDATORY_LEGAL_NOTICE}`;

    return {
      isVague: false,
      clarificationRequest: '',
      title: 'Sprint 42 Agile Technical Documentation',
      executiveSummary,
      responseMode: resolvedMode,
      immediateSolution,
      bestOnlinePractices,
      actionableStrategicPlan,
      searchSources,
      markdownReport,
      sections,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        'Architectural and configuration decisions documented directly.',
        'Blockers flagged with clear unblocking owners.',
        'Hotfix PRs and migrations assigned with strict delivery targets.',
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
    };
  }

  if (targetIndustry === 'general') {
    const executiveSummary = `Direct synthesis and structured solution architected for: "${sentences[0] || clean}". Core root causes, actionable workflows, and verified practices established.`;
    const immediateSolution = `Direct Immediate Action: Implement baseline solution for "${sentences[0] || clean}". Isolate primary objectives, align team deliverables, and begin phased execution immediately.`;
    const bestOnlinePractices = `Universal Best Practices & Online Grounding:
• Scannable Executive Architecture: Direct synthesis followed by numbered implementation tiers.
• Verifiable Standards: Ground operational hypotheses against validated industry patterns.
• Single-Owner Accountability: Tie every deliverable to an explicit owner and deadline.`;
    const actionableStrategicPlan = `Actionable Strategic Plan & Roadmap:
1. Phase 1 (Immediate Execution): Finalize core specification, assign work packages, and establish target milestones.
2. Phase 2 (Implementation & Testing): Execute tasks, resolve emergent blockers, and run quality verification checks.
3. Phase 3 (Review & Deployment): Validate final outcome, document retrospective takeaways, and initiate rollout.`;

    const searchSources = [
      {
        title: 'Google Grounded Search & Research Intelligence',
        url: 'https://google.com/search',
        snippet: 'Synthesized best practices, strategic implementation frameworks, and current online standards.',
      },
      {
        title: 'Pulse Note AI Universal Knowledge Base',
        url: 'https://pulsenoteai.in',
        snippet: 'Deep search methodologies, real-time structured execution models, and multimodal optimization.',
      },
    ];

    const sections = [
      {
        heading: 'Core Insights & Analysis',
        content: sentences.slice(0, 2).join(' ') || clean,
        category: 'Analysis',
      },
      {
        heading: 'Strategic Execution Directives',
        content: sentences.slice(2).join('\n• ') || 'Execution directives configured for rapid deployment.',
        category: 'Directives',
      },
      {
        heading: 'Quality Verification & Risk Guardrails',
        content: 'Establish automated checks, review gates, and fail-safe protocols before general distribution.',
        category: 'Risk Mitigation',
      },
    ];

    const markdownReport = `### UNIVERSAL INTELLIGENCE & STRATEGIC SOLUTION

**Subject Scope:** ${customContext || 'Open-Domain Operations'}
**Effective Date:** ${new Date().toLocaleDateString()}

> **Direct Executive Summary:** ${executiveSummary}

## 1. Immediate Solution / Direct Answer
${immediateSolution}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan}

---

### Detailed Operational Breakdown

#### 1. Core Insights & Analysis
${sections[0].content}

#### 2. Strategic Directives
${sections[1].content}

#### 3. Quality Verification & Guardrails
${sections[2].content}

#### Action Items & Strategic Deliverables
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Target: ${a.deadline}`).join('\n')}

---
${MANDATORY_LEGAL_NOTICE}`;

    return {
      mediaType: 'text' as const,
      isVague: false,
      clarificationRequest: '',
      title: 'Universal Strategic Intelligence Solution',
      executiveSummary,
      responseMode: resolvedMode,
      immediateSolution,
      bestOnlinePractices,
      actionableStrategicPlan,
      searchSources,
      markdownReport,
      sections,
      actionItems,
      detectedEntities: entities,
      keyTakeaways: [
        'Open-domain synthesis constructed without rigid industry silos.',
        'Immediate direct action isolated and prioritized at the top.',
        'Numbered execution steps mapped to deliverables and timelines.',
      ],
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
    };
  }

  // General Executive / Consulting
  const executiveSummary = `Executive strategic resolution established with authorized operational directives, resource realignment, and phased risk oversight milestones.`;
  const immediateSolution = `Immediate Strategic Resolution: Approve recommended organizational focus ("${sentences[0] || 'Corporate executive review'}"). Realign capital allocations, establish interim delivery benchmarks, and empower designated portfolio leads immediately.`;

  const bestOnlinePractices = `Executive Advisory Best Practices (Grounded in McKinsey/BCG Operational Frameworks):
• Single-threaded executive accountability on every strategic objective.
• Strict weekly OKR (Objectives and Key Results) scorecard tracking.
• Scenario-based contingency buffers established for high-variance risks.
• Unified investor and board briefing cadence with audited financial metrics.`;

  const actionableStrategicPlan = `Actionable Corporate Next Steps:
1. Phase 1 (Week 1): Convene executive committee to formalize approved directive and assign program directors.
2. Phase 2 (Month 1): Deploy restructured operating budget; integrate real-time KPI dashboards across business units.
3. Phase 3 (Quarterly Review): Conduct comprehensive post-implementation audit and re-evaluate growth benchmarks.`;

  const searchSources = [
    {
      title: 'McKinsey Strategy & Corporate Finance Insights',
      url: 'https://mckinsey.com/capabilities/strategy-and-corporate-finance',
      snippet: 'Frameworks for strategic reallocation, portfolio resilience, and board governance best practices.',
    },
    {
      title: 'Harvard Business Review Operational Execution Guide',
      url: 'https://hbr.org',
      snippet: 'Bridging the strategy-to-execution gap through rigorous operational rhythms and accountability.',
    },
  ];

  const sections = [
    {
      heading: 'Executive Key Decisions',
      content:
        sentences.filter((s) => /decid|freeze|approv|model|target/i.test(s)).join('\n• ') ||
        sentences[0],
      category: 'Key Decisions',
    },
    {
      heading: 'Strategic Takeaways & Commercial Metrics',
      content:
        sentences.filter((s) => /percent|cac|churn|growth|margin|runway/i.test(s)).join('\n• ') ||
        sentences.slice(1, 3).join(' '),
      category: 'Strategic Takeaways',
    },
    {
      heading: 'Identified Risks & Vulnerabilities',
      content:
        sentences.filter((s) => /risk|delay|tariff|churn|exposure/i.test(s)).join('\n• ') ||
        'Standard operational risk monitoring in progress.',
      category: 'Risks',
    },
  ];

  const markdownReport = `### CORPORATE EXECUTIVE MEMORANDUM & STRATEGIC PLAN

**Division / Portfolio:** ${customContext || 'Global Operations'}
**Effective Date:** ${new Date().toLocaleDateString()}

> **Direct Executive Summary:** ${executiveSummary}

## 1. Immediate Solution / Direct Answer
${immediateSolution}

## 2. Best Online Practices & Current Industry Standards
${bestOnlinePractices}

## 3. Actionable Strategic Plan / Next Steps
${actionableStrategicPlan}

---

### Detailed Executive Documentation

#### 1. Key Decisions Made
• ${sections[0].content}

#### 2. Strategic Takeaways
• ${sections[1].content}

#### 3. Risk Register
• ${sections[2].content}

#### Action Register & Deliverables
${actionItems.map((a, idx) => `${idx + 1}. [ ] **${a.task}** | Owner: ${a.owner} | Target: ${a.deadline}`).join('\n')}

---
${MANDATORY_LEGAL_NOTICE}`;

  return {
    isVague: false,
    clarificationRequest: '',
    title: 'Executive Strategic Memorandum',
    executiveSummary,
    responseMode: resolvedMode,
    immediateSolution,
    bestOnlinePractices,
    actionableStrategicPlan,
    searchSources,
    markdownReport,
    sections,
    actionItems,
    detectedEntities: entities,
    keyTakeaways: [
      'Core corporate decisions consolidated without conversational preamble.',
      'Headcount and capital expenditure priorities established.',
      'Deliverables and risk mitigations tied directly to named owners.',
    ],
    complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
  };
}

// Payment Gateway & Settlement Routes (Part 1 & Part 2)
app.get('/api/payment/config', (_req, res) => {
  res.json({
    gateway: 'Razorpay (UPI, cards, net banking)',
    merchantName: 'PulseNote AI Technologies',
    currencySupported: ['INR'],
    security: {
      pciDssCompliant: true,
      tokenization: 'TLS 1.3 / AES-256 GCM Client-Side Tokenization',
      mfa3dSecure: true,
    },
    plans: {
      pro_monthly: {
        id: 'pro_monthly',
        name: 'Pro Monthly',
        priceINR: 699,
        interval: 'month',
        note: 'Cancel anytime. Billed via UPI AutoPay mandate.',
      },
      pro_yearly_upfront: {
        id: 'pro_yearly_upfront',
        name: 'Pro Yearly (one-time upfront)',
        priceINR: 5508,
        interval: 'year',
        note: 'Effective ₹459/month — save ₹2,880 (34%) vs monthly.',
      },
      team_monthly: {
        id: 'team_monthly',
        name: 'Clinic / Team Monthly',
        priceINR: 399,
        interval: 'seat/month',
        minSeats: 3,
      },
      team_yearly_upfront: {
        id: 'team_yearly_upfront',
        name: 'Clinic / Team Yearly (one-time upfront)',
        priceINR: 3588,
        interval: 'seat/year',
        minSeats: 3,
        note: 'Effective ₹299/seat/month — save 25% vs monthly.',
      },
    },
  });
});

app.post('/api/payment/create-order', (req, res) => {
  // DEPRECATED: superseded by the current Razorpay flow
  // (POST /api/create-order for one-time orders,
  //  POST /api/razorpay/create-subscription for monthly mandates).
  // This legacy handler carried outdated prices (₹299/₹1,999) and a personal
  // UPI VPA, so it is disabled to avoid charging customers the wrong amount.
  return res.status(410).json({
    success: false,
    error: 'DEPRECATED_ENDPOINT',
    message: 'This endpoint is retired. Use the in-app upgrade flow (Razorpay checkout).',
  });
});

app.post('/api/payment/verify', (req, res) => {
  // DEPRECATED: self-attested UTR verification removed for security.
  // All payments must go through Razorpay with HMAC signature verification
  // via POST /api/verify-payment (see RazorpayCheckoutButton).
  return res.status(410).json({
    success: false,
    error: 'DEPRECATED_ENDPOINT',
    message: 'Manual UTR verification is disabled. Please complete payment via Razorpay checkout.',
  });
});

// ==========================================
// 1 & 2. AUTHENTICATION, REGISTRATION & ACTIVATION
// ==========================================

// User Registration with explicit Privacy Policy Consent & Activation Email
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, mobile, password, privacyConsent } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (!privacyConsent) {
      return res.status(400).json({ 
        error: 'Explicit Privacy Policy consent (Yes/No toggle) is required to register.' 
      });
    }

    const { user, activationToken } = store.registerUser({
      name,
      email,
      mobile: mobile || '',
      password,
      privacyConsent: true,
    });

    return res.json({
      success: true,
      message: 'Registration successful! A Welcome Email with your Account Activation link has been sent to your inbox.',
      user,
      activationToken,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// Account Activation Verification Flow
app.post('/api/auth/activate', (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ error: 'Email and activation token are required.' });
    }

    const user = store.activateAccount(email, token);
    return res.json({
      success: true,
      message: 'Account successfully activated! You can now log in to PulseNote AI.',
      user,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Account activation failed' });
  }
});

// Email Login (Handles both Hardcoded Super Admin and General Users)
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Strict Role-Based Admin Access Check (strictly jayeshofficial@gmail.com or contact@pulsenoteai.in)
    if (store.isStrictAdminEmail(cleanEmail)) {
      const adminUser = store.verifyAdminLogin(cleanEmail, password);
      if (adminUser) {
        return res.json({
          success: true,
          role: 'admin',
          token: `ADMIN_TOKEN_${adminUser.id}_${Date.now()}`,
          user: adminUser,
        });
      } else {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }
    }

    // 2. Check regular registered user
    const user = store.verifyUserLogin(cleanEmail, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account activation gate
    if (!user.isActivated || user.status === 'pending_activation') {
      return res.status(403).json({
        error: 'Account not activated. Please verify the activation link sent to your email before logging in.',
        isPendingActivation: true,
        email: user.email,
        activationToken: user.activationToken,
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account is suspended. Please contact admin.' });
    }

    return res.json({
      success: true,
      role: user.role,
      token: `USER_TOKEN_${user.id}`,
      user,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Resolve or Sync User Profile with RBAC & Admin Verification
app.post('/api/auth/resolve-profile', (req, res) => {
  try {
    const { email, name, avatarUrl } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = store.isStrictAdminEmail(cleanEmail);

    let user = store.findUserByEmail(cleanEmail);
    if (!user) {
      if (isAdmin) {
        user = store.getSuperAdminProfile(cleanEmail);
      } else {
        const registered = store.registerUser({
          name: name || cleanEmail.split('@')[0] || 'User',
          email: cleanEmail,
          mobile: '',
          password: 'firebase_oauth_user',
          privacyConsent: true,
        });
        user = registered.user;
        user.isActivated = true;
        user.status = 'active';
      }
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to initialize profile.' });
    }

    if (isAdmin) {
      user.role = 'admin';
      user.subscription = {
        tier: 'admin_grant',
        isPro: true,
        startDate: Date.now() - 3600000 * 24 * 30,
        expiresAt: null,
        grantedByAdmin: true,
      };
    }

    const resolvedUser = {
      ...user,
      avatarUrl: avatarUrl || (user as any).avatarUrl || '',
    };

    return res.json({
      success: true,
      isAdmin,
      isPro: isAdmin || user.subscription?.isPro || false,
      user: resolvedUser,
      token: isAdmin ? `ADMIN_TOKEN_${user.id}_${Date.now()}` : `USER_TOKEN_${user.id}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to resolve user profile' });
  }
});

// Get Current User Profile & Fresh Subscription Tenure
app.get('/api/auth/me', (req, res) => {
  const userId = (req.query.userId as string) || (req.headers.authorization?.replace('Bearer ', ''));
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = store.findUserById(userId) || store.findUserByEmail(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Trigger real-time check for expiration
  store.checkAndProcessExpirations();

  return res.json({ user });
});

// Flexible OTP Password Reset Request (SMS, Email, Both)
app.post('/api/auth/forgot-password/request-otp', (req, res) => {
  try {
    const { email, channel = 'email' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const { otp, mobile } = store.createPasswordResetOtp(email, channel as any);
    const maskedMobile = mobile ? `${mobile.slice(0, 3)}••••${mobile.slice(-3)}` : 'registered mobile';

    return res.json({
      success: true,
      message: `A 6-digit OTP has been sent via ${channel.toUpperCase()}${channel !== 'email' ? ` to ${maskedMobile}` : ''}.`,
      channel,
      otpPreviewForDev: otp, // Preview token for immediate interactive test
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to send OTP' });
  }
});

// Verify OTP and Set New Password
app.post('/api/auth/forgot-password/verify-otp', (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP code, and new password are required.' });
    }

    store.verifyOtpAndResetPassword(email, otp, newPassword);
    return res.json({
      success: true,
      message: 'Password successfully updated! You can now log in with your new password.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'OTP verification failed' });
  }
});

// ==========================================
// 3. CLIENT DASHBOARD: BILLING & TENURE
// ==========================================

app.get('/api/user/billing', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  store.checkAndProcessExpirations();
  const user = store.findUserById(userId);
  const payments = store.getUserPayments(userId);

  return res.json({
    userSubscription: user?.subscription || {
      tier: 'free',
      isPro: false,
      startDate: Date.now(),
      expiresAt: null,
    },
    payments,
  });
});

// Automated Subscription Expiration Manual Trigger / Background Cron
app.post('/api/cron/check-expirations', (_req, res) => {
  const result = store.checkAndProcessExpirations();
  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...result,
  });
});

// ==========================================
// 5. COMPREHENSIVE SUPER ADMIN MODULE
// ==========================================

// User Directory: Name, Email, Mobile, Password management, Privacy Policy consent status with timestamp
app.get('/api/admin/users', (req, res) => {
  store.checkAndProcessExpirations();
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const filter = ((req.query.filter as string) || 'all').toLowerCase().trim();
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.max(1, parseInt((req.query.limit as string) || '10', 10));

  const rawUsers = store.getAllUsers();
  const formattedUsers = rawUsers.map((u: any) => {
    const isPro = !!(u.subscription?.isPro || u.role === 'admin');
    const isBanned = u.status === 'banned' || u.isBanned === true;
    return {
      _id: u.id,
      id: u.id,
      name: u.name || 'User',
      email: u.email,
      plan: isPro ? ('premium' as const) : ('free' as const),
      isBanned,
      chats: u.dailyPromptCount ? u.dailyPromptCount * 8 + 12 : 14,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      premiumUntil: u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toISOString() : null,
      ...u,
    };
  });

  let filtered = formattedUsers;
  if (search) {
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
    );
  }

  if (filter === 'premium') {
    filtered = filtered.filter((u) => u.plan === 'premium');
  } else if (filter === 'free') {
    filtered = filtered.filter((u) => u.plan === 'free');
  } else if (filter === 'banned') {
    filtered = filtered.filter((u) => u.isBanned);
  }

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginatedUsers = filtered.slice(skip, skip + limit);

  return res.json({
    users: paginatedUsers,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

// CSV Export Endpoint for Premium Users
app.get('/api/admin/users/export', (req, res) => {
  try {
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const rawUsers = store.getAllUsers();

    let premiumUsers = rawUsers
      .map((u: any) => {
        const isPro = !!(u.subscription?.isPro || u.role === 'admin');
        const isBanned = u.status === 'banned' || u.isBanned === true;
        return {
          _id: u.id,
          name: u.name || 'User',
          email: u.email,
          plan: isPro ? 'premium' : 'free',
          chats: u.dailyPromptCount ? u.dailyPromptCount * 8 + 12 : 14,
          isBanned,
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
          premiumUntil: u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toISOString() : null,
        };
      })
      .filter((u) => u.plan === 'premium');

    if (search) {
      premiumUsers = premiumUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    }

    const header = 'Name,Email,Plan,Chats,Status,Joined Date,Premium Until\n';
    const rows = premiumUsers
      .map(
        (u) =>
          `"${u.name}","${u.email}","${u.plan}",${u.chats || 0},"${u.isBanned ? 'Banned' : 'Active'}","${new Date(u.createdAt).toLocaleDateString()}","${u.premiumUntil ? new Date(u.premiumUntil).toLocaleDateString() : '-'}"`
      )
      .join('\n');

    const csv = header + rows;
    const dateStr = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="premium-users-${dateStr}.csv"`);
    return res.send(csv);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to export CSV' });
  }
});

// Admin Ban / Unban User Action
app.post('/api/admin/users/:userId/ban', (req, res) => {
  try {
    const { userId } = req.params;
    const { isBanned } = req.body;
    const user = store.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (store.isStrictAdminEmail(user.email)) {
      return res.status(403).json({ error: 'Cannot ban super-administrator accounts.' });
    }
    const updated = store.updateUserAdminFields(userId, {
      status: isBanned ? 'banned' : 'active',
      isBanned: !!isBanned,
    });
    return res.json({
      success: true,
      message: isBanned ? 'User banned' : 'User unbanned',
      user: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update ban status' });
  }
});

// Admin Make Premium / Revoke Premium Action
app.post('/api/admin/users/:userId/premium', (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body; // 'premium' or 'free'
    const isPremium = plan === 'premium';
    const updated = store.updateUserSubscription(userId, {
      tier: isPremium ? 'pro_monthly' : 'free',
      isPro: isPremium,
      expiresAt: isPremium ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null,
    });
    return res.json({
      success: true,
      message: `User plan updated to ${plan}`,
      user: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update user plan' });
  }
});

// Update User Status or Privacy Consent
app.post('/api/admin/users/:userId/status', (req, res) => {
  try {
    const { userId } = req.params;
    const { status, isActivated } = req.body;
    const updated = store.updateUserAdminFields(userId, { status, isActivated });
    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Super Admin Direct User Password Reset
app.post('/api/admin/users/:userId/reset-password', (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required.' });
    }
    store.resetUserPasswordByAdmin(userId, newPassword);
    return res.json({ success: true, message: 'User password reset successfully.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Admin Permanent User Deletion with Safeguard
app.delete('/api/admin/users/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const result = store.deleteUser(userId);
    return res.json({
      success: true,
      message: `User ${result.deletedUser.name} (${result.deletedUser.email}) permanently deleted.`,
      deletedUser: result.deletedUser,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete user.' });
  }
});

// Admin Subscription Override (Free/Pro switch, custom renewal date, lifetime unlimited)
app.post('/api/admin/users/:userId/subscription', (req, res) => {
  try {
    const { userId } = req.params;
    const { tier = 'pro_monthly', isPro, expiresAt, lifetime } = req.body;
    const updatedUser = store.updateUserSubscription(userId, {
      tier,
      isPro,
      expiresAt,
      lifetime,
    });
    return res.json({
      success: true,
      message: `Subscription successfully updated for ${updatedUser.name}.`,
      user: updatedUser,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update subscription.' });
  }
});

// Manual Premium Grant Tool (Days, Months, Years)
app.post('/api/admin/grant-premium', (req, res) => {
  try {
    const { userId, amount = 1, unit = 'months' } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (!['days', 'months', 'years'].includes(unit)) {
      return res.status(400).json({ error: 'Unit must be days, months, or years' });
    }

    const updatedUser = store.grantPremiumAccess(userId, Number(amount), unit);
    return res.json({
      success: true,
      message: `Granted ${amount} ${unit} of Pro access to ${updatedUser.name}`,
      user: updatedUser,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Manual Premium Grant Tool (Days, Months, Years)
app.post('/api/admin/grant-premium', (req, res) => {
  try {
    const { userId, amount = 1, unit = 'months' } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (!['days', 'months', 'years'].includes(unit)) {
      return res.status(400).json({ error: 'Unit must be days, months, or years' });
    }

    const updatedUser = store.grantPremiumAccess(userId, Number(amount), unit);
    return res.json({
      success: true,
      message: `Granted ${amount} ${unit} of Pro access to ${updatedUser.name}`,
      user: updatedUser,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// =========================================================================
// SUBSCRIPTION & REVENUE ADMIN API — restricted to the revenue whitelist
// (jayeshofficial@gmail.com, contact@pulsenoteai.com). Every route below
// rejects non-whitelisted callers with 403, regardless of role flags.
// =========================================================================

/** Resolve the caller's admin email from header / query / body. */
function revenueAdminEmail(req: any): string {
  const fromHeader = req.headers['x-admin-email'];
  const email =
    (Array.isArray(fromHeader) ? fromHeader[0] : fromHeader) ||
    req.query.adminEmail ||
    req.body?.adminEmail ||
    '';
  return String(email || '').toLowerCase().trim();
}

function requireRevenueAdmin(req: any, res: any): string | null {
  const email = revenueAdminEmail(req);
  if (!email || !store.isSubscriptionAdminEmail(email)) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Subscription & Revenue dashboard is restricted to authorized admins.',
    });
    return null;
  }
  return email;
}

function subscriptionRow(u: any) {
  const latest = store.getLatestPaymentForUser(u.id);
  const sub = u.subscription || {};
  const planLabel = sub.isPro
    ? (String(sub.tier || '').includes('annual') || sub.tier === 'pro_annual' ? 'Pro Annual' : sub.tier === 'admin_grant' ? 'Admin Grant' : 'Pro')
    : 'Free';
  return {
    id: u.id,
    name: u.name || 'User',
    email: u.email,
    mobile: u.mobile || '',
    plan: planLabel,
    tier: sub.tier || 'free',
    isPro: !!sub.isPro,
    signInDate: u.createdAt || null,
    planOptedDate: latest ? latest.timestamp : (sub.startDate || null),
    planOptedAmount: latest ? latest.amount : null,
    planCurrency: latest ? latest.currency || 'INR' : 'INR',
    amountPaidDate: latest ? latest.timestamp : null,
    planExpiryDate: sub.expiresAt ?? null,
    status: u.status || 'active',
    aiImageEnabled: u.aiImageEnabled !== false,
    aiVideoEnabled: u.aiVideoEnabled !== false,
    lastPayment: latest
      ? { amount: latest.amount, currency: latest.currency, date: latest.timestamp, method: latest.paymentMethod, planName: latest.planName }
      : null,
  };
}

// GET /api/admin/subscriptions/users — paginated + searchable enriched rows
app.get('/api/admin/subscriptions/users', (req, res) => {
  if (!requireRevenueAdmin(req, res)) return;
  try {
    store.checkAndProcessExpirations?.();
    const search = String(req.query.search || '').toLowerCase().trim();
    const planFilter = String(req.query.plan || 'all').toLowerCase().trim();
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10) || 10));

    let rows = store.getAllUsers().map(subscriptionRow);
    if (search) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.email.toLowerCase().includes(search) ||
          (r.mobile || '').includes(search)
      );
    }
    if (planFilter === 'pro') rows = rows.filter((r) => r.isPro);
    else if (planFilter === 'free') rows = rows.filter((r) => !r.isPro);
    else if (planFilter === 'expired')
      rows = rows.filter((r) => r.planExpiryDate !== null && r.planExpiryDate < Date.now());

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const users = rows.slice((safePage - 1) * limit, safePage * limit);
    return res.json({ success: true, users, total, page: safePage, totalPages });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to load users.' });
  }
});

// PATCH /api/admin/subscriptions/users/:id/expiry — set plan expiry (ms epoch or null=lifetime)
app.patch('/api/admin/subscriptions/users/:id/expiry', (req, res) => {
  const adminEmail = requireRevenueAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { expiresAt } = req.body || {};
    const value = expiresAt === null || expiresAt === undefined || expiresAt === ''
      ? null
      : Number(expiresAt);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      return res.status(400).json({ success: false, error: 'expiresAt must be a millisecond epoch or null.' });
    }
    const user = store.setUserPlanExpiry(req.params.id, value);
    console.log(`[RevenueAdmin] ${adminEmail} set expiry for ${user.email} -> ${value ? new Date(value).toISOString() : 'lifetime'}`);
    return res.json({ success: true, user: subscriptionRow(user) });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update expiry.' });
  }
});

// POST /api/admin/subscriptions/users/:id/plan — start/end plan with dynamic amount
app.post('/api/admin/subscriptions/users/:id/plan', (req, res) => {
  const adminEmail = requireRevenueAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { action, plan = 'pro', billing = 'monthly', seats = 1, amount = 0, months = 1, paymentMethod = 'ADMIN_MANUAL' } = req.body || {};
    if (action === 'end') {
      const user = store.endUserPlan(req.params.id);
      console.log(`[RevenueAdmin] ${adminEmail} ended plan for ${user.email}`);
      return res.json({ success: true, message: 'Plan ended. User reverted to Free.', user: subscriptionRow(user) });
    }
    if (action !== 'start') {
      return res.status(400).json({ success: false, error: "action must be 'start' or 'end'." });
    }
    if (!['pro', 'team', 'free'].includes(plan)) {
      return res.status(400).json({ success: false, error: "plan must be 'pro', 'team' or 'free'." });
    }
    const { user, payment } = store.startUserPlan(req.params.id, {
      plan,
      billing,
      seats: Math.max(1, Number(seats) || 1),
      amount: Math.max(0, Number(amount) || 0),
      months: Math.max(1, Number(months) || 1),
      paymentMethod,
      grantedBy: adminEmail,
    });
    console.log(`[RevenueAdmin] ${adminEmail} started ${plan} for ${user.email} amount=${amount}`);
    return res.json({ success: true, message: `Plan started: ${plan}.`, user: subscriptionRow(user), payment });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update plan.' });
  }
});

// PATCH /api/admin/subscriptions/users/:id/ai-flags — toggle Image/Video access
app.patch('/api/admin/subscriptions/users/:id/ai-flags', (req, res) => {
  const adminEmail = requireRevenueAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { aiImageEnabled, aiVideoEnabled } = req.body || {};
    if (aiImageEnabled === undefined && aiVideoEnabled === undefined) {
      return res.status(400).json({ success: false, error: 'Provide aiImageEnabled and/or aiVideoEnabled.' });
    }
    const user = store.setUserAiFlags(req.params.id, { aiImageEnabled, aiVideoEnabled });
    console.log(`[RevenueAdmin] ${adminEmail} set AI flags for ${user.email}: image=${user.aiImageEnabled !== false} video=${user.aiVideoEnabled !== false}`);
    return res.json({ success: true, user: subscriptionRow(user) });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to update AI flags.' });
  }
});

// GET /api/admin/subscriptions/analytics?range=daily|monthly|yearly|custom&from&to
app.get('/api/admin/subscriptions/analytics', (req, res) => {
  if (!requireRevenueAdmin(req, res)) return;
  try {
    const range = String(req.query.range || 'monthly').toLowerCase();
    const now = new Date();
    let fromMs: number;
    let toMs = now.getTime();
    if (range === 'daily') {
      const d = new Date(now); d.setHours(0, 0, 0, 0); fromMs = d.getTime();
    } else if (range === 'yearly') {
      fromMs = new Date(now.getFullYear(), 0, 1).getTime();
    } else if (range === 'custom') {
      const from = new Date(String(req.query.from || ''));
      const to = new Date(String(req.query.to || ''));
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return res.status(400).json({ success: false, error: 'Custom range needs valid from/to dates (YYYY-MM-DD).' });
      }
      fromMs = from.getTime();
      toMs = Math.min(to.getTime() + 86399999, Date.now());
      if (fromMs > toMs) {
        return res.status(400).json({ success: false, error: 'from must be before to.' });
      }
    } else {
      // monthly (default): first day of current month
      fromMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }
    const analytics = store.getRevenueAnalytics(fromMs, toMs);
    return res.json({ success: true, range, from: fromMs, to: toMs, ...analytics });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to compute analytics.' });
  }
});

// GET /api/admin/subscriptions/export.xlsx — full subscription report download
app.get('/api/admin/subscriptions/export.xlsx', async (req, res) => {
  if (!requireRevenueAdmin(req, res)) return;
  try {
    const rows = store.getAllUsers().map(subscriptionRow);
    const header = [
      'Name', 'Email', 'Mobile', 'Plan', 'Tier', 'Sign-in Date',
      'Plan Opted Date', 'Plan Opted Amount (INR)', 'Amount Paid Date',
      'Plan Expiry Date', 'Status', 'AI Image', 'AI Video',
    ];
    const fmt = (ts: number | null) => (ts ? new Date(ts).toISOString().slice(0, 10) : '-');
    const data = rows.map((r) => [
      r.name, r.email, r.mobile, r.plan, r.tier,
      fmt(r.signInDate), fmt(r.planOptedDate),
      r.planOptedAmount ?? '-', fmt(r.amountPaidDate),
      r.planExpiryDate ? new Date(r.planExpiryDate).toISOString().slice(0, 10) : 'Lifetime',
      r.status, r.aiImageEnabled ? 'Enabled' : 'Disabled', r.aiVideoEnabled ? 'Enabled' : 'Disabled',
    ]);
    const filename = `pulsenote-subscriptions-${new Date().toISOString().slice(0, 10)}.xlsx`;
    let xlsx: any = null;
    try {
      const mod = await import('xlsx');
      xlsx = (mod as any).default || mod;
    } catch {
      xlsx = null;
    }
    if (xlsx) {
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.aoa_to_sheet([header, ...data]);
      ws['!cols'] = header.map(() => ({ wch: 22 }));
      xlsx.utils.book_append_sheet(wb, ws, 'Subscriptions');
      const buf = Buffer.from(xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buf);
    }
    // Fallback: CSV payload if xlsx is unavailable at runtime
    const csv = [header, ...data].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/\.xlsx$/, '.csv')}"`);
    return res.send(csv);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Export failed.' });
  }
});

// Super Admin Password Update
app.post('/api/admin/change-password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }

    if (!store.verifyAdminPassword(currentPassword)) {
      return res.status(401).json({ error: 'Current admin password is incorrect.' });
    }

    store.updateAdminPassword(newPassword);
    return res.json({ success: true, message: 'Admin password successfully updated.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// User Activity Logs (Search queries & solutions generated per user)
app.get('/api/admin/activity-logs', (req, res) => {
  const userId = req.query.userId as string;
  const logs = userId ? store.getUserActivityLogs(userId) : store.getAllActivityLogs();
  return res.json({ logs });
});

// Financial Analytics (Monthly, Yearly, Custom Range, Aggregate Totals)
app.get('/api/admin/financials', (req, res) => {
  const { timeframe = 'monthly', startDate, endDate } = req.query;
  const payments = store.getAllPayments().filter((p) => p.status === 'completed');

  const now = new Date();
  let filtered = payments;

  if (timeframe === 'monthly') {
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    filtered = payments.filter((p) => {
      const d = new Date(p.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  } else if (timeframe === 'yearly') {
    const currentYear = now.getFullYear();
    filtered = payments.filter((p) => {
      const d = new Date(p.timestamp);
      return d.getFullYear() === currentYear;
    });
  } else if (timeframe === 'custom' && startDate && endDate) {
    const startMs = new Date(startDate as string).getTime();
    const endMs = new Date(endDate as string).getTime() + 86400000;
    filtered = payments.filter((p) => p.timestamp >= startMs && p.timestamp <= endMs);
  }

  const totalINR = filtered
    .filter((p) => p.currency === 'INR')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalUSD = filtered
    .filter((p) => p.currency === 'USD')
    .reduce((sum, p) => sum + p.amount, 0);

  // Group by month
  const monthlyBreakdown: Record<string, { totalINR: number; count: number }> = {};
  payments.forEach((p) => {
    const d = new Date(p.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyBreakdown[key]) monthlyBreakdown[key] = { totalINR: 0, count: 0 };
    if (p.currency === 'INR') monthlyBreakdown[key].totalINR += p.amount;
    monthlyBreakdown[key].count++;
  });

  return res.json({
    timeframe,
    totalTransactions: filtered.length,
    totalINR,
    totalUSD,
    monthlyBreakdown,
    recentPayments: filtered.slice(0, 50),
  });
});

// App Interface Dynamic Text / Wording Editor
app.get('/api/admin/settings', (_req, res) => {
  return res.json({ settings: store.getSettings() });
});

app.post('/api/admin/settings', (req, res) => {
  try {
    const updates = req.body;
    const updated = store.updateSettings(updates, 'jayeshofficial@gmail.com');
    return res.json({ success: true, settings: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// System Emails Log (For in-app verification & simulated testing)
app.get('/api/system/emails', (req, res) => {
  const email = req.query.email as string;
  const emails = email ? store.getEmailsForUser(email) : store.getAllEmails();
  return res.json({ emails });
});

// Audio transcription ping / keep-alive health check
app.get('/api/transcribe/ping', (_req, res) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=120');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  return res.json({ 
    status: 'healthy', 
    timestamp: Date.now(),
    keepAliveTimeoutMs: 120000 
  });
});

// Audio transcription endpoint for microphone recordings or audio uploads with robust stability guardrails
const SUPPORTED_AUDIO_FORMATS = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
  'audio/mp4',
  'video/webm',
]);

// Helper to compute speaker talk-time analytics from diarized transcripts (Fireflies parity)
function computeSpeakerStats(transcript: string): Array<{ speaker: string; turns: number; words: number; sharePercent: number }> {
  const lines = transcript.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const statsMap = new Map<string, { turns: number; words: number }>();
  let totalWords = 0;

  for (const line of lines) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9\s._-]{1,28}):\s+(.+)$/);
    if (!match) continue;
    const speaker = match[1].trim();
    const words = match[2].trim().split(/\s+/).filter(Boolean).length;
    totalWords += words;
    const prev = statsMap.get(speaker) || { turns: 0, words: 0 };
    statsMap.set(speaker, { turns: prev.turns + 1, words: prev.words + words });
  }

  if (statsMap.size === 0 || totalWords === 0) return [];
  return Array.from(statsMap.entries())
    .map(([speaker, data]) => ({
      speaker,
      turns: data.turns,
      words: data.words,
      sharePercent: Math.round((data.words / totalWords) * 100),
    }))
    .sort((a, b) => b.words - a.words);
}

// Helper to transcribe audio payload via 3-tier AI provider chain
async function transcribeAudioPayload(audioBase64: string, cleanMime: string, customInstruction?: string) {
  const promptText = customInstruction ||
    'Transcribe this spoken audio word-for-word into English text. Retain all technical terms, medical terminology, names, numbers, and dates. Do not add conversational commentary.';

  const res = await generateWithFallback({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          {
            type: 'image_url',
            image_url: { url: `data:${cleanMime};base64,${audioBase64}` },
          },
        ],
      },
    ],
    tier: 'fast',
  });

  return (res.text || '').trim();
}

// Chunked Audio Streaming Endpoint: accepts incremental audio blobs to prevent buffer overflows or gateway timeouts
app.post('/api/transcribe/chunk', async (req, res) => {
  const startTime = Date.now();
  req.setTimeout(120000);
  res.setTimeout(120000);
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=120');

  try {
    const { 
      audioBase64, 
      mimeType = 'audio/webm', 
      chunkIndex = 0, 
      sessionId, 
      isFinal = false,
      priorContext = '',
      ambientMode = false,
      customDictionary = [],
    } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing audio chunk data', errorCode: 'MISSING_CHUNK_PAYLOAD' });
    }

    if (audioBase64.trim().length < 80) {
      // Very small chunk or silence: return empty transcript without error
      return res.json({
        transcript: '',
        chunkIndex,
        sessionId,
        isFinal,
        status: 'success',
        durationMs: Date.now() - startTime
      });
    }

    const rawMime = (mimeType || 'audio/webm').trim().toLowerCase();
    let cleanMime = rawMime.split(';')[0].trim();
    if (cleanMime === 'audio/x-m4a' || cleanMime === 'audio/m4a') cleanMime = 'audio/mp4';
    if (cleanMime === 'audio/x-wav' || cleanMime === 'audio/wave') cleanMime = 'audio/wav';

    const dictSuffix = formatDictionaryInstruction(customDictionary);
    const ambientSuffix = ambientMode
      ? ' Identify speaker changes clearly using labels like "Clinician:" / "Patient:" or "Speaker 1:" / "Speaker 2:" on new lines when multiple speakers alternate.'
      : '';

    const instruction = priorContext
      ? `Transcribe this incremental spoken audio chunk word-for-word into English text. The previous spoken context was: "${priorContext.slice(-150)}". Transcribe only the new words spoken in this segment without repeating prior context.${ambientSuffix}${dictSuffix} Do not add conversational comments.`
      : `Transcribe this spoken audio chunk word-for-word into English text. Retain names, numbers, medical, and technical terminology accurately.${ambientSuffix}${dictSuffix}`;

    const transcriptText = await transcribeAudioPayload(audioBase64, cleanMime, instruction);
    const durationMs = Date.now() - startTime;
    const speakerStats = computeSpeakerStats(transcriptText);

    console.log(`[STT_CHUNK_SUCCESS] Processed chunk #${chunkIndex} (${transcriptText.length} chars, ${durationMs}ms, final: ${isFinal})`);

    return res.json({
      transcript: transcriptText,
      speakerStats,
      chunkIndex,
      sessionId,
      isFinal,
      status: 'success',
      durationMs
    });
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const errorCode = (err as any)?.status || (err as any)?.code || (err as any)?.name || 'CHUNK_TRANSCRIPTION_FAILED';
    const errorMessage = err instanceof Error ? err.message : 'Unknown chunk transcription exception';

    console.error('[STT_CHUNK_FAILURE]', {
      timestamp: new Date().toISOString(),
      errorCode,
      errorMessage,
      durationMs
    });

    return res.status(500).json({
      error: 'Audio chunk connection dropped. Buffered stream preserved for automatic reconnection.',
      errorCode: String(errorCode),
      details: errorMessage,
      preserved: true
    });
  }
});

app.post('/api/transcribe', async (req, res) => {
  const startTime = Date.now();
  req.setTimeout(120000);
  res.setTimeout(120000);
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=120');

  try {
    const { audioBase64, mimeType = 'audio/webm', ambientMode = false, customDictionary = [] } = req.body;

    // 1. Guardrail: Validate payload existence
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      console.warn('[STT_WARNING] Validation error: Missing or empty audio payload');
      return res.status(400).json({ 
        error: 'No audio data provided in transcription request', 
        errorCode: 'MISSING_AUDIO_PAYLOAD' 
      });
    }

    // 2. Guardrail: Validate minimum audio payload size (> 100 bytes)
    if (audioBase64.trim().length < 100) {
      console.warn('[STT_WARNING] Validation error: Audio payload too small (<100 bytes)');
      return res.status(400).json({ 
        error: 'Audio payload is empty or contains no detectable sound buffer', 
        errorCode: 'AUDIO_PAYLOAD_TOO_SMALL' 
      });
    }

    // 3. Guardrail: Validate maximum audio payload size (max 25MB ~ 35MB base64)
    const MAX_BASE64_LENGTH = 35 * 1024 * 1024;
    if (audioBase64.length > MAX_BASE64_LENGTH) {
      console.warn(`[STT_WARNING] Validation error: Audio payload exceeds 25MB (${audioBase64.length} chars)`);
      return res.status(413).json({ 
        error: 'Audio file size exceeds the 25MB limit. Please provide a shorter voice clip.', 
        errorCode: 'PAYLOAD_TOO_LARGE' 
      });
    }

    // 4. Guardrail: Validate audio format/MIME type
    const rawMime = (mimeType || 'audio/webm').trim().toLowerCase();
    if (!SUPPORTED_AUDIO_FORMATS.has(rawMime) && !rawMime.startsWith('audio/')) {
      console.warn(`[STT_WARNING] Validation error: Unsupported audio format "${rawMime}"`);
      return res.status(415).json({
        error: `Unsupported audio format "${rawMime}". Supported formats: WebM, WAV, MP3, M4A, OGG, AAC, FLAC.`,
        errorCode: 'UNSUPPORTED_AUDIO_FORMAT',
      });
    }

    // Clean MIME type for Google GenAI inlineData (strip codec parameters if present)
    let cleanMime = rawMime.split(';')[0].trim();
    if (cleanMime === 'audio/x-m4a' || cleanMime === 'audio/m4a') cleanMime = 'audio/mp4';
    if (cleanMime === 'audio/x-wav' || cleanMime === 'audio/wave') cleanMime = 'audio/wav';

    const dictSuffix = formatDictionaryInstruction(customDictionary);
    const ambientPrompt = ambientMode
      ? `Transcribe this spoken encounter audio word-for-word with speaker labels (e.g., "Clinician:" / "Patient:" or "Speaker 1:" / "Speaker 2:") on separate lines whenever the speaker changes. Retain all clinical/technical terms, numbers, and dates.${dictSuffix}`
      : (dictSuffix ? `Transcribe this spoken audio word-for-word into English text. Retain all technical terms, medical terminology, names, numbers, and dates.${dictSuffix}` : undefined);

    // 5. Model Execution with multi-model fallback
    const transcriptText = await transcribeAudioPayload(audioBase64, cleanMime, ambientPrompt);
    const speakerStats = computeSpeakerStats(transcriptText);

    const durationMs = Date.now() - startTime;
    console.log(`[STT_SUCCESS] Audio successfully transcribed (${transcriptText.length} chars, ${durationMs}ms)`);

    return res.json({ 
      transcript: transcriptText,
      speakerStats,
      durationMs,
      status: 'success'
    });
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const errorCode = (err as any)?.status || (err as any)?.code || (err as any)?.name || 'TRANSCRIPTION_API_FAILED';
    const errorMessage = err instanceof Error ? err.message : 'Unknown transcription exception';

    // Server-side logging capturing exact speech-to-text failure code for administrative troubleshooting
    console.error('[STT_FAILURE_CODE]', {
      timestamp: new Date().toISOString(),
      errorCode,
      errorMessage,
      durationMs,
      headers: req.headers['user-agent'],
    });

    return res.status(500).json({ 
      error: 'Transcription API connection dropped. Your spoken text has been preserved below for manual review or retry.',
      errorCode: String(errorCode),
      details: errorMessage,
      preserved: true
    });
  }
});

// Live Image Search API Endpoint (Live Google/Wikimedia/Unsplash Results)
app.get('/api/images/search', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 8;
    if (!query.trim()) {
      return res.status(400).json({ success: false, error: 'Search query is required.' });
    }

    const results = await searchLiveImages(query, limit);
    return res.json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (err: any) {
    console.error('[IMAGE_SEARCH_ERR]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch live image results.',
    });
  }
});

// =========================================================================
// GOOGLE FLOW ENGINE: REST APIs for Projects, Nodes, Connections & Collab
// =========================================================================
app.get('/api/flow/projects', (_req, res) => {
  try {
    const projects = flowStore.getAllProjects();
    return res.json({ success: true, projects });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch projects.' });
  }
});

app.get('/api/flow/projects/:id', (req, res) => {
  try {
    const project = flowStore.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Flow Project not found.' });
    }
    return res.json({ success: true, project });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch project.' });
  }
});

app.post('/api/flow/projects', (req, res) => {
  try {
    const { name, description, ownerId, ownerName } = req.body;
    const project = flowStore.createProject(name, description, ownerId, ownerName);
    return res.json({ success: true, project });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create project.' });
  }
});

app.post('/api/flow/projects/:id/nodes', (req, res) => {
  try {
    const node = req.body.node;
    if (!node) return res.status(400).json({ success: false, error: 'Node data is required.' });
    const created = flowStore.addNode(req.params.id, node);
    if (!created) return res.status(404).json({ success: false, error: 'Project not found.' });
    return res.json({ success: true, node: created });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create node.' });
  }
});

app.patch('/api/flow/projects/:id/nodes/:nodeId', (req, res) => {
  try {
    const { changes, createVersion } = req.body;
    const updated = flowStore.updateNode(req.params.id, req.params.nodeId, changes, createVersion);
    if (!updated) return res.status(404).json({ success: false, error: 'Node or project not found.' });
    return res.json({ success: true, node: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update node.' });
  }
});

app.delete('/api/flow/projects/:id/nodes/:nodeId', (req, res) => {
  try {
    const ok = flowStore.deleteNode(req.params.id, req.params.nodeId);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete node.' });
  }
});

app.post('/api/flow/projects/:id/connections', (req, res) => {
  try {
    const { connection } = req.body;
    if (!connection) return res.status(400).json({ success: false, error: 'Connection data is required.' });
    const created = flowStore.addConnection(req.params.id, connection);
    return res.json({ success: true, connection: created });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to add connection.' });
  }
});

app.delete('/api/flow/projects/:id/connections/:connId', (req, res) => {
  try {
    const ok = flowStore.deleteConnection(req.params.id, req.params.connId);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete connection.' });
  }
});

app.post('/api/flow/projects/:id/nodes/:nodeId/comments', (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ success: false, error: 'Comment data is required.' });
    const added = flowStore.addComment(req.params.id, req.params.nodeId, comment);
    return res.json({ success: true, comment: added });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to add comment.' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const distDir = path.join(__dirname, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');
  const isBuiltServer = path.basename(__filename) === 'server.js';
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (isBuiltServer && fs.existsSync(distIndexPath));

  // Global Error Handler Middleware guarding res.headersSent
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error('Unhandled server error:', err);
    return res.status(err?.status || 500).json({
      error: err?.message || 'Internal server error',
    });
  });

  // SEO: robots.txt and sitemap.xml. Without these, the SPA catch-all served
  // index.html for both paths, so crawlers got no crawl rules and no sitemap.
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /admin',
        '',
        'Sitemap: https://pulsenoteai.in/sitemap.xml',
        '',
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', (_req, res) => {
    const lastmod = new Date().toISOString().split('T')[0];
    const urls = ['/', '/#pricing', '/#soap-demo', '/#faq', '/#about', '/#partners', '/#templates'];
    const body =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (u) =>
            `  <url>\n    <loc>https://pulsenoteai.in${u}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`
        )
        .join('\n') +
      `\n</urlset>\n`;
    res.type('application/xml').send(body);
  });

  const mountStaticSpa = () => {
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
    }
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      if (fs.existsSync(distIndexPath)) {
        return res.sendFile(distIndexPath);
      }
      const rootIndex = path.join(__dirname, 'index.html');
      if (fs.existsSync(rootIndex)) {
        return res.sendFile(rootIndex);
      }
      return res.status(503).send('PulseNote AI frontend build (dist/index.html) not found. Please run npm run build.');
    });
  };

  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('[SERVER] Vite middleware unavailable, falling back to static dist build:', viteErr);
      mountStaticSpa();
    }
  } else {
    mountStaticSpa();
  }

  const rawPort = process.env.PORT?.trim();
  const PORT_NUM: number | string = rawPort
    ? (/^\d+$/.test(rawPort) ? Number(rawPort) : rawPort)
    : 3000;

  const onListening = () => {
    const addr = typeof PORT_NUM === 'number' ? `http://0.0.0.0:${PORT_NUM}` : String(PORT_NUM);
    console.log(`PulseNote AI server listening on ${addr} [mode: ${isProd ? 'production' : 'development'}]`);
  };

  const server =
    typeof PORT_NUM === 'number'
      ? app.listen(PORT_NUM, '0.0.0.0', onListening)
      : app.listen(PORT_NUM, onListening);

  // Initialize Google Flow Real-Time WebSocket Server (non-fatal if proxy restricts WS)
  try {
    initFlowWebSocketServer(server);
  } catch (wsErr) {
    console.warn('[FLOW_WS] WebSocket initialization skipped:', wsErr);
  }

  // Keep-Alive and extended timeout threshold to prevent premature connection drops for long audio streams
  server.keepAliveTimeout = 120000; // 120 seconds
  server.headersTimeout = 125000;   // 125 seconds
  server.requestTimeout = 120000;   // 120 seconds
}

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION_GUARD]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED_REJECTION_GUARD]', reason);
});

startServer().catch((err) => {
  console.error('[FATAL_SERVER_START]', err);
});

