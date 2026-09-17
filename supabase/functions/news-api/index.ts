const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CIVIC_QUERY =
  '(pothole OR garbage OR "water leak" OR "road damage" OR streetlight OR municipal OR sanitation OR drainage OR sewer OR "water supply" OR "power outage" OR "street light" OR civic OR "road repair" OR "waste management" OR "water logging" OR "power cut")';

const INDIAN_DOMAINS =
  "thehindu.com,timesofindia.indiatimes.com,ndtv.com,indianexpress.com,hindustantimes.com,deccanherald.com,news18.com,livemint.com,indiatoday.in,scroll.in,thequint.com";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  roads: [
    "pothole", "road", "traffic", "transport", "highway", "bridge",
    "flyover", "footpath", "sidewalk", "speed breaker", "road repair", "road damage",
  ],
  water: [
    "water", "drain", "flood", "pipeline", "sewage", "monsoon",
    "reservoir", "leak", "water supply", "water board", "water logging", "desilting",
  ],
  sanitation: [
    "garbage", "waste", "sanitation", "cleanliness", "swachh",
    "dumping", "landfill", "bin", "waste management", "dustbin",
  ],
  electricity: [
    "streetlight", "street light", "electricity", "power", "transformer",
    "grid", "lamp", "led", "power outage", "power cut",
  ],
};

function categorize(text: string): string {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "general";
}

function truncate(text: string, max: number): string {
  if (!text) return "";
  const cleaned = text.replace(/\[\+\d+ chars\]/, "").trim();
  return cleaned.length > max ? cleaned.slice(0, max).trim() + "..." : cleaned;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("NEWS_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "News API key not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const today = new Date().toISOString().split("T")[0];

    const newsUrl =
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(CIVIC_QUERY)}` +
      `&domains=${INDIAN_DOMAINS}` +
      `&language=en` +
      `&from=${today}` +
      `&sortBy=publishedAt` +
      `&pageSize=30` +
      `&apiKey=${apiKey}`;

    const newsRes = await fetch(newsUrl);

    if (!newsRes.ok) {
      const errText = await newsRes.text();
      console.error("NewsAPI error:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch news from NewsAPI" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await newsRes.json();

    if (!data.articles || data.articles.length === 0) {
      return new Response(
        JSON.stringify({ articles: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const articles = data.articles.map(
      (a: {
        title?: string;
        description?: string;
        content?: string;
        url: string;
        urlToImage?: string | null;
        source?: { name?: string };
        publishedAt: string;
      }, i: number) => ({
        id: i + 1,
        title: a.title || "Untitled",
        description: truncate(a.description || a.content || "", 200),
        url: a.url,
        image: a.urlToImage || null,
        source: a.source?.name || "Unknown",
        publishedAt: a.publishedAt,
        category: categorize(`${a.title || ""} ${a.description || ""}`),
      }),
    );

    return new Response(
      JSON.stringify({ articles }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("News edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong fetching news" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
