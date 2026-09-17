const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      console.error("[chat] GROQ_API_KEY secret is not set");
      return new Response(
        JSON.stringify({ error: "Groq API key not configured. Set the GROQ_API_KEY edge function secret." }),
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
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "A 'message' field is required." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const messages: ChatMessage[] = [
      ...history,
      { role: "user", content: message },
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error("[chat] Groq API error:", groqRes.status, errBody.slice(0, 500));
      let parsed: { error?: { message?: string } } = {};
      try { parsed = JSON.parse(errBody); } catch { /* not JSON */ }
      const errMsg = parsed.error?.message || `Groq API returned HTTP ${groqRes.status}`;
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await groqRes.json();
    const reply: string = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[chat] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong: " + String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
