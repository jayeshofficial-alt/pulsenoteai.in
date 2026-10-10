# PulseNote AI — Intelligent AI Workspace Powered by OpenRouter

PulseNote AI is a high-performance productivity and creative workspace powered by the OpenRouter API. It delivers multi-modal conversational intelligence, image understanding, generative visuals, animations, and productivity tools:

1. **Text Chat with Streaming Responses**: Real-time token streaming with `openai/gpt-4o-mini` (or configurable OpenRouter models), live stop button (`AbortController`), and instant retry.
2. **Image Understanding**: Multi-modal vision analysis—upload any image plus a natural language prompt to receive detailed visual breakdown.
3. **Generative Visuals & SVG**: High-fidelity visual creation using OpenRouter completions and generative rendering.
4. **Interactive Live Animations**: Generates standalone 60 FPS HTML5 / SVG / CSS / Canvas animation code from text prompts and executes it immediately in a secure, sandboxed `<iframe>` with live replay.
5. **Multi-Modal Flow Canvas**: Infinite drag-and-drop generative canvas synchronizing chat queries into visual pipeline nodes.

---

## 🔑 Where and How to Add Your OpenRouter API Key

### 1. In Google AI Studio (Preview & Development)
In Google AI Studio:
1. Open the **Secrets** panel in AI Studio settings.
2. Add a secret named `OPENROUTER_API_KEY` with your OpenRouter API key (`sk-or-v1-...`).
3. Alternatively, for direct client-side requests in preview, set `VITE_OPENROUTER_API_KEY` in `.env.local`:
   ```bash
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```
4. PulseNote AI also includes an in-app key configurator in the UI settings for convenient instant local testing.

### 2. In Live Deployment (Vercel, Netlify, GitHub Pages, Cloud Run, `pulsenoteai.in`)
When deploying the application:
* **For Vite Client Bundles / Static Hosting (GitHub Pages / Vercel / Netlify):**
  Define the environment variable in your platform dashboard or GitHub Repository Secrets:
  ```bash
  VITE_OPENROUTER_API_KEY="sk-or-v1-your-key-here"
  ```
* **For Full-Stack Node Server (`server.ts` / Cloud Run / Docker):**
  ```bash
  OPENROUTER_API_KEY="sk-or-v1-your-key-here"
  ```
* **Direct in the App UI (Client-Side Storage):**
  Users can also paste their personal OpenRouter key directly via the settings key dialog, which saves safely to browser `localStorage` without exposing keys to any backend.

---

## 🛠️ Service Architecture (`src/services/openrouter.ts`)

- **Primary Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Default Model:** `openai/gpt-4o-mini`
- **Headers:**
  - `Authorization: Bearer <key>`
  - `Content-Type: application/json`
  - `HTTP-Referer: window.location.origin` (or fallback domain)
  - `X-Title: PulseNote AI`
- **Error Handling:** Inspects HTTP status codes and extracts error messages from OpenRouter response envelopes, surfacing non-silent notifications in the UI.

---

## 🚀 Building & Running for Production

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode
npm run dev

# 3. Type check & build client and server bundles
npm run build

# 4. Launch production server
npm start
```

### Custom Domain Configuration (`pulsenoteai.in`)
The repository includes `public/CNAME` pointing to `pulsenoteai.in`. DNS A and CNAME records pointing to your host will resolve cleanly.
