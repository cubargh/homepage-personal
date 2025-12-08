"use client";

import useSWR from "swr";
import { SpeedtestTrackerWidgetProps, SpeedtestTrackerData } from "@/types";
import { 
  Loader2, 
  AlertTriangle, 
  Download, 
  Upload, 
  Activity,
  Wifi
} from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch speedtest data");
  }
  return res.json();
};

export function SpeedtestTrackerWidget({ config, gridSize }: SpeedtestTrackerWidgetProps) {
  const { data, error, isLoading } = useSWR<SpeedtestTrackerData>(
    "/api/speedtest-tracker",
    fetcher,
    {
      refreshInterval: config.refreshInterval,
    }
  );

  // Layout modes:
  // - Minimal: 1x1 (single metric)
  // - Compact: 2x2 (all metrics compact)
  // - Standard: 3x3+ (full layout)
  const isMinimal = gridSize ? (gridSize.w === 1 && gridSize.h === 1) : false;
  const isCompact = gridSize ? (gridSize.w === 2 && gridSize.h === 2) : false;

  const formatSpeed = (value: number | null | undefined): string | React.ReactNode => {
    if (value === null || value === undefined) return "-";
    return (
      <>
        {Math.round(value)} <span className="text-xs opacity-70">Mbps</span>
      </>
    );
  };

  const formatPing = (value: number | null | undefined): string | React.ReactNode => {
    if (value === null || value === undefined) return "-";
    return (
      <>
        {value.toFixed(2)} <span className="text-xs opacity-70">ms</span>
      </>
    );
  };

  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      // Check if date is invalid
      if (isNaN(date.getTime())) return "";
      
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return "Yesterday";
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      // For older dates, show formatted date
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return "";
    }
  };

  const headerActions = data?.createdAt ? (
    <span className="text-[10px] text-muted-foreground">
      {formatDateTime(data.createdAt)}
    </span>
  ) : undefined;

  return (
    <WidgetLayout
      gridSize={gridSize}
      title="Speedtest"
      icon={<Wifi className="h-4 w-4" />}
      headerActions={headerActions}
      contentClassName="p-0"
    >
      {error ? (
        <div className="h-full flex flex-col items-center justify-center text-destructive/80 space-y-2 p-4">
          <AlertTriangle className="h-8 w-8" aria-label="Error" />
          {!isMinimal && (
            <>
              <p className="text-sm">Speedtest Unavailable</p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Check URL"}
              </p>
            </>
          )}
        </div>
      ) : isLoading || !data ? (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 p-4">
          <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading speedtest data" />
          {!isMinimal && <p className="text-sm">Loading...</p>}
        </div>
      ) : (
        <div className="flex flex-col h-full w-full">
          {isMinimal ? (
            // 1x1 Minimal Layout - Show ping only
            <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-blue-500/10 to-transparent p-2">
              <Activity className="h-6 w-6 mb-1 text-blue-400" />
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold tracking-tighter text-foreground leading-none flex items-baseline gap-1">
                  {formatPing(data.ping)}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Ping
                </span>
              </div>
            </div>
          ) : isCompact ? (
            // 2x2 Compact Layout - Show all metrics in a grid
            <div className="grid grid-cols-2 gap-2 p-3 h-full">
              <MetricCard
                icon={<Download className="h-4 w-4" />}
                label="Download"
                value={formatSpeed(data.download)}
                loading={isLoading}
                color="text-blue-400"
              />
              <MetricCard
                icon={<Upload className="h-4 w-4" />}
                label="Upload"
                value={formatSpeed(data.upload)}
                loading={isLoading}
                color="text-green-400"
              />
              <MetricCard
                icon={<Activity className="h-4 w-4" />}
                label="Ping"
                value={formatPing(data.ping)}
                loading={isLoading}
                color="text-purple-400"
                span={2}
              />
            </div>
          ) : (
            // Standard Layout (3x3+)
            <div className="flex flex-col h-full p-4 gap-4">
              <div className="grid grid-cols-3 gap-3 flex-1">
                <MetricCard
                  icon={<Download className="h-5 w-5" />}
                  label="Download"
                  value={formatSpeed(data.download)}
                  loading={isLoading}
                  color="text-blue-400"
                  large
                />
                <MetricCard
                  icon={<Upload className="h-5 w-5" />}
                  label="Upload"
                  value={formatSpeed(data.upload)}
                  loading={isLoading}
                  color="text-green-400"
                  large
                />
                <MetricCard
                  icon={<Activity className="h-5 w-5" />}
                  label="Ping"
                  value={formatPing(data.ping)}
                  loading={isLoading}
                  color="text-purple-400"
                  large
                />
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetLayout>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  loading: boolean;
  color: string;
  span?: number;
  large?: boolean;
}

function MetricCard({ icon, label, value, loading, color, span = 1, large = false }: MetricCardProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-md bg-secondary/20 p-3 space-y-2 ${
        span === 2 ? "col-span-2" : ""
      }`}
    >
      <div className={`${color} flex items-center gap-1.5`}>
        {icon}
        <span className={`text-[10px] uppercase tracking-wider font-medium text-muted-foreground`}>
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className={`${large ? "h-8 w-24" : "h-6 w-20"}`} />
      ) : (
        <span className={`${large ? "text-2xl" : "text-lg"} font-bold leading-none text-foreground flex items-baseline gap-1`}>
          {value}
        </span>
      )}
    </div>
  );
}

