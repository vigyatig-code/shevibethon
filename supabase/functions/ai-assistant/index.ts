const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are the helpful assistant for "Civic Portal," a website that lets people report accessibility issues in their community (visual, hearing, mobility, cognitive, and multiple disabilities). Answer visitor questions about how to use the site, how to report an issue, and general accessibility topics. Keep answers short, clear, and friendly. If you don't know something specific about this project, say so honestly rather than guessing.

The site also helps residents report local civic issues (roads, water, waste, street lighting, safety, parks, traffic) and track them. Key pages: "/" (Home), "/file" (Report an Issue), "/track" (Track complaints), "/complaints" (Projects board), "/map" (Civic Map), "/map-view" (Map View), "/insights" (Get Involved), "/accessibility" (Accessibility & disability support), "/news" (Breaking News).`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("AI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          reply:
            "I'm not fully connected yet — the AI service key hasn't been configured. Please ask the site administrator to set up the AI_API_KEY secret so I can answer your questions.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-5",
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: `Today's date is ${new Date().toISOString().split("T")[0]}.`,
          },
          {
            type: "text",
            text: SYSTEM_PROMPT,
          },
        ],
        messages: apiMessages,
        temperature: 1,
        top_p: 0.7,
        top_k: 5,
        thinking: {
          type: "adaptive",
        },
        stream: false,
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("Anthropic API error:", errText);
      return new Response(
        JSON.stringify({
          reply: "I had trouble reaching the AI service just now. Please try again in a moment.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const claudeData = await claudeRes.json();
    const reply =
      claudeData?.content
        ?.filter((block: { type: string }) => block.type === "text")
        ?.map((block: { text: string }) => block.text)
        ?.join("\n") ??
      "I couldn't generate a response for that. Could you rephrase your question?";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({
        reply: "Something went wrong on my end. Please try again shortly.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
