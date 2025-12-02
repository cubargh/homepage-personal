import { NextRequest, NextResponse } from "next/server";
import { loadConfig, RSSWidgetConfig } from "@/lib/config";
import { normalizeWidgetConfig } from "@/lib/widget-config-utils";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: ["dc:creator", "comments"],
  },
  requestOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RSS Reader/1.0)",
      "Accept": "application/rss+xml, application/xml, text/xml, */*",
    },
    timeout: 10000, // 10 second timeout
  },
});

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to retry with exponential backoff
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const feed = await parser.parseURL(url);
      return feed;
    } catch (error: any) {
      // Check if it's a rate limit error
      if (error.code === "ECONNRESET" || error.statusCode === 429) {
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = baseDelay * Math.pow(2, attempt);
          console.log(
            `Rate limited for ${url}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`
          );
          await delay(delayMs);
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function GET(request: NextRequest) {
  const config = loadConfig();
  
  // Handle both single config and array of configs
  const rssConfigs = normalizeWidgetConfig<RSSWidgetConfig>(
    config.widgets.rss
  ).filter((c) => c.enabled);

  if (rssConfigs.length === 0) {
    return NextResponse.json(
      { error: "RSS configuration missing or disabled" },
      { status: 500 }
    );
  }

  try {
    // Aggregate all feeds from all RSS widget instances
    const allFeeds: string[] = [];
    let maxItems = 20; // Default
    rssConfigs.forEach((rssConfig) => {
      if (rssConfig.feeds) {
        allFeeds.push(...rssConfig.feeds);
      }
      // Use the highest maxItems value from all configs
      if (rssConfig.maxItems && rssConfig.maxItems > maxItems) {
        maxItems = rssConfig.maxItems;
      }
    });

    if (allFeeds.length === 0) {
      return NextResponse.json(
        { error: "RSS feeds not configured" },
        { status: 500 }
      );
    }

    // Parse feed URLs and colors from config (format: "url" or "hexcolor;url")
    const feedConfigs = allFeeds.map((feedConfig: string) => {
      const trimmed = feedConfig.trim();
      const parts = trimmed.split(';');
      let feedUrl: string;
      let color: string | null = null;
      
      if (parts.length === 2) {
        // Format: "hexcolor;url"
        color = parts[0].trim() || null;
        feedUrl = parts[1].trim();
      } else {
        // Format: "url" (no color)
        feedUrl = parts[0].trim();
      }
      
      return { feedUrl, color };
    }).filter(config => config.feedUrl.length > 0);

    // Process feeds sequentially with delays to avoid rate limiting
    const feedResults = [];
    for (let i = 0; i < feedConfigs.length; i++) {
      const { feedUrl, color } = feedConfigs[i];
      
      // Add delay between requests to avoid rate limiting (except for first request)
      if (i > 0) {
        await delay(500); // 500ms delay between feeds
      }

      try {
        const feed = await fetchWithRetry(feedUrl);

        const items = (feed.items || []).slice(0, maxItems || 10).map((item: any) => {
          // Extract author from various possible fields
          const author =
            item.creator ||
            item["dc:creator"] ||
            item.author ||
            item["dc:author"] ||
            "";

          // Clean description - strip HTML tags
          let description = item.contentSnippet || item.content || item.description || "";
          // Remove HTML tags if present
          description = description.replace(/<[^>]*>/g, "").trim();
          // Limit length
          description = description.substring(0, 200);

          return {
            title: item.title || "No title",
            link: item.link || "",
            description: description,
            pubDate: item.pubDate || item.isoDate || "",
            author: author,
            feedColor: color, // Pass color to items
          };
        });

        feedResults.push({
          feedUrl,
          feedTitle: feed.title || feedUrl,
          feedColor: color,
          items,
        });
      } catch (error: any) {
        console.error(`Error processing RSS feed ${feedUrl}:`, error);
        // Continue processing other feeds even if one fails
        feedResults.push(null);
      }
    }
    const validFeeds = feedResults.filter((feed) => feed !== null);

    // Combine all items and sort by date (newest first)
    const allItems = validFeeds.flatMap((feed) =>
      feed.items.map((item: any) => ({
        ...item,
        feedTitle: feed.feedTitle,
        feedUrl: feed.feedUrl,
        feedColor: feed.feedColor || item.feedColor || null, // Preserve color from feed or item
      }))
    );

    // Sort by date (parse dates and sort)
    allItems.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA; // Newest first
    });

    // Limit total items
    const limitedItems = allItems.slice(0, maxItems);

    return NextResponse.json({
      feeds: validFeeds,
      items: limitedItems,
    });
  } catch (error) {
    console.error("RSS fetch error:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch RSS feeds: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
