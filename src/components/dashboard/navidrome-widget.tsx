"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NavidromeWidgetProps, NavidromeStats } from "@/types";
import { Music, Disc, Mic2, PlayCircle, PauseCircle, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch Navidrome data");
  }
  return res.json();
};

export function NavidromeWidget({ config }: NavidromeWidgetProps) {
  const { data, error, isLoading } = useSWR<any>(
    "/api/navidrome",
    fetcher,
    {
      refreshInterval: config.refreshInterval,
    }
  );

  if (error) {
    return (
      <Card className="h-full flex flex-col border-border/50">
        <CardHeader className="py-3 px-4 border-b border-border/50">
          <div className="flex items-center space-x-2 text-primary">
            <Music className="h-4 w-4" />
            <span className="font-semibold text-sm">Navidrome</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-destructive/80 space-y-2 p-4">
          <p className="text-sm text-center">Connection Failed</p>
        </CardContent>
      </Card>
    );
  }

  // Process stats from raw scan data or placeholder
  // Since Navidrome getScanStatus returns "folderCount" and "count" (files), we might use those.
  const songCount = data?.scanStatus?.count || 0;
  const folderCount = data?.scanStatus?.folderCount || 0;
  // const artistCount = ??? (not directly available in scanStatus usually)
  
  const nowPlaying = data?.nowPlaying;

  return (
    <Card className="h-full flex flex-col border-border/50 overflow-hidden">
      <CardHeader className="py-3 px-4 border-b border-border/50 bg-secondary/10 shrink-0 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <a
            href={config.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
          >
            <Radio className="h-4 w-4" />
            <span className="font-semibold text-sm">Navidrome</span>
          </a>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 flex flex-col gap-6 overflow-hidden">
        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
           <StatItem 
             icon={<Music className="h-3 w-3" />} 
             label="Songs" 
             value={songCount} 
             loading={isLoading} 
           />
           <StatItem 
             icon={<Disc className="h-3 w-3" />} 
             label="Albums" 
             value={folderCount} 
             loading={isLoading} 
           />
             <StatItem 
             icon={<Mic2 className="h-3 w-3" />} 
             label="Artists" 
             value={data?.scanStatus?.artistCount || "-"} 
             loading={isLoading} 
           />
        </div>

        {/* Now Playing Section - Expanded */}
        {isLoading ? (
            <div className="flex-1 flex items-center gap-4 mt-2">
                <Skeleton className="h-full aspect-square rounded-lg" />
                <div className="space-y-3 flex-1 py-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </div>
        ) : nowPlaying ? (
             <div className="flex-1 flex items-center gap-5 p-4 rounded-xl bg-secondary/20 border border-border/50 overflow-hidden">
                 <div className="relative h-full aspect-square shrink-0 rounded-lg overflow-hidden shadow-md border border-border/10">
                    {/* Using standard img tag to avoid next/image issues with proxied streams */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`/api/navidrome/image/${nowPlaying.coverArt}`}
                        alt={nowPlaying.title}
                        className="h-full w-full object-cover"
                    />
                 </div>
                 <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
                     <p className="text-xl font-bold truncate leading-tight text-foreground/90">{nowPlaying.title}</p>
                     <p className="text-base text-foreground/70 truncate font-medium">{nowPlaying.artist}</p>
                     <p className="text-sm text-muted-foreground truncate">{nowPlaying.album}</p>
                 </div>
             </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 bg-secondary/10 rounded-xl border border-dashed border-border/30">
                <Music className="h-8 w-8 opacity-20" />
                <span className="text-sm italic">No music playing</span>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatItem({ icon, label, value, loading }: any) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-md bg-card/40 border border-border/20 space-y-1">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-5 w-10" />
      ) : (
        <span className="text-lg font-bold leading-none">
          {value}
        </span>
      )}
    </div>
  );
}

