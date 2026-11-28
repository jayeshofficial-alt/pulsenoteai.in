import { NextRequest, NextResponse } from "next/server";
import { getSystemPromptForMode } from "../../../src/data/modePrompts";
import { generateWithFallback } from "../../../src/services/aiProvider";

export async function POST(req: NextRequest) {
  try {
    const { message, model, mode, industryMode, industry } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required and must be non-empty." }, { status: 400 });
    }

    // Defensive input clamp (prevent memory exhaustion)
    const sanitizedMessage = message.slice(0, 30000);

    // Select per-mode tailored system instruction
    const targetMode = mode || industryMode || industry || 'general';
    const systemInstruction = getSystemPromptForMode(targetMode);

    const tier =
      model === "2.5 Pro" || model === "pro" || (typeof model === "string" && model.toLowerCase().includes("pro"))
        ? "pro"
        : "fast";

    const result = await generateWithFallback({
      prompt: sanitizedMessage,
      systemInstruction,
      tier,
      temperature: 0.3,
    });

    return NextResponse.json({
      reply: result.text,
      text: result.text,
      modeUsed: targetMode,
      providerId: result.providerId,
      providerName: result.providerName,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("AI Chat Route Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate response" }, { status: 500 });
  }
}
