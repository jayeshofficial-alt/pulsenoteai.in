import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const { message, model } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY missing in .env.local" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Map frontend model name with robust fallback
    const candidateModels = model === "2.5 Pro" 
      ? ["gemini-2.5-pro", "gemini-1.5-pro", "gemini-3.1-pro-preview"] 
      : ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.8-flash"];

    let lastError: any = null;
    let text = "";

    for (const modelName of candidateModels) {
      try {
        const geminiModel = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: "You are PulseNote AI, a helpful AI assistant created by PulseNote AI. You are inspired by Google Gemini. Be helpful, accurate, concise and friendly. Format code with markdown."
        });

        const result = await geminiModel.generateContent(message);
        const response = await result.response;
        text = response.text();
        if (text) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    return NextResponse.json({ reply: text, text });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate response" }, { status: 500 });
  }
}
