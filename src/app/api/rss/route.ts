import { NextRequest, NextResponse } from "next/server";
import { loadConfig, RSSWidgetConfig } from "@/lib/config";
import { normalizeWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";
import { cached } from "@/lib/cache";
import Parser from "rss-parser";
import crypto from "crypto";

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

interface RSSFeedItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  description?: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  "dc:creator"?: string;
  author?: string;
  "dc:author"?: string;
}

interface RSSFeed {
  title?: string;
  items?: RSSFeedItem[];
}

interface ParsedFeedConfig {
  feedUrl: string;
  color: string | null;
}

interface ProcessedFeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author: string;
  feedColor: string | null;
}

interface ProcessedFeed {
  feedUrl: string;
  feedTitle: string;
  feedColor: string | null;
  items: ProcessedFeedItem[];
}

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to retry with exponential backoff
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<RSSFeed> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const feed = await parser.parseURL(url);
      return feed as RSSFeed;
    } catch (error) {
      const errorObj = error as { code?: string; statusCode?: number };
      // Check if it's a rate limit error
      if (errorObj.code === "ECONNRESET" || errorObj.statusCode === 429) {
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = baseDelay * Math.pow(2, attempt);
          console.warn(
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

function parseFeedConfig(feedConfig: string): ParsedFeedConfig | null {
  const trimmed = feedConfig.trim();
  const parts = trimmed.split(";");
  let feedUrl: string;
  let color: string | null = null;

  if (parts.length === 2) {
    color = parts[0].trim() || null;
    feedUrl = parts[1].trim();
  } else {
    feedUrl = parts[0].trim();
  }

  if (!feedUrl) return null;

  return { feedUrl, color };
}

function processFeedItem(item: RSSFeedItem, color: string | null): ProcessedFeedItem {
  const author =
    item.creator ||
    item["dc:creator"] ||
    item.author ||
    item["dc:author"] ||
    "";

  let description = item.contentSnippet || item.content || item.description || "";
  description = description.replace(/<[^>]*>/g, "").trim();
  description = description.substring(0, 200);

  return {
    title: item.title || "No title",
    link: item.link || "",
    description,
    pubDate: item.pubDate || item.isoDate || "",
    author,
    feedColor: color,
  };
}

// Cache RSS feeds for 5 minutes
export const revalidate = 300;

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const config = loadConfig();

  const rssConfigs = normalizeWidgetConfig<RSSWidgetConfig>(
    config.widgets.rss
  ).filter((c) => c.enabled);

  if (rssConfigs.length === 0) {
    throw new ApiError(
      "RSS configuration missing or disabled",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  // Aggregate all feeds from all RSS widget instances
  const allFeeds: string[] = [];
  let maxItems = 20; // Default
  rssConfigs.forEach((rssConfig) => {
    if (rssConfig.feeds) {
      allFeeds.push(...rssConfig.feeds);
    }
    if (rssConfig.maxItems && rssConfig.maxItems > maxItems) {
      maxItems = rssConfig.maxItems;
    }
  });

  if (allFeeds.length === 0) {
    throw new ApiError(
      "RSS feeds not configured",
      500,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  // Create cache key based on feeds and maxItems
  const cacheKey = `rss:${crypto.createHash("md5").update(JSON.stringify({ feeds: allFeeds, maxItems })).digest("hex")}`;

  const result = await cached(
    cacheKey,
    async () => {
      // Parse feed URLs and colors from config
      const feedConfigs = allFeeds
        .map(parseFeedConfig)
        .filter((config): config is ParsedFeedConfig => config !== null);

      // Process feeds sequentially with delays to avoid rate limiting
      const feedResults: (ProcessedFeed | null)[] = [];
      for (let i = 0; i < feedConfigs.length; i++) {
        const { feedUrl, color } = feedConfigs[i];

        // Add delay between requests to avoid rate limiting (except for first request)
        if (i > 0) {
          await delay(500); // 500ms delay between feeds
        }

        try {
          const feed = await fetchWithRetry(feedUrl);
          const items = (feed.items || [])
            .slice(0, maxItems || 10)
            .map((item) => processFeedItem(item, color));

          feedResults.push({
            feedUrl,
            feedTitle: feed.title || feedUrl,
            feedColor: color,
            items,
          });
        } catch (error) {
          console.error(`Error processing RSS feed ${feedUrl}:`, error);
          // Continue processing other feeds even if one fails
          feedResults.push(null);
        }
      }

      const validFeeds = feedResults.filter(
        (feed): feed is ProcessedFeed => feed !== null
      );

      // Combine all items and sort by date (newest first)
      const allItems: (ProcessedFeedItem & {
        feedTitle: string;
        feedUrl: string;
      })[] = validFeeds.flatMap((feed) =>
        feed.items.map((item) => ({
          ...item,
          feedTitle: feed.feedTitle,
          feedUrl: feed.feedUrl,
          feedColor: feed.feedColor || item.feedColor || null,
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

      return {
        feeds: validFeeds,
        items: limitedItems,
      };
    },
    300000 // 5 minutes cache
  );

  const response = NextResponse.json(result);
  response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return response;
});
