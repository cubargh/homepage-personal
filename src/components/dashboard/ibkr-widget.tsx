"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { IbkrWidgetProps } from "@/types";
import { IbkrPortfolioData } from "@/lib/ibkr-client";
import { Landmark, TrendingUp, TrendingDown, Banknote, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { useWidgetData } from "@/hooks/use-widget-data";
import { useWidgetLayout } from "@/hooks/use-widget-layout";
import { WidgetError } from "@/components/dashboard/shared";

export function IbkrWidget({ config, gridSize }: IbkrWidgetProps) {
  const { data, error, isLoading, refresh, isRefreshing } = useWidgetData<IbkrPortfolioData>({
    endpoint: "/api/ibkr",
    refreshInterval: config.refreshInterval,
  });

  const { isMinimal, isCompact, isStandard } = useWidgetLayout(gridSize);

  if (error) {
    return (
      <WidgetLayout
        gridSize={gridSize}
        title="Interactive Brokers"
        icon={<Landmark className="h-4 w-4" />}
      >
        <WidgetError
          message="Connection Failed"
          hint="Check Token & Query ID"
          isMinimal={isMinimal}
        />
      </WidgetLayout>
    );
  }

  // Helper to format currency
  const formatCurrency = (val: number | undefined, currency = "USD", decimals = 0) => {
    if (val === undefined) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  // Helper to format percentage
  const formatPercent = (val: number | undefined) => {
    if (val === undefined) return "-";
    if (Math.abs(val) < 0.01) return "0.00%";
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(2)}%`;
  };

  // Helper to determine color
  const getColor = (val: number | undefined) => {
    if (val === undefined) return "text-muted-foreground";
    if (Math.abs(val) < 0.01) return "text-muted-foreground";
    return val > 0 ? "text-green-500" : "text-red-500";
  };

  const getTrendIcon = (val: number | undefined) => {
    if (val === undefined || Math.abs(val) < 0.01) return null;
    return val > 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const headerActions = (
    <button
      onClick={() => refresh()}
      className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-secondary/50"
      title="Refresh"
    >
      <RefreshCw className={cn("h-3.5 w-3.5", (isLoading || isRefreshing) && "animate-spin")} />
    </button>
  );

  // Minimal Layout (1x1): NAV only
  if (isMinimal) {
    return (
      <WidgetLayout gridSize={gridSize} contentClassName="p-0">
        <div className="flex flex-col items-center justify-center h-full p-2">
          <Landmark className="h-4 w-4 text-muted-foreground mb-1" />
          {isLoading ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <span className="text-sm font-bold">
              {formatCurrency(data?.nav, data?.currency)}
            </span>
          )}
        </div>
      </WidgetLayout>
    );
  }

  // Compact Layout (2x2): NAV + YTD
  if (isCompact) {
    return (
      <WidgetLayout gridSize={gridSize} contentClassName="p-0">
        <div className="flex flex-col items-center justify-center h-full p-3 space-y-2">
          <Landmark className="h-5 w-5 text-muted-foreground" />
          {isLoading ? (
            <>
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-4 w-16" />
            </>
          ) : (
            <>
              <span className="text-xl font-bold">
                {formatCurrency(data?.nav, data?.currency)}
              </span>
              <div
                className={cn(
                  "flex items-center gap-1 text-sm",
                  getColor(data?.performance?.ytdReturn)
                )}
              >
                {getTrendIcon(data?.performance?.ytdReturn)}
                <span>{formatPercent(data?.performance?.ytdReturn)} YTD</span>
              </div>
            </>
          )}
        </div>
      </WidgetLayout>
    );
  }

  // Standard Layout (3x2+): Full display
  return (
    <WidgetLayout
      gridSize={gridSize}
      title="Interactive Brokers"
      icon={<Landmark className="h-4 w-4" />}
      headerActions={isStandard ? headerActions : undefined}
      contentClassName="p-0"
    >
      <div className="h-full flex flex-col min-h-0">
        {/* NAV Section */}
        <div className="flex flex-col items-center justify-center py-3 px-4 border-b border-border/30">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-40" />
            </>
          ) : (
            <>
              <span className="text-2xl md:text-3xl font-bold">
                {formatCurrency(data?.nav, data?.currency)}
              </span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>Stocks: {formatCurrency(data?.stockValue)}</span>
                <span className="flex items-center gap-1">
                  <Banknote className="h-3 w-3" />
                  Cash: {formatCurrency(data?.cash, data?.currency, 2)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-card/50">
          {/* Daily Change */}
          <PerformanceCard
            label="TODAY"
            value={data?.performance?.dailyReturn}
            loading={isLoading}
            formatter={formatPercent}
            colorier={getColor}
            trendIcon={getTrendIcon}
          />
          {/* MTD */}
          <PerformanceCard
            label="MTD"
            value={data?.performance?.mtdReturn}
            loading={isLoading}
            formatter={formatPercent}
            colorier={getColor}
            trendIcon={getTrendIcon}
          />
          {/* YTD */}
          <PerformanceCard
            label="YTD"
            value={data?.performance?.ytdReturn}
            loading={isLoading}
            formatter={formatPercent}
            colorier={getColor}
            trendIcon={getTrendIcon}
          />
        </div>

        {/* Top Holdings */}
        {config.showPositions && data?.positions && data.positions.length > 0 && (
          <div className="flex-1 overflow-auto px-3 pb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Holdings
            </div>
            <div className="space-y-1.5">
              {data.positions.slice(0, config.positionCount || 5).map((pos) => (
                <div
                  key={pos.symbol}
                  className="flex items-center justify-between text-sm bg-secondary/20 rounded-md px-3 py-2"
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pos.symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {pos.quantity.toFixed(2)} @ {formatCurrency(pos.price, pos.currency, 2)}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/70 truncate">
                      {pos.description}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <span className="font-medium">
                      {formatCurrency(pos.marketValue, pos.currency)}
                    </span>
                    <span
                      className={cn(
                        "text-xs flex items-center gap-0.5",
                        getColor(pos.unrealizedPnL)
                      )}
                    >
                      {getTrendIcon(pos.unrealizedPnL)}
                      {formatCurrency(pos.unrealizedPnL, pos.currency)}
                      {pos.costBasis > 0 && (
                        <span>
                          ({((pos.unrealizedPnL / pos.costBasis) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </WidgetLayout>
  );
}

interface PerformanceCardProps {
  label: string;
  value: number | undefined;
  loading: boolean;
  formatter: (val: number | undefined) => string;
  colorier: (val: number | undefined) => string;
  trendIcon: (val: number | undefined) => React.ReactNode;
}

function PerformanceCard({
  label,
  value,
  loading,
  formatter,
  colorier,
  trendIcon,
}: PerformanceCardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md bg-secondary/20 p-2 space-y-1">
      <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
      {loading ? (
        <Skeleton className="h-5 w-14" />
      ) : (
        <span
          className={cn(
            "text-sm md:text-base font-bold leading-none flex items-center gap-1",
            colorier(value)
          )}
        >
          {trendIcon(value)}
          {formatter(value)}
        </span>
      )}
    </div>
  );
}
