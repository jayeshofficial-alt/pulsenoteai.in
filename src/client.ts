// client.js
// Client-side rendering utility for chat messages matching server response schema:
// { type: "text", text: string } or { type: "image", text: string, imageUrl: string }

export function renderMessage(data: { type?: string; text?: string; imageUrl?: string }) {
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
  }
  chatContainer.appendChild(div);
}

if (typeof window !== "undefined") {
  (window as any).renderMessage = renderMessage;
}

export default renderMessage;
