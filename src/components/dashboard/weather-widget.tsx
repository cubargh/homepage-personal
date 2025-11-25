"use client";

import useSWR from "swr";
import { format, parseISO } from "date-fns";
import { dashboardConfig } from "@/config/dashboard";
import { WeatherData } from "@/types";
import { CloudSun, Loader2, AlertTriangle, CloudRain, Sun, Cloud, Snowflake } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch weather data');
    }
    return res.json();
};

export function WeatherWidget() {
  const { data, error, isLoading } = useSWR<WeatherData>(
    "/api/weather",
    fetcher,
    {
      refreshInterval: dashboardConfig.weather.refreshInterval,
    }
  );

  const getIcon = (condition: string) => {
      // Fallback icons if image load fails or just for decorative purposes in header
      const lower = condition.toLowerCase();
      if (lower.includes("rain")) return <CloudRain className="h-5 w-5" />;
      if (lower.includes("sun") || lower.includes("clear")) return <Sun className="h-5 w-5" />;
      if (lower.includes("snow")) return <Snowflake className="h-5 w-5" />;
      return <Cloud className="h-5 w-5" />;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-primary">
            <CloudSun className="h-5 w-5" />
            <span>Weather</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {error ? (
             <div className="h-full flex flex-col items-center justify-center text-destructive/80 space-y-2">
                <AlertTriangle className="h-8 w-8" />
                <p className="text-sm">Weather Unavailable</p>
                <p className="text-xs text-muted-foreground">Check API Key</p>
            </div>
        ) : isLoading || !data ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading forecast...</p>
            </div>
        ) : (
            <div className="h-full flex flex-col">
                {/* Current Weather - Big Display */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 bg-gradient-to-b from-background to-secondary/10">
                     <div className="flex items-center space-x-2 md:space-x-4 mb-1 md:mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={`https://openweathermap.org/img/wn/${data.current.icon}@4x.png`} 
                            alt={data.current.condition} 
                            className="h-16 w-16 md:h-24 md:w-24 object-contain drop-shadow-lg"
                        />
                        <div className="flex flex-col">
                            <span className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">{Math.round(data.current.temp)}°</span>
                            <span className="text-sm md:text-lg text-muted-foreground capitalize font-medium">{data.current.condition}</span>
                        </div>
                     </div>
                </div>

                {/* Forecast - Grid */}
                <div className="grid grid-cols-3 border-t border-border/50 bg-secondary/5">
                    {data.forecast.map((day, i) => (
                        <div key={day.date} className={`flex flex-col items-center justify-center p-2 md:p-4 hover:bg-secondary/20 transition-colors ${i !== 2 ? 'border-r border-border/50' : ''}`}>
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 md:mb-2">
                                {format(parseISO(day.date), "EEE")}
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                                alt={day.condition} 
                                className="h-6 w-6 md:h-8 md:w-8 object-contain opacity-90 mb-1"
                            />
                             <div className="flex items-baseline space-x-1 md:space-x-1.5 font-mono text-xs md:text-sm">
                                <span className="font-semibold text-foreground">{Math.round(day.temp_max)}°</span>
                                <span className="text-muted-foreground/60 text-[10px] md:text-xs">{Math.round(day.temp_min)}°</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
