"use client";

import { useState } from "react";
import useSWR from "swr";
import { RSSWidgetProps } from "@/types";
import { Rss, ExternalLink, Calendar, User, RefreshCw } from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { cn, formatTime } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch RSS feeds");
  return res.json();
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author: string;
  feedTitle: string;
  feedUrl: string;
  feedColor?: string | null;
}

export function RSSWidget({ config, gridSize }: RSSWidgetProps) {
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  
  const isCompact = gridSize ? gridSize.h <= 2 : false;
  const viewMode = config.view || "full";
  const wrap = config.wrap ?? true; // Default to true

  const { data, error, isLoading, mutate } = useSWR<{
    feeds: Array<{ feedUrl: string; feedTitle: string; items: RSSItem[] }>;
    items: RSSItem[];
  }>("/api/rss", fetcher, {
    refreshInterval: config.refreshInterval || 60000 * 5, // Default 5 minutes
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter items by selected feed
  const displayItems = selectedFeed
    ? data?.items.filter((item) => item.feedUrl === selectedFeed) || []
    : data?.items || [];

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);

      // Show relative time for recent items
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return diffInMinutes < 1 ? "Just now" : `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else if (diffInDays === 1) {
        return "Yesterday";
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        // For older items, show formatted date
        return formatTime(dateString, "MMM d, yyyy", config.timezone);
      }
    } catch {
      return dateString;
    }
  };

  if (isCompact) {
    // Compact mode: Show only the latest item
    const latestItem = displayItems[0];
    
    return (
      <WidgetLayout
        gridSize={gridSize}
        title={undefined}
        icon={undefined}
        contentClassName="p-0"
      >
        <div className="h-full flex flex-col justify-center p-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : error ? (
            <div className="text-center text-destructive text-sm">
              Failed to load
            </div>
          ) : latestItem ? (
            <div className="flex flex-col gap-2">
              {viewMode !== "minimal" && (
                <div className="text-xs text-muted-foreground uppercase tracking-wider truncate">
                  {latestItem.feedTitle}
                </div>
              )}
              <a
                href={latestItem.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "font-medium text-sm hover:text-primary transition-colors block",
                  wrap ? "line-clamp-2" : "truncate max-w-[95%]"
                )}
              >
                {latestItem.title}
              </a>
              {viewMode === "full" && latestItem.pubDate && (
                <div className="text-xs text-muted-foreground">
                  {formatDate(latestItem.pubDate)}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm">
              No items
            </div>
          )}
        </div>
      </WidgetLayout>
    );
  }

  // Standard mode: Show list of items
  const headerActions = (
    <div className="flex items-center gap-2">
      {/* Feed filter dropdown */}
      {data?.feeds && data.feeds.length > 1 && (
        <Select
          value={selectedFeed || "all"}
          onValueChange={(value) => setSelectedFeed(value === "all" ? null : value)}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Select feed" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Feeds</SelectItem>
            {data.feeds.map((feed) => (
              <SelectItem key={feed.feedUrl} value={feed.feedUrl}>
                {feed.feedTitle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={cn(
          "p-1.5 rounded transition-colors",
          "hover:bg-secondary/50 text-muted-foreground hover:text-foreground",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        title="Refresh feeds"
        aria-label="Refresh feeds"
      >
        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      </button>
    </div>
  );

  return (
    <WidgetLayout
      gridSize={gridSize}
      title="RSS Feeds"
      icon={<Rss className="h-5 w-5" />}
      headerActions={headerActions}
      contentClassName="p-0"
    >
      <ScrollArea className="h-full">
        <div className={cn("p-4", viewMode === "minimal" ? "space-y-0" : "space-y-3")}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              Loading feeds...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-destructive text-sm">
              Failed to load RSS feeds
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              No items found
            </div>
          ) : (
            displayItems.map((item, index) => (
              <a
                key={`${item.feedUrl}-${index}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "block rounded-lg border border-border/40 bg-card/50 hover:bg-secondary/10 hover:border-primary/20 transition-all group relative",
                  viewMode === "minimal" 
                    ? "p-2 border-b border-border/30 last:border-b-0" 
                    : "p-3"
                )}
              >
                {/* Vertical color bar */}
                {item.feedColor && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                    style={{ backgroundColor: item.feedColor }}
                  />
                )}
                
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4
                      className={cn(
                        "font-medium group-hover:text-primary transition-colors",
                        viewMode === "minimal" ? "text-sm" : "text-sm",
                        wrap 
                          ? "line-clamp-2" 
                          : "truncate max-w-[95%]"
                      )}
                    >
                      {item.title}
                    </h4>
                    {viewMode === "full" && item.feedTitle && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {item.feedTitle}
                      </div>
                    )}
                  </div>
                  {viewMode === "full" && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

                {viewMode === "full" && item.description && (
                  <p
                    className={cn(
                      "text-xs text-muted-foreground mb-2 mt-2",
                      wrap ? "line-clamp-2" : "truncate max-w-[95%]"
                    )}
                  >
                    {item.description}
                  </p>
                )}

                {viewMode === "full" && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    {item.pubDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.pubDate)}</span>
                      </div>
                    )}
                    {item.author && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{item.author}</span>
                      </div>
                    )}
                  </div>
                )}

                {viewMode === "concise" && (
                  <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
                    {item.feedTitle && (
                      <span className="truncate">{item.feedTitle}</span>
                    )}
                    {item.pubDate && (
                      <>
                        {item.feedTitle && <span>•</span>}
                        <span>{formatDate(item.pubDate)}</span>
                      </>
                    )}
                  </div>
                )}
              </a>
            ))
          )}
        </div>
      </ScrollArea>
    </WidgetLayout>
  );
}

