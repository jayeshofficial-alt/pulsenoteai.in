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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
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
    const { message, messages, model = 'openai/gpt-4o-mini', temperature = 0.7, max_tokens = 2048 } = body;

    const formattedMessages = messages || [{ role: 'user', content: message || '' }];
    const siteUrl = process.env.APP_URL || 'https://pulsenoteai-in.vercel.app';
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
        messages: formattedMessages.map((m: any) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
          content: m.content || '',
        })),
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `OpenRouter API error (${response.status}): ${errText}`,
      });
    }

    const data = await response.json();
    const replyContent = data.choices?.[0]?.message?.content || data.reply || '';

    return res.status(200).json({
      reply: replyContent,
      text: replyContent,
      modelUsed: model,
      raw: data,
    });
  } catch (error: any) {
    console.error('Vercel OpenRouter chat error:', error);
    return res.status(500).json({
      error: error?.message || 'Internal server error processing OpenRouter request.',
    });
  }
}
