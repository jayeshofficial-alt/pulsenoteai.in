import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSystemPromptForMode } from "../../../src/data/modePrompts";

export async function POST(req: NextRequest) {
  try {
    const { message, model, mode, industryMode, industry } = await req.json();
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required and must be non-empty." }, { status: 400 });
    }

    // Defensive input clamp (prevent memory exhaustion)
    const sanitizedMessage = message.slice(0, 30000);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY missing in server environment" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Select per-mode tailored system instruction
    const targetMode = mode || industryMode || industry || 'general';
    const systemInstruction = getSystemPromptForMode(targetMode);

    // Map candidate models with robust fallback
    const candidateModels = model === "2.5 Pro" || model === "pro"
      ? ["gemini-3.1-pro-preview", "gemini-2.5-pro"] 
      : ["gemini-3.8-flash", "gemini-2.5-flash"];

    let lastError: any = null;
    let text = "";

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: sanitizedMessage,
          config: {
            systemInstruction,
            temperature: 0.3,
          }
        });
        text = response.text || "";
        if (text) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    return NextResponse.json({ 
      reply: text, 
      text,
      modeUsed: targetMode,
    });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate response" }, { status: 500 });
  }
}
