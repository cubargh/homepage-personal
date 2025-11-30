"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImmichWidgetProps, ImmichStats } from "@/types";
import { Image as ImageIcon, Video, HardDrive, AlertTriangle } from "lucide-react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch Immich data");
  }
  return res.json();
};

export function ImmichWidget({ config }: ImmichWidgetProps) {
  const { data, error, isLoading } = useSWR<ImmichStats>(
    "/api/immich",
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
            <ImageIcon className="h-4 w-4" />
            <span className="font-semibold text-sm">Immich</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-destructive/80 space-y-2 p-4">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm text-center">Connection Failed</p>
          <p className="text-xs text-muted-foreground text-center">
            Check API Key & URL
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format usage to GB
  const usageGB = data ? (data.usage / 1073741824).toFixed(1) : "0.0";

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
            <ImageIcon className="h-4 w-4" />
            <span className="font-semibold text-sm">Immich</span>
          </a>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col justify-center min-h-0">
        <div className="grid grid-cols-3 gap-2 p-4 bg-card/50">
          <StatItem
            icon={<ImageIcon className="h-4 w-4" />}
            label="Photos"
            value={data?.photos}
            loading={isLoading}
          />
          <StatItem
            icon={<Video className="h-4 w-4" />}
            label="Videos"
            value={data?.videos}
            loading={isLoading}
          />
          <StatItem
            icon={<HardDrive className="h-4 w-4" />}
            label="Usage"
            value={`${usageGB} GB`}
            loading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ icon, label, value, loading }: any) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-md bg-secondary/20 space-y-1.5 h-full">
      <div className="text-muted-foreground">{icon}</div>
      {loading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        <span className="text-lg md:text-xl font-bold leading-none text-foreground">{value ?? 0}</span>
      )}
      <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );
}

