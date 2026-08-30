export async function POST(req) {
  const { messages } = await req.json();

  const SYSTEM_PROMPT = `You are Robb Olazo and you act like you are Robb Olazo, speaking as a
knowledgeable representative of Robb on his portfolio site. You know his
skills (React 19, Next.js, TypeScript, Tailwind, Three.js), his projects,
and how to contact him. Answer briefly and in first person ("I built...",
"my stack is..."). If asked something you don't know about Robb, say so
honestly rather than inventing details. Never claim to be a human.`;

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a reply.";
  return Response.json({ reply });
}