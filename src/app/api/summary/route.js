import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing chapter text" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing in .env.local" }, { status: 500 });
    }

    const prompt = `You are a highly intelligent linguistic reading assistant. 
Please provide a "Smart Summary" of the following chapter or section of text.

Your summary should:
1. Briefly outline the main events or key points (2-4 sentences max).
2. Highlight exactly 2 key vocabulary words or themes from the text, explaining them briefly.

Text:
"${text.substring(0, 8000)}..." // We pass up to ~8000 chars to avoid very long prompts, you can adjust this.

Make your response clean, formatted in Markdown, and engaging. Do not hallucinate or use placeholders.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
        const errData = await response.json();
        console.error("Gemini ERror:", errData);
        return NextResponse.json({ error: "Failed to generate summary." }, { status: 500 });
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate a summary.";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
