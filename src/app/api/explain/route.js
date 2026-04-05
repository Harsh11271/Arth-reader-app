import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { word, context } = await req.json();

    if (!word || !context) {
      return NextResponse.json({ error: "Missing word or context" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_key_here") {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing or invalid in .env.local" }, { status: 500 });
    }

    const prompt = `You are a highly intelligent linguistic reading assistant. 
Explain the precise meaning of the highlighted phrase: "${word}" exactly as it is used within this sentence context: "${context}".

Provide a brief response formatted in clean markdown containing:
1. **Meaning in Context:** A very straightforward translation/explanation of what the phrase means in this exact sentence.
2. **Breakdown:** A brief note on grammar, idioms, or cultural nuance if relevant.

Make it short, friendly, and easy to read. Do not hallucinate or use placeholders.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
        const errData = await response.json();
        console.error("Gemini Error:", errData);
        return NextResponse.json({ error: "Failed to generate explanation. Check your API key limits or syntax." }, { status: 500 });
    }

    const data = await response.json();
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate an explanation.";

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
