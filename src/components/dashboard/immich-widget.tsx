"use client";

import { ImmichWidgetProps, ImmichStats } from "@/types";
import { Image as ImageIcon, Video, HardDrive } from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { useWidgetData } from "@/hooks/use-widget-data";
import { useWidgetLayout } from "@/hooks/use-widget-layout";
import { WidgetError, StatCard } from "@/components/dashboard/shared";

export function ImmichWidget({ config, gridSize }: ImmichWidgetProps) {
  const { data, error, isLoading } = useWidgetData<ImmichStats>({
    endpoint: "/api/immich",
    refreshInterval: config.refreshInterval,
  });

  const { isCompact, isStandard } = useWidgetLayout(gridSize);

  if (error) {
    return (
      <WidgetLayout
        gridSize={gridSize}
        title={isCompact ? undefined : "Immich"}
        icon={isCompact ? undefined : <ImageIcon className="h-4 w-4" />}
      >
        <WidgetError
          message="Connection Failed"
          hint="Check API Key & URL"
        />
      </WidgetLayout>
    );
  }

  // Format usage to GB
  const usageGB = data && data.usage ? (data.usage / 1073741824).toFixed(1) : "0.0";

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
      title={isCompact ? undefined : "Immich"}
      icon={isCompact ? undefined : <ImageIcon className="h-4 w-4" />}
      headerActions={isStandard ? headerActions : undefined}
      contentClassName="p-0"
    >
      <div className="h-full flex flex-col justify-center min-h-0">
        {isCompact ? (
          // Compact Layout: Show only photos count, large display
          <div className="flex flex-col items-center justify-center h-full p-2 space-y-1">
            <StatCard
              icon={<ImageIcon className="h-5 w-5" />}
              label="Photos"
              value={data?.photos}
              loading={isLoading}
              compact
            />
          </div>
        ) : (
          // Standard Layout: Grid of all stats
          <div className="grid grid-cols-3 gap-2 p-4 bg-card/50 h-full">
            <StatCard
              icon={<ImageIcon className="h-4 w-4" />}
              label="Photos"
              value={data?.photos}
              loading={isLoading}
            />
            <StatCard
              icon={<Video className="h-4 w-4" />}
              label="Videos"
              value={data?.videos}
              loading={isLoading}
            />
            <StatCard
              icon={<HardDrive className="h-4 w-4" />}
              label="Usage"
              value={`${usageGB} GB`}
              loading={isLoading}
            />
          </div>
        )}
      </div>
    </WidgetLayout>
  );
}
