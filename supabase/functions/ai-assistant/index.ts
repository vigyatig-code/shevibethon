import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are "Site Assistant", a helpful AI guide for the Civic Portal — a community civic engagement platform for Indian cities.

The site helps residents:
- Report local civic issues (roads, water, waste, street lighting, safety, parks, traffic, accessibility)
- Track complaints via tracking numbers
- Browse a "Projects" board of community-submitted issues
- View two maps: a "Civic Map" (India state map with community pins) and a "Map View" (interactive Leaflet street map with nearby issues)
- Read impact metrics, an impact timeline, and featured initiatives
- Participate through a "Get Involved" page with insights and charts
- Access an Accessibility page with disability support resources

Key pages:
- "/" — Home/About (hero, priorities, impact, initiatives, testimonials)
- "/file" — Report an Issue (filing form with category, severity, photo, location)
- "/track" — Track complaints by tracking number
- "/complaints" — Projects board (browse all submitted issues)
- "/map" — Civic Map (India state-level map)
- "/map-view" — Map View (street-level interactive map)
- "/insights" — Get Involved (data insights, charts, participation)
- "/accessibility" — Accessibility & disability support

Complaint categories: Roads & Infrastructure, Water & Drainage, Waste & Sanitation, Street Lighting, Public Safety, Parks & Green Spaces, Traffic & Transport, Accessibility & Disability, Other.

Status flow: Pending → Under Review → Resolved (or Rejected).
Severity levels: Critical, High, Medium, Low.

Keep responses concise (2-4 sentences), friendly, and actionable. If asked about something outside this site's scope, gently steer back to civic engagement. If a user wants to file a complaint, direct them to the "Report an Issue" page. If they want to track one, point them to "Updates".`;

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

    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: "Understood! I'm ready to help visitors navigate the Civic Portal." }],
      },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
            topP: 0.9,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({
          reply: "I had trouble reaching the AI service just now. Please try again in a moment.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiRes.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
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
