const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Gemini API key must be passed as a query parameter (?key=...), NOT as an
// Authorization: Bearer header. Using Bearer causes HTTP 401
// "Request had invalid authentication credentials."

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
      console.error("[ai-assistant] GEMINI_API_KEY secret is not set");
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
      console.error("[ai-assistant] Gemini API error:", geminiRes.status, errBody.slice(0, 500));
      let parsed: { error?: { message?: string } } = {};
      try { parsed = JSON.parse(errBody); } catch { /* not JSON */ }
      const errMsg = parsed.error?.message || `Gemini API returned HTTP ${geminiRes.status}`;
      return new Response(
        JSON.stringify({
          reply: `I had trouble reaching the AI service just now (${errMsg}). Please try again in a moment.`,
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
    console.error("[ai-assistant] Unhandled error:", err);
    return new Response(
      JSON.stringify({ reply: "Something went wrong on my end. Please try again shortly." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
// redeploy v2: strip Authorization header + use x-goog-api-key + key query param
