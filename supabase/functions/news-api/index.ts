const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const INDIAN_DOMAINS =
  "thehindu.com,timesofindia.indiatimes.com,ndtv.com,indianexpress.com,hindustantimes.com,deccanherald.com,news18.com,indiatoday.in,scroll.in,thequint.com";

// Each query requires "India" alongside category-specific civic terms
// using NewsAPI's AND operator. Each stays well under the 500-char limit.
const CATEGORY_QUERIES: Record<string, string> = {
  roads: 'India AND (pothole OR "road damage" OR "road repair" OR "traffic jam" OR flyover OR footpath OR "road accident" OR "pothole repair" OR "broken road" OR "crater road")',
  water: 'India AND ("water supply" OR "water crisis" OR "water logging" OR "water shortage" OR "drinking water" OR "water pipeline" OR "sewage overflow" OR "drainage overflow" OR "water board" OR desilting)',
  sanitation: 'India AND (garbage OR "waste management" OR "garbage collection" OR "sewage treatment" OR "street cleaning" OR swachh OR "waste collection" OR "dumping ground" OR "landfill fire" OR "waste segregation")',
  electricity: 'India AND ("power cut" OR "power outage" OR "street light" OR streetlight OR "load shedding" OR "power failure" OR "electricity board" OR "transformer fire" OR "faulty meter" OR "power restoration")',
};

const FALLBACK_QUERY = 'India AND (municipal OR civic OR "city infrastructure" OR "urban governance" OR "public works" OR municipality OR corporation OR "smart city")';

// Topics that indicate the article is NOT about civic infrastructure.
const EXCLUDE_KEYWORDS = [
  "stock", "share", "sensex", "nifty", "ipo", "mutual fund", "crypto", "bitcoin",
  "oil pipeline", "gas pipeline", "crude oil", "lng", "petroleum", "refinery",
  "real estate", "property market", "housing prices", "rental market", "commercial property",
  "embassy", "diplomat", "geopolitics", "nato", "un security", "foreign policy",
  "bollywood", "cricket", "ipl", "world cup", "tournament",
  "box office", "film review", "ott release", "streaming",
  "recipe", "restaurant review", "food festival",
  "fashion week", "beauty", "wellness retreat",
  "merger", "acquisition", "quarterly results", "revenue growth", "profit margin",
  "tanker rate", "shipping rate", "freight rate", "charter rate",
  "gold price", "silver price", "commodity market",
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  roads: [
    "pothole", "road damage", "road repair", "traffic jam", "road accident",
    "flyover", "footpath", "broken road", "crater road", "speed breaker",
    "road cave", "pothole repair", "footbridge", "ring road", "expressway",
    "carriageway", "bitumen", "road widening", "road construction",
    "traffic signal", "road blockade", "road closure", "road maintenance",
    "footpath repair", "footpath encroachment", "road encroachment",
  "road", "traffic", "highway", "bridge", "potholes", "roads",
    "transport",
  ],
  water: [
    "water supply", "water crisis", "water logging", "water shortage",
    "drinking water", "water pipeline", "sewage overflow", "drainage overflow",
    "water board", "desilting", "water contamination", "water leak",
    "water tanker", "tap water", "sewage water", "storm water drain",
    "water treatment", "water scarcity", "water pressure",
    "burst pipe", "pipeline burst", "water main",
    "sewage", "sewer", "drainage", "flood", "monsoon", "reservoir",
  ],
  sanitation: [
    "garbage", "waste management", "garbage collection", "sewage treatment",
    "street cleaning", "swachh", "waste collection", "dumping ground",
    "landfill fire", "waste segregation", "dustbin", "sanitation",
    "municipal waste", "solid waste", "biomedical waste",
    "waste plant", "waste-to-energy", "garbage truck",
    "waste", "cleanliness", "dumping", "landfill", "bin",
  ],
  electricity: [
    "power cut", "power outage", "street light", "streetlight",
    "load shedding", "power failure", "electricity board",
    "transformer fire", "faulty meter", "power restoration",
    "power supply", "electricity supply", "feeder tripping",
    "transformer blast", "wire snapped", "pole fire",
    "electricity", "power", "transformer", "grid", "discom",
  ],
};

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  for (const ex of EXCLUDE_KEYWORDS) {
    if (lower.includes(ex)) return false;
  }
  return true;
}

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

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

interface RawArticle {
  title?: string;
  description?: string;
  content?: string;
  url: string;
  urlToImage?: string | null;
  source?: { name?: string };
  publishedAt: string;
}

async function fetchFromNewsAPI(apiKey: string, query: string, from: string, pageSize: number) {
  const newsUrl =
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}` +
    `&domains=${INDIAN_DOMAINS}` +
    `&language=en` +
    `&from=${from}` +
    `&sortBy=publishedAt` +
    `&pageSize=${pageSize}` +
    `&apiKey=${apiKey}`;

  console.log("[news-api] Fetching:", newsUrl.replace(apiKey, "REDACTED"));

  const newsRes = await fetch(newsUrl);

  console.log("[news-api] NewsAPI status:", newsRes.status, newsRes.statusText);

  const rawBody = await newsRes.text();
  console.log("[news-api] NewsAPI raw response body:", rawBody.slice(0, 1000));

  if (!newsRes.ok) {
    let parsed: { message?: string; code?: string } = {};
    try { parsed = JSON.parse(rawBody); } catch { /* not JSON */ }
    console.error("[news-api] NewsAPI error:", parsed.code, parsed.message);
    return { ok: false as const, status: newsRes.status, body: parsed, rawText: rawBody };
  }

  let data: { articles?: RawArticle[]; totalResults?: number };
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error("[news-api] Failed to parse NewsAPI response as JSON");
    return { ok: false as const, status: 500, body: {}, rawText: rawBody };
  }

  console.log("[news-api] NewsAPI totalResults:", data.totalResults, "articles count:", data.articles?.length ?? 0);

  return { ok: true as const, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("NEWS_API_KEY");

    if (!apiKey) {
      console.error("[news-api] NEWS_API_KEY secret is not set");
      return new Response(
        JSON.stringify({ error: "News API key not configured. Set the NEWS_API_KEY edge function secret." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[news-api] NEWS_API_KEY found, length:", apiKey.length);

    const now = new Date();
    const fromDate = formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));

    console.log("[news-api] Using from date:", fromDate, "(last 7 days)");

    // Fire all 4 category queries in parallel, each well under the 500-char limit.
    const categoryEntries = Object.entries(CATEGORY_QUERIES);
    const results = await Promise.all(
      categoryEntries.map(([, query]) => fetchFromNewsAPI(apiKey, query, fromDate, 15)),
    );

    // Merge articles from all successful category fetches, dedup by URL.
    const seenUrls = new Set<string>();
    const merged: RawArticle[] = [];

    for (const r of results) {
      if (r.ok && r.data.articles) {
        for (const a of r.data.articles) {
          if (a.url && !seenUrls.has(a.url)) {
            seenUrls.add(a.url);
            merged.push(a);
          }
        }
      }
    }

    // Filter out irrelevant articles (finance, entertainment, oil/gas, etc.)
    const filtered = merged.filter((a) => {
      const fullText = `${a.title || ""} ${a.description || ""} ${a.content || ""}`;
      return isRelevant(fullText);
    });

    console.log("[news-api] Merged:", merged.length, "after relevance filter:", filtered.length);

    // Sort by publishedAt descending (most recent first).
    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // If all category queries returned nothing relevant, try the broad fallback.
    if (filtered.length === 0) {
      console.log("[news-api] Zero relevant results from category queries, trying fallback...");
      const fallbackFrom = formatDate(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000));
      const fallbackResult = await fetchFromNewsAPI(apiKey, FALLBACK_QUERY, fallbackFrom, 30);

      if (fallbackResult.ok && fallbackResult.data.articles) {
        for (const a of fallbackResult.data.articles) {
          if (a.url && !seenUrls.has(a.url)) {
            seenUrls.add(a.url);
            const fullText = `${a.title || ""} ${a.description || ""} ${a.content || ""}`;
            if (isRelevant(fullText)) {
              filtered.push(a);
            }
          }
        }
        filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      }

      // If still zero, try without domain restriction (but still require India in query).
      if (filtered.length === 0) {
        console.log("[news-api] Still zero results, trying without domain filter...");
        const broadUrl =
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(FALLBACK_QUERY)}` +
          `&language=en` +
          `&from=${fromDate}` +
          `&sortBy=publishedAt` +
          `&pageSize=30` +
          `&apiKey=${apiKey}`;

        console.log("[news-api] Broad fetch (no domains):", broadUrl.replace(apiKey, "REDACTED"));
        const broadRes = await fetch(broadUrl);
        console.log("[news-api] Broad fetch status:", broadRes.status);
        const broadBody = await broadRes.text();
        console.log("[news-api] Broad fetch body:", broadBody.slice(0, 500));

        if (broadRes.ok) {
          try {
            const broadData = JSON.parse(broadBody) as { articles?: RawArticle[] };
            if (broadData.articles) {
              for (const a of broadData.articles) {
                if (a.url && !seenUrls.has(a.url)) {
                  seenUrls.add(a.url);
                  const fullText = `${a.title || ""} ${a.description || ""} ${a.content || ""}`;
                  if (isRelevant(fullText)) {
                    filtered.push(a);
                  }
                }
              }
              filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            }
          } catch { /* ignore parse error */ }
        }
      }
    }

    // Check if any individual fetch returned an error (e.g. invalid key).
    const firstError = results.find((r) => !r.ok);
    if (filtered.length === 0 && firstError && !firstError.ok) {
      const errMsg = firstError.body?.message || `NewsAPI returned HTTP ${firstError.status}`;
      console.error("[news-api] Returning error to client:", errMsg);
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (filtered.length === 0) {
      console.log("[news-api] No relevant articles found after all attempts");
      return new Response(
        JSON.stringify({ articles: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cap at 30 articles total.
    const capped = filtered.slice(0, 30);

    const articles = capped.map((a, i) => ({
      id: i + 1,
      title: a.title || "Untitled",
      description: truncate(a.description || a.content || "", 200),
      url: a.url,
      image: a.urlToImage || null,
      source: a.source?.name || "Unknown",
      publishedAt: a.publishedAt,
      category: categorize(`${a.title || ""} ${a.description || ""}`),
    }));

    console.log("[news-api] Returning", articles.length, "articles to client");

    return new Response(
      JSON.stringify({ articles }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[news-api] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong fetching news: " + String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
