const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const INDIAN_DOMAINS =
  "thehindu.com,timesofindia.indiatimes.com,ndtv.com,indianexpress.com,hindustantimes.com,deccanherald.com,news18.com,livemint.com,indiatoday.in,scroll.in,thequint.com";

// Per-category queries — each well under NewsAPI's 500-char limit.
const CATEGORY_QUERIES: Record<string, string> = {
  roads: '(pothole OR "road damage" OR "road repair" OR streetlight OR traffic OR highway OR bridge OR flyover OR footpath OR "road accident" OR "traffic jam")',
  water: '("water supply" OR "water leak" OR "water crisis" OR drainage OR sewer OR flood OR "water logging" OR pipeline OR "water board" OR desilting OR contamination)',
  sanitation: '(garbage OR "waste management" OR sanitation OR "garbage collection" OR landfill OR dumping OR "sewage treatment" OR "street cleaning" OR swachh OR dustbin)',
  electricity: '("power outage" OR "power cut" OR "street light" OR streetlight OR electricity OR transformer OR "load shedding" OR "power failure" OR discom OR grid)',
};

const FALLBACK_QUERY = "(civic OR municipal OR infrastructure OR city OR sanitation OR roads OR water OR electricity OR garbage OR traffic)";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  roads: [
    "pothole", "road", "traffic", "transport", "highway", "bridge",
    "flyover", "footpath", "sidewalk", "speed breaker", "road repair", "road damage",
    "road accident", "traffic jam", "ring road", "expressway",
  ],
  water: [
    "water", "drain", "flood", "pipeline", "sewage", "monsoon",
    "reservoir", "leak", "water supply", "water board", "water logging", "desilting",
    "water crisis", "tanker", "contamination",
  ],
  sanitation: [
    "garbage", "waste", "sanitation", "cleanliness", "swachh",
    "dumping", "landfill", "bin", "waste management", "dustbin",
    "garbage collection", "sewage treatment", "street cleaning",
  ],
  electricity: [
    "streetlight", "street light", "electricity", "power", "transformer",
    "grid", "lamp", "led", "power outage", "power cut",
    "load shedding", "discom",
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

    // Sort by publishedAt descending (most recent first).
    merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    console.log("[news-api] Merged unique articles after parallel fetch:", merged.length);

    // If all category queries returned nothing, try the broad fallback.
    if (merged.length === 0) {
      console.log("[news-api] Zero results from all category queries, trying fallback...");
      const fallbackFrom = formatDate(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000));
      const fallbackResult = await fetchFromNewsAPI(apiKey, FALLBACK_QUERY, fallbackFrom, 30);

      if (fallbackResult.ok && fallbackResult.data.articles) {
        for (const a of fallbackResult.data.articles) {
          if (a.url && !seenUrls.has(a.url)) {
            seenUrls.add(a.url);
            merged.push(a);
          }
        }
        merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      }

      // If still zero, try without domain restriction.
      if (merged.length === 0) {
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
                  merged.push(a);
                }
              }
              merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            }
          } catch { /* ignore parse error */ }
        }
      }
    }

    // Check if any individual fetch returned an error (e.g. invalid key).
    const firstError = results.find((r) => !r.ok);
    if (merged.length === 0 && firstError && !firstError.ok) {
      const errMsg = firstError.body?.message || `NewsAPI returned HTTP ${firstError.status}`;
      console.error("[news-api] Returning error to client:", errMsg);
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (merged.length === 0) {
      console.log("[news-api] No articles found after all attempts");
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
