"use client";

import { useState } from "react";
import useSWR from "swr";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServiceConfig, ServiceStatus, ServiceWidgetProps } from "@/types";
import { Activity, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { cn } from "@/lib/utils";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch service status');
    }
    return res.json();
};

interface ServiceItemProps {
  service: ServiceConfig;
  refreshInterval: number;
  compact?: boolean;
}

function ServiceItem({ service, refreshInterval, compact }: ServiceItemProps) {
  const { data, error, isLoading } = useSWR<ServiceStatus>(
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

  return (
    <a 
      href={service.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block group h-full"
    >
      <div className={cn(
        "flex items-center justify-between border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200 h-full relative overflow-hidden group-hover:shadow-lg group-hover:shadow-primary/5",
        compact ? "p-1.5" : "p-2 lg:p-3"
      )}>
        <div className="flex items-center min-w-0 gap-3 flex-1 z-10">
          <div className={cn(
            "relative flex items-center justify-center shrink-0 rounded-md bg-black/20 border border-white/5",
            compact ? "w-6 h-6 p-0.5" : "w-8 h-8 lg:w-9 lg:h-9 p-1"
          )}>
              {iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                      src={iconUrl} 
                      alt={service.name} 
                      className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                      onError={(e) => {
                          // Fallback to Globe on error
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                  />
              ) : null}
              <div className={`text-primary/80 ${iconUrl ? 'hidden' : ''} ${compact ? 'p-0.5' : 'p-1.5'}`}>
                  <Globe className="h-full w-full" />
              </div>
          </div>
          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
            <p className={cn(
              "font-medium text-foreground/90 group-hover:text-primary transition-colors truncate tracking-wide",
              compact ? "text-[10px]" : "text-xs lg:text-sm"
            )}>{service.name}</p>
            <div className="flex items-center gap-1.5">
                {isLoading ? (
                    <span className="text-[10px] text-muted-foreground animate-pulse">Checking...</span>
                ) : (
                    <span className={`text-[10px] font-medium ${isUp ? 'text-emerald-500' : 'text-destructive'}`}>
                        {isUp ? 'Operational' : 'Offline'}
                    </span>
                )}
            </div>
          </div>
        </div>
        
        {!compact && (
          <div className="flex items-center shrink-0 ml-2 z-10">
            {isLoading ? (
                <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
            ) : (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={`relative flex h-2.5 w-2.5 items-center justify-center`}>
                                {isUp && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isUp ? 'bg-emerald-500' : 'bg-destructive'}`}></span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p className="font-mono text-xs">
                                {data ? `Latency: ${data.latency}ms` : "N/A"}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          </div>
        )}
        
        {/* Subtle gradient glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:via-primary/5 group-hover:to-primary/10 transition-all duration-500 opacity-0 group-hover:opacity-100" />
      </div>
    </a>
  );
}

export function ServiceWidget({ services, config, gridSize }: ServiceWidgetProps) {
  // Determine if we should use compact mode based on grid width
  // If width is 1 or 2, use compact.
  const isCompact = gridSize ? gridSize.w < 3 : false;

  return (
    <WidgetLayout
      gridSize={gridSize}
      title="Service Status"
      icon={<Activity className="h-5 w-5" />}
      contentClassName="p-0"
    >
        <ScrollArea className="h-full px-4 pb-4 pt-2">
            <div className={cn(
              "grid gap-3",
              isCompact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
            )}>
                {services.map((service) => (
                <ServiceItem 
                  key={service.url} 
                  service={service} 
                  refreshInterval={config.refreshInterval}
                  compact={isCompact}
                />
                ))}
            </div>
        </ScrollArea>
    </WidgetLayout>
  );
}
