"use client";

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
import { dashboardConfig } from "@/config/dashboard";
import { Activity, Globe } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ServiceItemProps {
  service: ServiceConfig;
}

function ServiceItem({ service }: ServiceItemProps) {
  const { data, error, isLoading } = useSWR<ServiceStatus>(
    `/api/status?url=${encodeURIComponent(service.url)}`,
    fetcher,
    {
      refreshInterval: dashboardConfig.monitoring.refreshInterval,
    }
  );

  const isUp = data?.status === "UP";
  
  // Logic to determine icon URL
  // If the icon config starts with http/https, use it directly (custom URL)
  // If it's "vert", use the specific selfhst CDN path
  // Otherwise use the walkxcode CDN default path
  let iconUrl: string | null = null;
  
  if (service.icon) {
      if (service.icon.startsWith("http")) {
          iconUrl = service.icon;
      } else if (service.icon === "vert") {
          iconUrl = "https://cdn.jsdelivr.net/gh/selfhst/icons@master/png/vert.png";
      } else {
          iconUrl = `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${service.icon}.png`;
      }
  }

  return (
    <a 
      href={service.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="flex items-center justify-between p-4 border border-border/40 rounded-lg hover:bg-secondary/20 transition-colors h-full">
        <div className="flex items-center space-x-4">
          <div className="relative w-8 h-8 flex items-center justify-center">
              {iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                      src={iconUrl} 
                      alt={service.name} 
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                          // Fallback to Globe on error
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                  />
              ) : null}
              <div className={`p-2 bg-primary/10 rounded-full text-primary ${iconUrl ? 'hidden' : ''}`}>
                  <Globe className="h-4 w-4" />
              </div>
          </div>
          <div>
            <p className="font-medium text-sm group-hover:text-primary transition-colors">{service.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isLoading ? (
               <Badge variant="outline" className="animate-pulse">Checking...</Badge>
          ) : (
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger>
                          <Badge variant={isUp ? "success" : "destructive"}>
                              {isUp ? "Online" : "Offline"}
                          </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p className="font-mono text-xs">
                              {data ? `${data.latency}ms` : "N/A"}
                          </p>
                      </TooltipContent>
                  </Tooltip>
              </TooltipProvider>
          )}
        </div>
      </div>
    </a>
  );
}

export function ServiceWidget() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-primary">
            <Activity className="h-5 w-5" />
            <span>Service Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {dashboardConfig.services.map((service) => (
                <ServiceItem key={service.url} service={service} />
                ))}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
