const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are the helpful assistant for Civic Portal, a website where people report accessibility issues in their community (visual, hearing, mobility, cognitive, and multiple disabilities). Answer questions about how to use the site and general accessibility topics. Keep answers short, clear, and friendly.`;

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

    // Gemini requires the first content to be role "user". Strip any leading
    // assistant/model messages (e.g. the welcome greeting) to avoid rejection.
    const mappedHistory = history
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }))
      .filter((m, i) => m.role === "user" || i > 0);

    // Drop any remaining leading model messages.
    while (mappedHistory.length > 0 && mappedHistory[0].role === "model") {
      mappedHistory.shift();
    }

    const contents = [
      ...mappedHistory,
      { role: "user", parts: [{ text: message }] },
    ];

    // Gemini API key must be passed as the "x-goog-api-key" header (and/or the
    // "?key=" query parameter), NOT as an "Authorization: Bearer" header.
    // The Supabase Deno runtime auto-injects an Authorization header into
    // outbound fetches, which causes Gemini to return HTTP 401
    // "Request had invalid authentication credentials." We build a fresh
    // Request object and explicitly delete that header to avoid the conflict.
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const geminiReq = new Request(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
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
    });
    geminiReq.headers.delete("Authorization");

    const geminiRes = await fetch(geminiReq);

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
    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;
    const reply: string =
      candidate?.content?.parts
        ?.map((part: { text?: string }) => part.text)
        ?.filter((t: string | undefined): t is string => typeof t === "string")
        ?.join("\n") ?? "";

    if (!reply && finishReason === "SAFETY") {
      return new Response(
        JSON.stringify({ reply: "I couldn't generate a response for that topic. Could you rephrase your question?" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
