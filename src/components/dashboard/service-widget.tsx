"use client";

import { useRef } from "react";
import useSWR from "swr";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServiceConfig, ServiceStatus, ServiceWidgetProps } from "@/types";
import { Activity, Globe } from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { cn } from "@/lib/utils";
import { TARGET_CELL_WIDTH } from "@/config/grid";

// Constants
const GRID_GAP = "8px";
const CONTAINER_PADDING = "4px";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch service status");
  }
  return res.json();
};

interface ServiceItemProps {
  service: ServiceConfig;
  refreshInterval: number;
  compactMode: boolean;
  columns?: number; // Number of columns (to check if = 1)
  rows?: number; // Number of rows (to check if = 1)
  clickBehavior?: "new_tab" | "same_tab";
}

function ServiceItem({
  service,
  refreshInterval,
  compactMode,
  columns,
  rows,
  clickBehavior = "new_tab",
}: ServiceItemProps) {
  const { data, isLoading } = useSWR<ServiceStatus>(
    `/api/status?url=${encodeURIComponent(service.url)}`,
    fetcher,
    {
      refreshInterval: refreshInterval,
    }
  );

  const isUp = data?.status === "UP";

  // Logic to determine icon URL
  let iconUrl: string | null = null;

  if (service.icon) {
    if (service.icon.startsWith("http") || service.icon.startsWith("https")) {
      iconUrl = service.icon;
    } else {
      // Use selfh.st icons (using GitHub CDN)
      iconUrl = `https://cdn.jsdelivr.net/gh/selfhst/icons/png/${service.icon}.png`;
    }
  }

  const linkProps = clickBehavior === "new_tab" 
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  return (
    <a
      href={service.url}
      {...linkProps}
      className="block group"
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className={cn(
          "flex items-center justify-center border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200 relative overflow-hidden group-hover:shadow-lg group-hover:shadow-primary/5",
          compactMode ? "p-1.5" : "p-2"
        )}
        style={{
          // Fixed pill sizes: 1x1 (square) for compact mode, 3x1 (rectangular) for standard mode
          // Fill 100% of container width, maintain aspect ratio for height
          width: "100%",
          height: `${
            TARGET_CELL_WIDTH * (columns === 1 || rows === 1 ? 0.8 : 1)
          }px`,
          maxWidth: "100%",
          maxHeight: `${
            TARGET_CELL_WIDTH * (columns === 1 || rows === 1 ? 0.8 : 1)
          }px`,
          margin: 0, // Remove any default margins that might cause spacing
          flexShrink: 0, // Prevent pills from shrinking
          // Maintain aspect ratio: 1x1 for compact, 3x1 for standard
          aspectRatio: compactMode ? "1 / 1" : "3 / 1",
        }}
      >
        {compactMode ? (
          // Compact Mode: Only icon and status dot, centered
          <>
            <div className="relative flex items-center justify-center shrink-0 max-w-full max-h-full w-[85%] h-[85%]">
              {iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iconUrl}
                  alt={service.name}
                  className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback =
                      e.currentTarget.parentElement?.querySelector(
                        ".icon-fallback"
                      );
                    if (fallback) {
                      fallback.classList.remove("hidden");
                    }
                  }}
                />
              ) : null}
              <div
                className={cn(
                  "text-primary/80 icon-fallback",
                  iconUrl && "hidden"
                )}
              >
                <Globe className="w-full h-full" />
              </div>
            </div>
            <div className="absolute top-1 right-1 z-10">
              {isLoading ? (
                <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                      {isUp && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isUp ? "bg-emerald-500" : "bg-destructive"
                        }`}
                      ></span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-xs">{service.name}</p>
                      <p className="font-mono text-xs">
                        {data ? `Latency: ${data.latency}ms` : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isUp ? "Operational" : "Offline"}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </>
        ) : (
          // Standard Mode: Full layout with name and status
          <>
            <div className="flex items-center min-w-0 gap-2 flex-1 z-10">
              <div className="relative flex items-center justify-center shrink-0 rounded-md bg-black/20 border border-white/5 aspect-square p-2 w-12 h-12">
                {iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconUrl}
                    alt={service.name}
                    className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback =
                        e.currentTarget.parentElement?.querySelector(
                          ".icon-fallback"
                        );
                      if (fallback) {
                        fallback.classList.remove("hidden");
                      }
                    }}
                  />
                ) : null}
                <div
                  className={cn(
                    "text-primary/80 p-1 icon-fallback",
                    iconUrl && "hidden"
                  )}
                >
                  <Globe className="w-full h-full" />
                </div>
              </div>
              <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                <p className="font-medium text-foreground/90 group-hover:text-primary transition-colors truncate tracking-wide text-xs lg:text-sm">
                  {service.name}
                </p>
                <div className="flex items-center gap-1.5">
                  {isLoading ? (
                    <span className="text-[10px] text-muted-foreground animate-pulse">
                      Checking...
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-medium ${
                        isUp ? "text-emerald-500" : "text-destructive"
                      }`}
                    >
                      {isUp ? "Operational" : "Offline"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center shrink-0 ml-2 z-10">
              {isLoading ? (
                <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                      {isUp && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isUp ? "bg-emerald-500" : "bg-destructive"
                        }`}
                      ></span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="font-mono text-xs">
                      {data ? `Latency: ${data.latency}ms` : "N/A"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </>
        )}

        {/* Subtle gradient glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:via-primary/5 group-hover:to-primary/10 transition-all duration-500 opacity-0 group-hover:opacity-100" />
      </div>
    </a>
  );
}

export function ServiceWidget({
  services,
  config,
  gridSize,
}: ServiceWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const compactMode = config.compactMode;

  // Calculate columns: use "auto" to calculate optimal columns based on number of services
  const calculateColumns = (): number => {
    if (config.columns === "auto") {
      const totalServices = services.length;
      if (totalServices === 0) return 2; // Default fallback

      // If rows is explicitly set, calculate columns to fit all services in that many rows
      if (typeof config.rows === "number") {
        // Calculate how many pills fit per row
        return Math.ceil(totalServices / config.rows);
      }

      // If rows is not set, use default calculation
      if (compactMode) {
        // Compact mode: 1x1 pills, calculate optimal columns for square-ish grid
        // For example: 4 services -> 2x2, 6 services -> 3x2, 9 services -> 3x3
        const sqrt = Math.sqrt(totalServices);
        return Math.ceil(sqrt);
      } else {
        // Standard mode: 3x1 pills, calculate based on services
        // Try to create a balanced layout
        if (totalServices <= 3) return 1;
        if (totalServices <= 6) return 2;
        if (totalServices <= 9) return 3;
        // For more services, calculate optimal columns
        const sqrt = Math.sqrt(totalServices);
        return Math.ceil(sqrt);
      }
    }
    return config.columns;
  };

  const columns = calculateColumns();

  // Calculate rows: use "auto" to calculate based on number of services and columns
  const calculateRows = (): number => {
    if (config.rows === "auto") {
      const totalServices = services.length;
      if (totalServices === 0) return 1;

      if (compactMode) {
        // Compact mode: 1x1 pills, simple calculation
        return Math.ceil(totalServices / columns);
      } else {
        // Standard mode: 3x1 pills, calculate rows based on services and columns
        // In standard mode, columns represents number of pills per row
        return Math.ceil(totalServices / columns);
      }
    }
    if (typeof config.rows === "number") {
      return config.rows;
    }
    // If rows not specified (undefined), show all services
    const totalServices = services.length;
    return Math.ceil(totalServices / columns);
  };

  const numRows = calculateRows();

  // Limit visible services if rows is explicitly set (not auto or undefined)
  // Otherwise show all services and let the grid scroll
  const visibleServices =
    typeof config.rows === "number"
      ? services.slice(0, numRows * columns)
      : services;

  // Calculate cell size multiplier: 80% when single column/row, 100% otherwise
  const cellSizeMultiplier = columns === 1 || numRows === 1 ? 0.8 : 1;

  // Use fixed row height based on TARGET_CELL_WIDTH
  // This ensures pills maintain fixed size regardless of widget dimensions
  const rowHeight = TARGET_CELL_WIDTH * cellSizeMultiplier;

  return (
    <TooltipProvider>
      <WidgetLayout
        gridSize={gridSize}
        title={compactMode ? undefined : "Service Status"}
        icon={compactMode ? undefined : <Activity className="h-5 w-5" />}
        contentClassName="p-0"
      >
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto scrollbar-hide"
          style={{ padding: CONTAINER_PADDING }}
        >
          <div
            className="grid w-full"
            style={{
              // Use fixed-size columns based on pill width
              // Each column should be the width of one grid cell (TARGET_CELL_WIDTH)
              gridTemplateColumns: compactMode
                ? `repeat(${columns}, ${
                    TARGET_CELL_WIDTH * cellSizeMultiplier
                  }px)`
                : `repeat(${columns * 3}, ${
                    TARGET_CELL_WIDTH * cellSizeMultiplier
                  }px)`,
              // Use gridTemplateRows when rows is explicitly set, otherwise use gridAutoRows
              ...(typeof config.rows === "number"
                ? { gridTemplateRows: `repeat(${numRows}, ${rowHeight}px)` }
                : { gridAutoRows: `${rowHeight}px` }),
              gap: GRID_GAP,
            }}
          >
            {visibleServices.map((service) => {
              // In standard mode, each pill spans 3 columns
              const gridColumnSpan = compactMode ? 1 : 3;
              return (
                <div
                  key={service.url}
                  style={{
                    gridColumn: `span ${gridColumnSpan}`,
                    padding: 0,
                    margin: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "stretch",
                    justifyContent: "stretch",
                  }}
                >
                  <ServiceItem
                    service={service}
                    refreshInterval={config.refreshInterval}
                    compactMode={compactMode}
                    columns={columns}
                    rows={numRows}
                    clickBehavior={config.click_behavior}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </WidgetLayout>
    </TooltipProvider>
  );
}
