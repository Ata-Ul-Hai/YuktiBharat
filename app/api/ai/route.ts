import { NextResponse } from "next/server"

// Gemini API backup when n8n webhook fails
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        reply: "AI backup service is not configured. Please contact support."
      })
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    
    // Wrap user prompt with Yukti personality
    const wrappedPrompt = `The user said: "${prompt}". 
Reply as YUKTI in a SHORT, casual friend style (max 2 sentences, under 50 words). Be helpful but brief. Use emojis occasionally. Do not give long explanations unless specifically asked.`
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: wrappedPrompt }],
          },
        ],
        systemInstruction: {
          role: "system",
          parts: [{ 
            text: "You are YUKTI (Your Ultimate Knowledge & Thoughtful Intelligence). Always keep replies SHORT (1-2 sentences max, under 50 words). Be a friendly, casual chatbot. Use emojis occasionally. Do NOT explain meanings, definitions, or give long details unless explicitly asked. Focus on career guidance with a warm, approachable tone." 
          }],
        },
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 50,
        },
      }),
    })

    if (!response.ok) {
      let details: any = undefined
      try {
        details = await response.json()
      } catch (_) {
        details = await response.text()
      }
      return NextResponse.json({ error: "AI request failed", details }, { status: 500 })
    }

    const data = await response.json()
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response."
    return NextResponse.json({ reply })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}
