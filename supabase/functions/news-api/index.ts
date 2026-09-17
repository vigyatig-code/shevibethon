const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const INDIAN_DOMAINS =
  "thehindu.com,timesofindia.indiatimes.com,ndtv.com,indianexpress.com,hindustantimes.com,deccanherald.com,news18.com,indiatoday.in,scroll.in,thequint.com";

const CATEGORY_QUERIES: Record<string, string> = {
  roads: 'India AND (pothole OR "road damage" OR "road repair" OR "traffic jam" OR flyover OR footpath OR "road accident" OR "pothole repair" OR "broken road" OR "crater road")',
  water: 'India AND ("water supply" OR "water crisis" OR "water logging" OR "water shortage" OR "drinking water" OR "water pipeline" OR "sewage overflow" OR "drainage overflow" OR "water board" OR desilting)',
  sanitation: 'India AND (garbage OR "waste management" OR "garbage collection" OR "sewage treatment" OR "street cleaning" OR swachh OR "waste collection" OR "dumping ground" OR "landfill fire" OR "waste segregation")',
  electricity: 'India AND ("power cut" OR "power outage" OR "street light" OR streetlight OR "load shedding" OR "power failure" OR "electricity board" OR "transformer fire" OR "faulty meter" OR "power restoration")',
  disasters: 'India AND (flood OR landslide OR cyclone OR "building collapse" OR "bridge collapse" OR "urban flooding" OR deluge OR cloudburst OR avalanche OR earthquake OR "dam breach" OR embankment OR "flood alert" OR "flood warning" OR "disaster relief" OR "relief camp" OR evacuation OR "NDRF" OR "fire accident" OR "factory fire" OR "wildfire" OR "heat wave" OR cold wave)',
};

const FALLBACK_QUERY = 'India AND (municipal OR civic OR "city infrastructure" OR "urban governance" OR "public works" OR municipality OR corporation OR "smart city")';

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
  "suicide", "suicidal", "self-harm", "self harm", "took own life", "ended life",
  "obituary", "obituaries", "passed away", "funeral", "cremation", "condolence",
  "murder", "homicide", "assault case", "stabbed", "strangled",
  "rape", "sexual assault", "molestation", "harassment case",
  "kidnap", "abduction case",
  "robbery", "theft case", "burglary", "looted",
  "arrested for", "charged with", "convicted of", "sentenced to",
  "drug overdose", "narcotics", "drug bust", "drug cartel",
  "domestic violence", "dowry death", "honor killing", "honour killing",
  "road rage", "hit-and-run", "hit and run", "drunk driving",
  "body found", "dead body", "corpse",
  "personal tragedy", "grief", "mourning",
  "missing person", "missing girl", "missing boy", "missing child",
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  roads: [
    "pothole", "road damage", "road repair", "traffic jam", "road accident",
    "flyover", "footpath", "broken road", "crater road", "speed breaker",
    "road cave", "pothole repair", "footbridge", "ring road", "expressway",
    "carriageway", "bitumen", "road widening", "road construction",
    "traffic signal", "road blockade", "road closure", "road maintenance",
    "footpath repair", "footpath encroachment", "road encroachment",
    "road", "traffic", "highway", "bridge", "potholes", "roads", "transport",
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
  disasters: [
    "flood", "landslide", "cyclone", "building collapse", "bridge collapse",
    "urban flooding", "deluge", "cloudburst", "avalanche", "earthquake",
    "dam breach", "embankment", "flood alert", "flood warning",
    "disaster relief", "relief camp", "evacuation", "ndrf",
    "fire accident", "factory fire", "wildfire", "heat wave", "cold wave",
    "storm damage", "roof collapse", "wall collapse", "structure collapse",
    "mudslide", "flash flood", "river overflow", "dam overflow",
    "flooded", "inundation", "waterlogged", "marooned",
    "rescue operations", "airdropped", "relief material",
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
  // Check disasters first so flood/landslide articles don't get swallowed by water category.
  if (CATEGORY_KEYWORDS.disasters.some((kw) => lower.includes(kw))) return "disasters";
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === "disasters") continue;
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

// Progressive date windows: 7 days, then 14, then 30.
const DATE_WINDOWS_DAYS = [7, 14, 30];

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

async function fetchCategoryWithProgressiveDates(
  apiKey: string,
  query: string,
  now: Date,
  pageSize: number,
): Promise<{ articles: RawArticle[]; error?: { status: number; body: { message?: string } } }> {
  for (const days of DATE_WINDOWS_DAYS) {
    const from = formatDate(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
    console.log(`[news-api] Trying ${days}-day window for category query`);
    const result = await fetchFromNewsAPI(apiKey, query, from, pageSize);

    if (!result.ok) {
      // If it's an error like invalid key, return immediately
      return { articles: [], error: { status: result.status, body: result.body } };
    }

    const articles = (result.data.articles || []).filter((a) => {
      const fullText = `${a.title || ""} ${a.description || ""} ${a.content || ""}`;
      return isRelevant(fullText);
    });

    console.log(`[news-api] ${days}-day window: ${result.data.articles?.length ?? 0} raw, ${articles.length} after filter`);

    if (articles.length > 0) {
      return { articles };
    }
    // If zero after filter, try the next wider window
  }

  return { articles: [] };
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

    // Fire all 4 category queries in parallel, each with progressive date widening.
    const categoryEntries = Object.entries(CATEGORY_QUERIES);
    const results = await Promise.all(
      categoryEntries.map(async ([cat, query]) => {
        const result = await fetchCategoryWithProgressiveDates(apiKey, query, now, 15);
        return { cat, ...result };
      }),
    );

    // Merge articles from all successful category fetches, dedup by URL.
    const seenUrls = new Set<string>();
    const merged: RawArticle[] = [];
    let firstError: { status: number; body: { message?: string } } | null = null;

    for (const r of results) {
      if (r.error && !firstError) firstError = r.error;
      for (const a of r.articles) {
        if (a.url && !seenUrls.has(a.url)) {
          seenUrls.add(a.url);
          merged.push(a);
        }
      }
    }

    console.log("[news-api] Merged unique relevant articles after all category fetches:", merged.length);

    // Sort by publishedAt descending (most recent first).
    merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // If all category queries returned nothing relevant, try the broad fallback with progressive dates.
    if (merged.length === 0) {
      console.log("[news-api] Zero results from all category queries, trying fallback...");
      for (const days of DATE_WINDOWS_DAYS) {
        const from = formatDate(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
        console.log(`[news-api] Fallback: trying ${days}-day window`);
        const fallbackResult = await fetchFromNewsAPI(apiKey, FALLBACK_QUERY, from, 30);

        if (fallbackResult.ok && fallbackResult.data.articles) {
          for (const a of fallbackResult.data.articles) {
            if (a.url && !seenUrls.has(a.url)) {
              seenUrls.add(a.url);
              const fullText = `${a.title || ""} ${a.description || ""} ${a.content || ""}`;
              if (isRelevant(fullText)) {
                merged.push(a);
              }
            }
          }
          if (merged.length > 0) break;
        }
      }

      // If still zero, try without domain restriction (but still require India in query).
      if (merged.length === 0) {
        console.log("[news-api] Still zero results, trying without domain filter...");
        for (const days of DATE_WINDOWS_DAYS) {
          const from = formatDate(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
          const broadUrl =
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(FALLBACK_QUERY)}` +
            `&language=en` +
            `&from=${from}` +
            `&sortBy=publishedAt` +
            `&pageSize=30` +
            `&apiKey=${apiKey}`;

          console.log(`[news-api] Broad fetch (no domains, ${days}d):`, broadUrl.replace(apiKey, "REDACTED"));
          const broadRes = await fetch(broadUrl);
          console.log("[news-api] Broad fetch status:", broadRes.status);
          const broadBody = await broadRes.text();

          if (broadRes.ok) {
            try {
              const broadData = JSON.parse(broadBody) as { articles?: RawArticle[] };
              if (broadData.articles) {
                for (const a of broadData.articles) {
                  if (a.url && !seenUrls.has(a.url)) {
                    seenUrls.add(a.url);
                    const fullText = `${a.title || ""} ${a.description || ""} ${a.content || ""}`;
                    if (isRelevant(fullText)) {
                      merged.push(a);
                    }
                  }
                }
                if (merged.length > 0) break;
              }
            } catch { /* ignore parse error */ }
          }
        }
        merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      }
    }

    if (merged.length === 0 && firstError) {
      const errMsg = firstError.body?.message || `NewsAPI returned HTTP ${firstError.status}`;
      console.error("[news-api] Returning error to client:", errMsg);
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (merged.length === 0) {
      console.log("[news-api] No relevant articles found after all attempts");
      return new Response(
        JSON.stringify({ articles: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cap at 30 articles total.
    const capped = merged.slice(0, 30);

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
