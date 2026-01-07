"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { GhostfolioWidgetProps, GhostfolioStats } from "@/types";
import { LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { useWidgetData } from "@/hooks/use-widget-data";
import { useWidgetLayout } from "@/hooks/use-widget-layout";
import { WidgetError } from "@/components/dashboard/shared";

export function GhostfolioWidget({ config, gridSize }: GhostfolioWidgetProps) {
  const { data, error, isLoading } = useWidgetData<GhostfolioStats>({
    endpoint: "/api/ghostfolio",
    refreshInterval: config.refreshInterval,
  });

  const { isCompact, isStandard } = useWidgetLayout(gridSize);

  if (error) {
    return (
      <WidgetLayout
        gridSize={gridSize}
        title="Ghostfolio"
        icon={<LineChart className="h-4 w-4" />}
      >
        <WidgetError
          message="Connection Failed"
          hint="Check Token & URL"
        />
      </WidgetLayout>
    );
  }

  // Helper to format percentage
  const formatPercent = (val: number | undefined) => {
    if (val === undefined) return "-";
    if (Math.abs(val) < 0.0001) return "0.00%";
    return `${(val * 100).toFixed(2)}%`;
  };

  // Helper to determine color
  const getColor = (val: number | undefined) => {
    if (val === undefined) return "text-muted-foreground";
    if (Math.abs(val) < 0.0001) return "text-muted-foreground";
    return val > 0 ? "text-green-500" : "text-red-500";
  };

  const getArrow = (val: number | undefined) => {
    if (val === undefined) return null;
    if (Math.abs(val) < 0.0001) return null;
    return val > 0 ? "↑" : "↓";
  };

  const displayMetrics = config.display_metrics || [
    "today",
    "month",
    "year",
    "total",
  ];

  // Filter metrics based on available space
  let visibleMetrics = displayMetrics;
  if (isCompact) {
    visibleMetrics = displayMetrics.slice(0, 1);
  }

  const gridCols = visibleMetrics.length;

  const headerActions = (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-primary transition-colors text-xs"
    >
      View →
    </a>
  );

  return (
    <WidgetLayout
      gridSize={gridSize}
      title={isCompact ? undefined : "Ghostfolio"}
      icon={isCompact ? undefined : <LineChart className="h-4 w-4" />}
      headerActions={isStandard ? headerActions : undefined}
      contentClassName="p-0"
    >
      <div className="h-full flex flex-col justify-center min-h-0">
        {isCompact ? (
          // Compact Layout: Single metric, large display
          <div className="flex flex-col items-center justify-center h-full p-2 space-y-1">
            {visibleMetrics.includes("today") && (
              <StatItem
                label="TODAY"
                value={data?.performance?.["1d"]?.relativeChange}
                loading={isLoading}
                formatter={formatPercent}
                colorier={getColor}
                arrower={getArrow}
                compact
              />
            )}
          </div>
        ) : (
          // Standard Layout: Grid of all metrics
          <div
            className="grid gap-2 p-4 bg-card/50 h-full"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            }}
          >
            {visibleMetrics.includes("today") && (
              <StatItem
                label="TODAY"
                value={data?.performance?.["1d"]?.relativeChange}
                loading={isLoading}
                formatter={formatPercent}
                colorier={getColor}
                arrower={getArrow}
              />
            )}
            {visibleMetrics.includes("week") && (
              <StatItem
                label="WEEK"
                value={data?.performance?.["7d"]?.relativeChange}
                loading={isLoading}
                formatter={formatPercent}
                colorier={getColor}
                arrower={getArrow}
              />
            )}
            {visibleMetrics.includes("month") && (
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
            {visibleMetrics.includes("year") && (
              <StatItem
                label="YEAR"
                value={data?.performance?.ytd?.relativeChange}
                loading={isLoading}
                formatter={formatPercent}
                colorier={getColor}
                arrower={getArrow}
              />
            )}
            {visibleMetrics.includes("total") && (
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
        )}
      </div>
    </WidgetLayout>
  );
}

interface StatItemProps {
  label: string;
  value: number | undefined;
  loading: boolean;
  formatter: (val: number | undefined) => string;
  colorier: (val: number | undefined) => string;
  arrower: (val: number | undefined) => string | null;
  compact?: boolean;
}

function StatItem({
  label,
  value,
  loading,
  formatter,
  colorier,
  arrower,
  compact = false,
}: StatItemProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
          {label}
        </span>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <span
            className={cn(
              "text-2xl font-bold leading-none flex items-center gap-1",
              colorier(value)
            )}
          >
            {formatter(value)}
            <span className="text-sm">{arrower(value)}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-md bg-secondary/20 space-y-1.5 h-full p-3">
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
