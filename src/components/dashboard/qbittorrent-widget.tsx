"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { QBittorrentWidgetProps, QBittorrentData, QBittorrentTorrent } from "@/types";
import { ArrowDown, ArrowUp, Download, Upload, Pause, AlertCircle, CheckCircle, Clock } from "lucide-react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch qBittorrent data");
  }
  return res.json();
};

const formatSpeed = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B/s`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB/s`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB/s`;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GiB`;
};

const formatEta = (seconds: number) => {
  if (seconds >= 8640000) return "∞";
  if (seconds <= 0) return "--";
  if (seconds > 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  return `${Math.floor(seconds / 60)}m`;
};

const getStatusIcon = (state: string) => {
  switch (state) {
    case "uploading":
    case "stalledUP":
    case "forcedUP":
    case "checkingUP":
      return <Upload className="h-4 w-4 text-blue-500" />;
    case "downloading":
    case "forcedDL":
    case "checkingDL":
      return <Download className="h-4 w-4 text-green-500" />;
    case "pausedDL":
    case "pausedUP":
      return <Pause className="h-4 w-4 text-yellow-500" />;
    case "queuedDL":
    case "queuedUP":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "error":
    case "missingFiles":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      if (state.includes("UP")) return <Upload className="h-4 w-4 text-blue-500" />;
      return <Download className="h-4 w-4 text-green-500" />;
  }
};

export function QBittorrentWidget({ config }: QBittorrentWidgetProps) {
  const { data, error, isLoading } = useSWR<QBittorrentData>(
    "/api/qbittorrent",
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
            <Download className="h-4 w-4" />
            <span className="font-semibold text-sm">qBittorrent</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-destructive/80 space-y-2 p-4">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm text-center">Connection Failed</p>
        </CardContent>
      </Card>
    );
  }

  // Determine what to show
  // If there are downloads, show them. Else show top uploads? 
  // For now let's just show downloads as per "default" mode behavior usually expected.
  // If we want to be fancy, we can toggle.

  const activeDownloads = Array.isArray(data?.leeching) ? data.leeching : (data?.torrents || []);
  
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
            <Download className="h-4 w-4" />
            <span className="font-semibold text-sm">qBittorrent</span>
          </a>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-px bg-border/50 border-b border-border/50">
          <div className="bg-card p-3 flex flex-col items-center justify-center">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground uppercase tracking-wider mb-1">
              <ArrowDown className="h-3 w-3" />
              <span>Down</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <span className="text-lg font-bold text-green-500">
                {formatSpeed(data?.transfer?.dl_info_speed || data?.transfer?.dlSpeed || 0)}
              </span>
            )}
          </div>
          <div className="bg-card p-3 flex flex-col items-center justify-center">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground uppercase tracking-wider mb-1">
              <ArrowUp className="h-3 w-3" />
              <span>Up</span>
            </div>
             {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <span className="text-lg font-bold text-blue-500">
                {formatSpeed(data?.transfer?.up_info_speed || data?.transfer?.upSpeed || 0)}
              </span>
            )}
          </div>
        </div>
        
        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-px bg-border/50 border-b border-border/50">
           <div className="bg-card p-2 flex items-center justify-center space-x-2">
             <span className="text-xs text-muted-foreground">Leeching:</span>
             {isLoading ? <Skeleton className="h-4 w-4"/> : <span className="text-sm font-semibold">{Array.isArray(data?.leeching) ? data.leeching.length : (data?.leeching || 0)}</span>}
           </div>
           <div className="bg-card p-2 flex items-center justify-center space-x-2">
             <span className="text-xs text-muted-foreground">Seeding:</span>
             {isLoading ? <Skeleton className="h-4 w-4"/> : <span className="text-sm font-semibold">{Array.isArray(data?.seeding) ? data.seeding.length : (data?.seeding || 0)}</span>}
           </div>
        </div>

        {/* List Area */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="space-y-2 p-2">
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-2 w-full" />
                </div>
              ))
            ) : activeDownloads.length > 0 ? (
              activeDownloads.map((torrent: QBittorrentTorrent) => (
                <div key={torrent.hash} className="bg-secondary/20 rounded-md p-2 space-y-2 text-sm">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(torrent.state)}
                      <span className="font-medium truncate w-[95%]">{torrent.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                       {formatEta(torrent.eta)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatSize(torrent.size)}</span>
                      <span>{formatSpeed(torrent.dlspeed)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${torrent.progress * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground space-y-2">
                <CheckCircle className="h-8 w-8 opacity-50" />
                <span className="text-xs">No active downloads</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

