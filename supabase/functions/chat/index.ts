const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are the helpful assistant for "Civic Portal," a website that lets people report accessibility issues in their community (visual, hearing, mobility, cognitive, and multiple disabilities). Answer visitor questions about how to use the site, how to report an issue, and general accessibility topics. Keep answers short, clear, and friendly. If you don't know something specific about this project, say so honestly rather than guessing.

The site also helps residents report local civic issues (roads, water, waste, street lighting, safety, parks, traffic) and track them. Key pages: "/" (Home), "/file" (Report an Issue), "/track" (Track complaints), "/complaints" (Projects board), "/map" (Civic Map), "/map-view" (Map View), "/insights" (Get Involved), "/accessibility" (Accessibility & disability support), "/news" (Breaking News).`;

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      console.error("[chat] GEMINI_API_KEY secret is not set");
      return new Response(
        JSON.stringify({
          reply:
            "I'm not fully connected yet — the AI service key hasn't been configured. Please ask the site administrator to set up the GEMINI_API_KEY secret so I can answer your questions.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests are supported." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const message: string = body.message;
    const history: HistoryMessage[] = Array.isArray(body.history) ? body.history : [];

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "A 'message' field is required." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Gemini uses "contents" with role "user"/"model" and a separate "systemInstruction".
    const contents = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              { text: `Today's date is ${today}.` },
              { text: SYSTEM_PROMPT },
            ],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("[chat] Gemini API error:", geminiRes.status, errBody.slice(0, 500));
      return new Response(
        JSON.stringify({
          reply: "I had trouble reaching the AI service just now. Please try again in a moment.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await geminiRes.json();
    const reply: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text)
        ?.filter((t: string | undefined): t is string => typeof t === "string")
        ?.join("\n") ?? "";

    return new Response(
      JSON.stringify({ reply: reply || "I couldn't generate a response for that. Could you rephrase your question?" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[chat] Unhandled error:", err);
    return new Response(
      JSON.stringify({ reply: "Something went wrong on my end. Please try again shortly." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
