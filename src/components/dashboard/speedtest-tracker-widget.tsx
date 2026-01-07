"use client";

import { SpeedtestTrackerWidgetProps, SpeedtestTrackerData } from "@/types";
import { Download, Upload, Activity, Wifi } from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { useWidgetData } from "@/hooks/use-widget-data";
import { useWidgetLayout } from "@/hooks/use-widget-layout";
import { WidgetError, WidgetLoading, StatCard } from "@/components/dashboard/shared";

export function SpeedtestTrackerWidget({ config, gridSize }: SpeedtestTrackerWidgetProps) {
  const { data, error, isLoading } = useWidgetData<SpeedtestTrackerData>({
    endpoint: "/api/speedtest-tracker",
    refreshInterval: config.refreshInterval,
  });

  const { isMinimal, isCompact } = useWidgetLayout(gridSize);

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

      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
        <WidgetError
          message="Speedtest Unavailable"
          hint={error instanceof Error ? error.message : "Check URL"}
          isMinimal={isMinimal}
        />
      ) : isLoading || !data ? (
        <WidgetLoading message={isMinimal ? undefined : "Loading..."} />
      ) : (
        <div className="flex flex-col h-full w-full">
          {isMinimal ? (
            // 1x1 Minimal Layout - Show ping only
            <div className="flex flex-col items-center justify-center h-full w-full p-2">
              <StatCard
                icon={<Activity className="h-6 w-6" />}
                label="Ping"
                value={formatPing(data.ping)}
                loading={false}
                compact
                iconColor="text-blue-400"
                gradient="from-blue-500/10 to-transparent"
              />
            </div>
          ) : isCompact ? (
            // 2x2 Compact Layout - Show all metrics in a grid
            <div className="grid grid-cols-2 gap-2 p-3 h-full">
              <StatCard
                icon={<Download className="h-4 w-4" />}
                label="Download"
                value={formatSpeed(data.download)}
                loading={isLoading}
                iconColor="text-blue-400"
                gradient="from-blue-500/10 to-transparent"
              />
              <StatCard
                icon={<Upload className="h-4 w-4" />}
                label="Upload"
                value={formatSpeed(data.upload)}
                loading={isLoading}
                iconColor="text-green-400"
                gradient="from-green-500/10 to-transparent"
              />
              <StatCard
                icon={<Activity className="h-4 w-4" />}
                label="Ping"
                value={formatPing(data.ping)}
                loading={isLoading}
                iconColor="text-purple-400"
                gradient="from-purple-500/10 to-transparent"
                span={2}
              />
            </div>
          ) : (
            // Standard Layout (3x3+)
            <div className="flex flex-col h-full p-4 gap-4">
              <div className="grid grid-cols-3 gap-3 flex-1">
                <StatCard
                  icon={<Download className="h-5 w-5" />}
                  label="Download"
                  value={formatSpeed(data.download)}
                  loading={isLoading}
                  large
                  iconColor="text-blue-400"
                  gradient="from-blue-500/10 to-transparent"
                />
                <StatCard
                  icon={<Upload className="h-5 w-5" />}
                  label="Upload"
                  value={formatSpeed(data.upload)}
                  loading={isLoading}
                  large
                  iconColor="text-green-400"
                  gradient="from-green-500/10 to-transparent"
                />
                <StatCard
                  icon={<Activity className="h-5 w-5" />}
                  label="Ping"
                  value={formatPing(data.ping)}
                  loading={isLoading}
                  large
                  iconColor="text-purple-400"
                  gradient="from-purple-500/10 to-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetLayout>
  );
}
