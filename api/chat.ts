import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  body: any;
  query: Record<string, string>;
  cookies: Record<string, string>;
  method?: string;
}

interface VercelResponse extends ServerResponse {
  send: (body: any) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  status: (statusCode: number) => VercelResponse;
}

const MANDATORY_LEGAL_NOTICE =
  'PulseNote AI produces assisted documentation and intelligent insights. Generated documentation must be reviewed and verified by a licensed professional before clinical, operational, or legal execution.';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, HTTP-Referer, X-Title');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({
        error: 'OPENROUTER_API_KEY is not configured in Vercel environment variables.',
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    let { message, messages = [], model = 'openai/gpt-4o-mini', temperature = 0.7 } = body;

    if (message && typeof message === 'string' && (!messages || messages.length === 0)) {
      messages = [{ role: 'user', content: message }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Message or messages array is required.' });
    }

    const siteUrl = process.env.APP_URL || 'https://pulsenoteai-in.vercel.app';
    const siteTitle = 'PulseNote AI';

    // Map model if needed
    let modelToCall = model;
    if (model === '2.5 Flash' || model === 'gemini-3.5-flash') {
      modelToCall = 'google/gemini-2.5-flash';
    } else if (model === '2.5 Pro' || model === 'gemini-3.1-pro-preview') {
      modelToCall = 'google/gemini-2.5-pro';
    } else if (model === 'fast' || model === 'gemini-3.1-flash-lite') {
      modelToCall = 'openai/gpt-4o-mini';
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': siteTitle,
      },
      body: JSON.stringify({
        model: modelToCall,
        messages: messages.map((m: any) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
          content: m.content || m.text || '',
        })),
        temperature,
      }),
    });

    if (!response.ok) {
      // Fallback to gpt-4o-mini if specific model was rejected
      const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': siteUrl,
          'X-Title': siteTitle,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: messages.map((m: any) => ({
            role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
            content: m.content || m.text || '',
          })),
          temperature,
        }),
      });

      if (!fallbackResponse.ok) {
        const errText = await fallbackResponse.text();
        return res.status(fallbackResponse.status).json({
          error: `OpenRouter error (${fallbackResponse.status}): ${errText}`,
        });
      }

      const fbData = await fallbackResponse.json();
      const fbReply = fbData.choices?.[0]?.message?.content || '';
      return res.status(200).json({
        text: fbReply,
        reply: fbReply,
        modelUsed: 'openai/gpt-4o-mini',
        complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
      });
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({
      text: replyText,
      reply: replyText,
      modelUsed: modelToCall,
      complianceDisclaimer: MANDATORY_LEGAL_NOTICE,
    });
  } catch (error: any) {
    console.error('Vercel chat error:', error);
    return res.status(500).json({
      error: error?.message || 'Internal server error processing chat.',
    });
  }
}
