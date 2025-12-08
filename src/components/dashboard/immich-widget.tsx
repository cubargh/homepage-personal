"use client";

import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { ImmichWidgetProps, ImmichStats } from "@/types";
import {
  Image as ImageIcon,
  Video,
  HardDrive,
  AlertTriangle,
} from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch Immich data");
  }
  return res.json();
};

export function ImmichWidget({ config, gridSize }: ImmichWidgetProps) {
  const { data, error, isLoading } = useSWR<ImmichStats>(
    "/api/immich",
    fetcher,
    {
      refreshInterval: config.refreshInterval,
    }
  );

  // Determine layout modes based on gridSize
  // Compact: 1x1, 2x1, 1x2, 2x2 (smaller sizes)
  // Standard: 3x3+ (larger sizes)
  const isCompact = gridSize ? gridSize.w <= 2 && gridSize.h <= 2 : false;
  const isStandard = !isCompact;

  if (error) {
    return (
      <WidgetLayout
        gridSize={gridSize}
        title={isCompact ? undefined : "Immich"}
        icon={isCompact ? undefined : <ImageIcon className="h-4 w-4" />}
      >
        <div className="flex flex-col items-center justify-center text-destructive/80 space-y-2 h-full">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm text-center">Connection Failed</p>
          <p className="text-xs text-muted-foreground text-center">
            Check API Key & URL
          </p>
        </div>
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
            <StatItem
              icon={<ImageIcon className="h-5 w-5" />}
              label="Photos"
              value={data?.photos}
              loading={isLoading}
              compact={true}
            />
          </div>
        ) : (
          // Standard Layout: Grid of all stats
          <div className="grid grid-cols-3 gap-2 p-4 bg-card/50 h-full">
            <StatItem
              icon={<ImageIcon className="h-4 w-4" />}
              label="Photos"
              value={data?.photos}
              loading={isLoading}
              compact={false}
            />
            <StatItem
              icon={<Video className="h-4 w-4" />}
              label="Videos"
              value={data?.videos}
              loading={isLoading}
              compact={false}
            />
            <StatItem
              icon={<HardDrive className="h-4 w-4" />}
              label="Usage"
              value={`${usageGB} GB`}
              loading={isLoading}
              compact={false}
            />
          </div>
        )}
      </div>
    </WidgetLayout>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number | string | undefined;
  loading: boolean;
  compact?: boolean;
}

function StatItem({
  icon,
  label,
  value,
  loading,
  compact = false,
}: StatItemProps) {
  if (compact) {
    // Compact layout: Larger, more prominent display
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="text-muted-foreground mb-2">{icon}</div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <span className="text-2xl font-bold leading-none text-foreground">
            {value ?? 0}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-2">
          {label}
        </span>
      </div>
    );
  }

  // Standard layout: Grid of stats
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-md bg-secondary/20 space-y-1.5 h-full">
      <div className="text-muted-foreground">{icon}</div>
      {loading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        <span className="text-lg md:text-xl font-bold leading-none text-foreground">
          {value ?? 0}
        </span>
      )}
      <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );
}
