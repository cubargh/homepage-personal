"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServiceConfig, ServiceStatus } from "@/types";
import { Activity, Globe, ChevronDown, ChevronUp } from "lucide-react";

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
}

function ServiceItem({ service, refreshInterval }: ServiceItemProps) {
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
      <div className="flex items-center justify-between p-2 lg:p-3 border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-200 h-full relative overflow-hidden group-hover:shadow-lg group-hover:shadow-primary/5">
        <div className="flex items-center min-w-0 gap-3 flex-1 z-10">
          <div className="relative w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center shrink-0 rounded-md bg-black/20 p-1 border border-white/5">
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
              <div className={`p-1.5 text-primary/80 ${iconUrl ? 'hidden' : ''}`}>
                  <Globe className="h-full w-full" />
              </div>
          </div>
          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
            <p className="font-medium text-xs lg:text-sm text-foreground/90 group-hover:text-primary transition-colors truncate tracking-wide">{service.name}</p>
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
        
        {/* Subtle gradient glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:via-primary/5 group-hover:to-primary/10 transition-all duration-500 opacity-0 group-hover:opacity-100" />
      </div>
    </a>
  );
}

interface ServiceWidgetProps {
  services: ServiceConfig[];
  config: {
    refreshInterval: number;
  };
}

export function ServiceWidget({ services, config }: ServiceWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
      if (window.innerWidth < 768) {
          setIsCollapsed(!isCollapsed);
      }
  };

  return (
    <Card className={`flex flex-col border-border/50 overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-auto min-h-0' : 'h-full min-h-[33vh] lg:min-h-0'}`}>
      <CardHeader 
        className="pb-3 bg-gradient-to-b from-secondary/10 to-transparent cursor-pointer md:cursor-default group"
        onClick={toggleCollapse}
      >
        <CardTitle className="flex items-center justify-between text-primary">
            <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Service Status</span>
            </div>
            {/* Show chevron only on mobile */}
            <div className="md:hidden text-muted-foreground">
                {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </div>
        </CardTitle>
      </CardHeader>
      {/* On mobile: hide if collapsed. On desktop: always flex/visible regardless of state */}
      <CardContent className={`flex-1 overflow-hidden p-0 ${isCollapsed ? 'hidden md:block' : 'block'}`}>
        <ScrollArea className="h-full px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((service) => (
                <ServiceItem 
                  key={service.url} 
                  service={service} 
                  refreshInterval={config.refreshInterval} 
                />
                ))}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
