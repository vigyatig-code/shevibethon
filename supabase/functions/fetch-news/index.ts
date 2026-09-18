const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

import { createClient } from "npm:@supabase/supabase-js@2";

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

const CATEGORIES: { category: string; query: string }[] = [
  { category: "Roads", query: "roads+India+civic" },
  { category: "Water", query: "water+shortage+India" },
  { category: "Sanitation", query: "sanitation+India+civic" },
  { category: "Electricity", query: "electricity+power+outage+India" },
  { category: "Disasters & Emergencies", query: "disaster+emergency+India" },
  { category: "General Civic News", query: "civic+infrastructure+India" },
];

const MAX_ITEMS_PER_CATEGORY = 15;

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/);

    const title = titleMatch ? titleMatch[1].trim() : "";
    const link = linkMatch ? linkMatch[1].trim() : "";

    if (!title || !link) continue;

    items.push({
      title,
      link,
      pubDate: pubDateMatch ? pubDateMatch[1].trim() : "",
      source: sourceMatch ? sourceMatch[1].trim() : "Google News",
    });
  }

  return items;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let totalInserted = 0;
    const perCategory: Record<string, number> = {};

    for (const { category, query } of CATEGORIES) {
      const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

      let xml: string;
      try {
        const rssRes = await fetch(rssUrl, {
          headers: { "User-Agent": "CivicPortal/1.0" },
        });
        if (!rssRes.ok) {
          console.error(`[fetch-news] Failed to fetch RSS for ${category}: ${rssRes.status}`);
          perCategory[category] = 0;
          continue;
        }
        xml = await rssRes.text();
      } catch (err) {
        console.error(`[fetch-news] Fetch error for ${category}:`, err);
        perCategory[category] = 0;
        continue;
      }

      const items = parseRss(xml).slice(0, MAX_ITEMS_PER_CATEGORY);

      if (items.length === 0) {
        perCategory[category] = 0;
        continue;
      }

      const rows = items.map((item) => ({
        title: item.title,
        link: item.link,
        source: item.source,
        category,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      }));

      const { data: upsertData, error: upsertError } = await supabase
        .from("news")
        .upsert(rows, { onConflict: "link", ignoreDuplicates: true })
        .select();

      if (upsertError) {
        console.error(`[fetch-news] Upsert error for ${category}:`, upsertError.message);
        perCategory[category] = 0;
        continue;
      }

      const inserted = upsertData?.length ?? 0;
      totalInserted += inserted;
      perCategory[category] = inserted;
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalInserted,
        perCategory,
        fetchedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[fetch-news] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
