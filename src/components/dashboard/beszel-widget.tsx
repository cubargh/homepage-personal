"use client";

import React from "react";
import useSWR from "swr";
import { BeszelWidgetProps, BeszelMetrics } from "@/types";
import {
  Loader2,
  AlertTriangle,
  Cpu,
  HardDrive,
  Network,
  Thermometer,
  Activity,
  Server,
  TrendingUp,
} from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch beszel data");
  }
  return res.json();
};

function formatUptime(seconds?: number): string {
  if (!seconds || seconds < 0) return "N/A";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getCpuColor(cpu?: number): string {
  if (cpu === undefined) return "text-blue-400";
  if (cpu >= 80) return "text-red-400";
  if (cpu >= 60) return "text-yellow-400";
  return "text-green-400";
}

function getCpuBgColor(cpu?: number): string {
  if (cpu === undefined) return "from-blue-500/10 to-blue-500/5";
  if (cpu >= 80) return "from-red-500/10 to-red-500/5";
  if (cpu >= 60) return "from-yellow-500/10 to-yellow-500/5";
  return "from-green-500/10 to-green-500/5";
}

function getMemoryColor(percentage?: number): string {
  if (percentage === undefined) return "text-purple-400";
  if (percentage >= 90) return "text-red-400";
  if (percentage >= 70) return "text-yellow-400";
  return "text-green-400";
}

function getMemoryBgColor(percentage?: number): string {
  if (percentage === undefined) return "from-purple-500/10 to-purple-500/5";
  if (percentage >= 90) return "from-red-500/10 to-red-500/5";
  if (percentage >= 70) return "from-yellow-500/10 to-yellow-500/5";
  return "from-green-500/10 to-green-500/5";
}

function getDiskColor(percentage: number): string {
  if (percentage >= 90) return "text-red-400";
  if (percentage >= 70) return "text-yellow-400";
  return "text-blue-400";
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 70) return "bg-yellow-500";
  return "bg-primary";
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  loading: boolean;
  gradient?: string;
  iconColor?: string;
}

function StatCard({
  icon,
  label,
  value,
  loading,
  gradient = "from-blue-500/10 to-transparent",
  iconColor = "text-blue-400",
}: StatCardProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg bg-gradient-to-br ${gradient} p-3 border border-border/30 hover:border-border/50 transition-all`}
    >
      <div className={`${iconColor} mb-2`}>{icon}</div>
      {loading ? (
        <Skeleton className="h-6 w-16 mb-1" />
      ) : (
        <span className="text-xl font-bold tracking-tight text-foreground leading-none mb-1">
          {value}
        </span>
      )}
      <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function BeszelWidget({ config, gridSize }: BeszelWidgetProps) {
  const { data, error, isLoading } = useSWR<BeszelMetrics>(
    config.enabled ? "/api/beszel" : null,
    fetcher,
    {
      refreshInterval: (config.refreshInterval || 30) * 1000,
    }
  );

  const isMinimal = gridSize ? gridSize.w === 1 && gridSize.h === 1 : false;
  const isCompactView = config.compact_view || false;

  const displayMetrics = config.display_metrics || [
    "uptime",
    "cpu",
    "memory",
    "disk",
    "network",
    "temperature",
    "load",
  ];

  const shouldShow = (metric: string) => displayMetrics.includes(metric);

  // Get display name for a disk
  const getDiskDisplayName = (diskName: string): string => {
    return config.disk_names?.[diskName] || diskName;
  };

  // Filter disks based on disk_names config
  const getFilteredDisks = (disks: BeszelMetrics["disk"]) => {
    if (!disks) return [];
    if (!config.disk_names || Object.keys(config.disk_names).length === 0) {
      return disks; // No filter applied, return all disks
    }
    return disks.filter((disk) => disk.name in (config.disk_names || {}));
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "Just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;

      const diffInHours = Math.floor(diffInSeconds / 3600);
      if (diffInHours < 24) return `${diffInHours}h ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return "Yesterday";
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const headerActions = data?.last_updated ? (
    <span className="text-[10px] text-muted-foreground">
      {formatDateTime(data.last_updated)}
    </span>
  ) : undefined;

  return (
    <WidgetLayout
      gridSize={gridSize}
      title={isCompactView ? undefined : data?.server_name || "Server Monitor"}
      icon={isCompactView ? undefined : <Server className="h-4 w-4" />}
      headerActions={isCompactView ? undefined : headerActions}
      contentClassName="p-0"
    >
      {error ? (
        <div className="h-full flex flex-col items-center justify-center text-destructive/80 space-y-2 p-4">
          <AlertTriangle className="h-8 w-8" aria-label="Error" />
          {!isMinimal && (
            <>
              <p className="text-sm font-medium">Server Monitor Unavailable</p>
              <p className="text-xs text-muted-foreground text-center">
                {error instanceof Error ? error.message : "Check configuration"}
              </p>
            </>
          )}
        </div>
      ) : isLoading || !data ? (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 p-4">
          <Loader2
            className="h-8 w-8 animate-spin"
            aria-label="Loading server data"
          />
          {!isMinimal && <p className="text-sm">Loading...</p>}
        </div>
      ) : (
        <div className="flex flex-col h-full w-full">
          {isMinimal ? (
            // 1x1 Minimal Layout - Show CPU only
            <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-blue-500/10 to-transparent p-3">
              <Cpu className="h-7 w-7 mb-2 text-blue-400" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold tracking-tighter text-foreground leading-none">
                  {data.cpu !== undefined ? `${Math.round(data.cpu)}%` : "N/A"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                  CPU
                </span>
              </div>
            </div>
          ) : isCompactView ? (
            // Compact Inline Layout - All metrics inline with wrapping (controlled by config.compact_view)
            <div className="flex flex-wrap items-center gap-3 p-3 h-full content-start">
              {displayMetrics.map((metric) => {
                if (metric === "cpu" && shouldShow("cpu")) {
                  return (
                    <div key={metric} className="flex items-center gap-1.5">
                      <Cpu className={`h-4 w-4 ${getCpuColor(data.cpu)}`} />
                      <span className="text-sm font-semibold text-foreground">
                        {data.cpu !== undefined ? (
                          <span className={getCpuColor(data.cpu)}>
                            {Math.round(data.cpu)}%
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>
                  );
                }
                if (
                  metric === "memory" &&
                  shouldShow("memory") &&
                  data.memory
                ) {
                  return (
                    <div key={metric} className="flex items-center gap-1.5">
                      <Activity
                        className={`h-4 w-4 ${getMemoryColor(
                          data.memory.percentage
                        )}`}
                      />
                      <span
                        className={`text-sm font-semibold ${getMemoryColor(
                          data.memory.percentage
                        )}`}
                      >
                        {Math.round(data.memory.percentage)}%
                      </span>
                    </div>
                  );
                }
                if (metric === "uptime" && shouldShow("uptime")) {
                  return (
                    <div key={metric} className="flex items-center gap-1.5">
                      <Server className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-semibold text-foreground">
                        {formatUptime(data.uptime)}
                      </span>
                    </div>
                  );
                }
                if (
                  metric === "disk" &&
                  shouldShow("disk") &&
                  data.disk &&
                  data.disk.length > 0
                ) {
                  const filteredDisks = getFilteredDisks(data.disk);
                  if (filteredDisks && filteredDisks.length > 0) {
                    return (
                      <React.Fragment key={metric}>
                        {filteredDisks.map((disk, idx) => (
                          <div
                            key={`${metric}-${idx}`}
                            className="flex items-center gap-1.5"
                          >
                            <HardDrive
                              className={`h-4 w-4 ${getDiskColor(
                                disk.percentage
                              )}`}
                            />
                            <span
                              className={`text-sm font-semibold ${getDiskColor(
                                disk.percentage
                              )}`}
                            >
                              {getDiskDisplayName(disk.name)}:{" "}
                              {Math.round(disk.percentage)}%
                            </span>
                          </div>
                        ))}
                      </React.Fragment>
                    );
                  }
                }
                if (
                  metric === "network" &&
                  shouldShow("network") &&
                  data.network
                ) {
                  return (
                    <div key={metric} className="flex items-center gap-1.5">
                      <Network className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-semibold text-foreground">
                        {formatBytes(data.network.bytes_recv)}
                      </span>
                    </div>
                  );
                }
                if (
                  metric === "temperature" &&
                  shouldShow("temperature") &&
                  data.temperature !== undefined
                ) {
                  return (
                    <div key={metric} className="flex items-center gap-1.5">
                      <Thermometer className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-semibold text-foreground">
                        {Math.round(data.temperature)}°C
                      </span>
                    </div>
                  );
                }
                if (metric === "load" && shouldShow("load") && data.load) {
                  return (
                    <div key={metric} className="flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">
                        {data.load.load1.toFixed(1)}/
                        {data.load.load5.toFixed(1)}/
                        {data.load.load15.toFixed(1)}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ) : (
            // Standard Layout (3x3+)
            <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
              {/* Top Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                {shouldShow("cpu") && (
                  <StatCard
                    icon={<Cpu className="h-6 w-6" />}
                    label="CPU"
                    value={
                      data.cpu !== undefined ? (
                        <span className={getCpuColor(data.cpu)}>
                          {Math.round(data.cpu)}%
                        </span>
                      ) : (
                        "N/A"
                      )
                    }
                    loading={isLoading}
                    gradient={getCpuBgColor(data.cpu)}
                    iconColor={getCpuColor(data.cpu)}
                  />
                )}
                {shouldShow("memory") && data.memory && (
                  <StatCard
                    icon={<Activity className="h-6 w-6" />}
                    label="Memory"
                    value={
                      <span className={getMemoryColor(data.memory.percentage)}>
                        {Math.round(data.memory.percentage)}%
                      </span>
                    }
                    loading={isLoading}
                    gradient={getMemoryBgColor(data.memory.percentage)}
                    iconColor={getMemoryColor(data.memory.percentage)}
                  />
                )}
                {shouldShow("uptime") && (
                  <StatCard
                    icon={<Server className="h-6 w-6" />}
                    label="Uptime"
                    value={formatUptime(data.uptime)}
                    loading={isLoading}
                    gradient="from-slate-500/10 to-transparent"
                    iconColor="text-slate-400"
                  />
                )}
              </div>

              {/* Disk Usage */}
              {shouldShow("disk") &&
                data.disk &&
                data.disk.length > 0 &&
                (() => {
                  const filteredDisks = getFilteredDisks(data.disk);
                  if (!filteredDisks || filteredDisks.length === 0) return null;
                  return (
                    <div className="space-y-3 rounded-lg bg-secondary/20 p-3 border border-border/30">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Disk Usage
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {filteredDisks.map((disk, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">
                                {getDiskDisplayName(disk.name)}
                              </span>
                              <span
                                className={`text-xs font-semibold ${getDiskColor(
                                  disk.percentage
                                )}`}
                              >
                                {Math.round(disk.percentage)}%
                              </span>
                            </div>
                            <Progress
                              value={disk.percentage}
                              className="h-2"
                              indicatorClassName={getProgressColor(
                                disk.percentage
                              )}
                            />
                            {disk.used > 0 && disk.total > 0 && (
                              <div className="text-[10px] font-medium text-muted-foreground">
                                {formatBytes(disk.used)} /{" "}
                                {formatBytes(disk.total)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              {/* Network Stats */}
              {shouldShow("network") && data.network && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent p-3 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="h-4 w-4 text-blue-400" />
                      <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                        Sent
                      </span>
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {formatBytes(data.network.bytes_sent)}
                    </div>
                    {data.network.speed_sent !== undefined && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {formatBytes(data.network.speed_sent)}/s
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-transparent p-3 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="h-4 w-4 text-green-400" />
                      <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                        Received
                      </span>
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {formatBytes(data.network.bytes_recv)}
                    </div>
                    {data.network.speed_recv !== undefined && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {formatBytes(data.network.speed_recv)}/s
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Temperature */}
              {shouldShow("temperature") && data.temperature !== undefined && (
                <div className="flex items-center justify-between rounded-lg bg-gradient-to-br from-orange-500/10 to-transparent p-3 border border-border/30">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-orange-400" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Temperature
                    </span>
                  </div>
                  <span className="text-xl font-bold text-foreground">
                    {Math.round(data.temperature)}°C
                  </span>
                </div>
              )}

              {/* Load Average */}
              {shouldShow("load") && data.load && (
                <div className="space-y-2 rounded-lg bg-secondary/20 p-3 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Load Average
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "1m", value: data.load.load1 },
                      { label: "5m", value: data.load.load5 },
                      { label: "15m", value: data.load.load15 },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex flex-col items-center justify-center rounded-md bg-background/50 p-2 border border-border/20"
                      >
                        <span className="text-[10px] text-muted-foreground mb-1 font-medium">
                          {item.label}
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {item.value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </WidgetLayout>
  );
}
