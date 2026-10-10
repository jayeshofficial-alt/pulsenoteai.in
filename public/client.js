// client.js
// Client-side rendering utility for chat messages matching server response schema:
// { type: "text", text: string } or { type: "image", text: string, imageUrl: string }

export function renderMessage(data) {
  const chatContainer = document.getElementById("chat");
  if (!chatContainer) {
    console.warn("Element with id 'chat' not found in DOM");
    return;
  }

  const div = document.createElement("div");
  div.className = "bot-message";
  div.innerHTML = `<p>${data.text || ""}</p>`;
  if (data.type === "image" && data.imageUrl) {
    div.innerHTML += `<img src="${data.imageUrl}" alt="Generated image" style="max-width:100%;border-radius:8px">`;
  } else if (data.type === "video" && (data.videoUrl || data.file || data.imageUrl)) {
    const videoSrc = data.videoUrl || data.file || data.imageUrl;
    div.innerHTML += `<video controls autoplay loop src="${videoSrc}" style="max-width:100%;border-radius:8px;margin-top:8px;display:block"></video>`;
  }
  chatContainer.appendChild(div);
}

// OPENROUTER_API_KEY - read from environment / secret, never hardcoded or displayed
const OPENROUTER_API_KEY =
  (typeof process !== "undefined" && process?.env?.OPENROUTER_API_KEY) ||
  (typeof window !== "undefined" && (window.OPENROUTER_API_KEY || window.process?.env?.OPENROUTER_API_KEY)) ||
  "";

/**
 * Ask OpenRouter API directly
 * Endpoint: https://openrouter.ai/api/v1/chat/completions
 * Headers: Authorization: Bearer ${OPENROUTER_API_KEY}, Content-Type: application/json
 */
export async function askOpenRouter(messages, model = "openai/gpt-4o-mini") {
  const apiKey =
    OPENROUTER_API_KEY ||
    (typeof window !== "undefined" && window.OPENROUTER_API_KEY) ||
    "";

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

// Ensure function is available globally on window if client.js is loaded via script tag
if (typeof window !== "undefined") {
  window.renderMessage = renderMessage;
  window.askOpenRouter = askOpenRouter;
}

export default renderMessage;
