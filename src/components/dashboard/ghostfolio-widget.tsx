"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GhostfolioWidgetProps, GhostfolioStats } from "@/types";
import { TrendingUp, AlertTriangle, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch Ghostfolio data");
  }
  return res.json();
};

export function GhostfolioWidget({ config }: GhostfolioWidgetProps) {
  const { data, error, isLoading } = useSWR<GhostfolioStats>(
    "/api/ghostfolio",
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
            <LineChart className="h-4 w-4" />
            <span className="font-semibold text-sm">Ghostfolio</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-destructive/80 space-y-2 p-4">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm text-center">Connection Failed</p>
          <p className="text-xs text-muted-foreground text-center">
            Check Token & URL
          </p>
        </CardContent>
      </Card>
    );
  }

  // Helper to format percentage
  const formatPercent = (val: number | undefined) => {
    if (val === undefined) return "-";
    if (Math.abs(val) < 0.0001) return "0.00%"; // Handle -0.00 case
    return `${(val * 100).toFixed(2)}%`;
  };

  // Helper to determine color
  const getColor = (val: number | undefined) => {
    if (val === undefined) return "text-muted-foreground";
    if (Math.abs(val) < 0.0001) return "text-muted-foreground"; // Treat ~0 as 0
    return val > 0 ? "text-green-500" : "text-red-500";
  };

  const getArrow = (val: number | undefined) => {
    if (val === undefined) return null;
    if (Math.abs(val) < 0.0001) return null; // No arrow for 0
    return val > 0 ? "↑" : "↓";
  };

  const displayMetrics = config.display_metrics || [
    "today",
    "month",
    "year",
    "total",
  ];

  // Calculate grid columns dynamically based on metrics count
  const gridCols = displayMetrics.length;
  // Ensure we don't break grid if 0 or too many (though usually max 5)
  // We can use style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}

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
            <LineChart className="h-4 w-4" />
            <span className="font-semibold text-sm">Ghostfolio</span>
          </a>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col justify-center min-h-0">
        <div
          className="grid gap-2 p-4 bg-card/50 h-full"
          style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
        >
          {displayMetrics.includes("today") && (
            <StatItem
              label="TODAY"
              value={data?.performance?.["1d"]?.relativeChange}
              loading={isLoading}
              formatter={formatPercent}
              colorier={getColor}
              arrower={getArrow}
            />
          )}
          {displayMetrics.includes("week") && (
            <StatItem
              label="WEEK"
              value={data?.performance?.["7d"]?.relativeChange}
              loading={isLoading}
              formatter={formatPercent}
              colorier={getColor}
              arrower={getArrow}
            />
          )}
          {displayMetrics.includes("month") && (
            <StatItem
              label="MONTH"
              value={
                data?.performance?.["30d"]?.relativeChange ??
                data?.performance?.["28d"]?.relativeChange
              }
              loading={isLoading}
              formatter={formatPercent}
              colorier={getColor}
              arrower={getArrow}
            />
          )}
          {displayMetrics.includes("year") && (
            <StatItem
              label="YEAR"
              value={data?.performance?.ytd?.relativeChange}
              loading={isLoading}
              formatter={formatPercent}
              colorier={getColor}
              arrower={getArrow}
            />
          )}
          {displayMetrics.includes("total") && (
            <StatItem
              label="TOTAL"
              value={data?.performance?.max?.relativeChange}
              loading={isLoading}
              formatter={formatPercent}
              colorier={getColor}
              arrower={getArrow}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({
  label,
  value,
  loading,
  formatter,
  colorier,
  arrower,
}: any) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-md bg-secondary/20 space-y-1.5 h-full">
      <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
      {loading ? (
        <Skeleton className="h-6 w-16" />
      ) : (
        <span
          className={cn(
            "text-lg md:text-xl font-bold leading-none flex items-center gap-1",
            colorier(value)
          )}
        >
          {formatter(value)}
          <span className="text-xs">{arrower(value)}</span>
        </span>
      )}
    </div>
  );
}
