"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { JellyfinWidgetProps, JellyfinStats, JellyfinItem } from "@/types";
import { Tv, Play, Film } from "lucide-react";
import { useWidgetData } from "@/hooks/use-widget-data";
import { WidgetError, StatCard } from "@/components/dashboard/shared";

interface JellyfinResponse {
  stats: JellyfinStats;
  latestMovies: JellyfinItem[];
  latestShows: JellyfinItem[];
}

export function JellyfinWidget({ config }: JellyfinWidgetProps) {
  const { data, error, isLoading } = useWidgetData<JellyfinResponse>({
    endpoint: "/api/jellyfin",
    refreshInterval: config.refreshInterval,
  });

  if (error) {
    return (
      <Card className="h-full flex flex-col border-border/50">
        <CardHeader className="py-3 px-4 border-b border-border/50">
          <div className="flex items-center space-x-2 text-primary">
            <Film className="h-4 w-4" />
            <span className="font-semibold text-sm">Jellyfin</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4">
          <WidgetError
            message="Connection Failed"
            hint="Check API Key & URL"
          />
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats;
  const latestMovies = data?.latestMovies || [];
  const latestShows = data?.latestShows || [];

  return (
    <Card className="h-full flex flex-col border-border/50 overflow-hidden">
      <CardHeader className="py-3 px-4 border-b border-border/50 bg-secondary/10 shrink-0">
        <div className="flex items-center justify-between">
          <a
            href={config.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
          >
            <Film className="h-4 w-4" />
            <span className="font-semibold text-sm">Jellyfin</span>
          </a>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 p-4 border-b border-border/30 bg-card/50">
          <StatCard
            icon={<Film className="h-3 w-3" />}
            label="Movies"
            value={stats?.MovieCount}
            loading={isLoading}
          />
          <StatCard
            icon={<Tv className="h-3 w-3" />}
            label="Shows"
            value={stats?.SeriesCount}
            loading={isLoading}
          />
          <StatCard
            icon={<Play className="h-3 w-3" />}
            label="Episodes"
            value={stats?.EpisodeCount}
            loading={isLoading}
          />
        </div>

        {/* Content Area - Vertically Stacked */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-6">
            {/* Movies Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                <Film className="h-3 w-3 mr-1.5" /> Latest Movies
              </h4>
              {isLoading ? (
                <MediaGridSkeleton />
              ) : (
                <MediaGrid items={latestMovies} type="Movie" />
              )}
            </div>

            {/* Shows Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                <Tv className="h-3 w-3 mr-1.5" /> Latest Shows
              </h4>
              {isLoading ? (
                <MediaGridSkeleton />
              ) : (
                <MediaGrid items={latestShows} type="Series" />
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function MediaGrid({ items, type }: { items: JellyfinItem[]; type: string }) {
  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-xs py-4 bg-secondary/10 rounded-md">
        No recent {type === "Movie" ? "movies" : "shows"}.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.Id}
          className="group relative aspect-[2/3] bg-secondary/20 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all border border-border/20"
        >
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/jellyfin/image/${item.Id}?type=Primary`}
            alt={item.Name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity flex flex-col justify-end p-2.5">
            <h3 className="text-white text-xs font-semibold line-clamp-2 leading-tight mb-0.5">
              {item.Name}
            </h3>
            <p className="text-[9px] text-white/70">
              {item.DateCreated
                ? formatDistanceToNow(parseISO(item.DateCreated), {
                    addSuffix: true,
                  })
                : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MediaGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="aspect-[2/3] rounded-md overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
