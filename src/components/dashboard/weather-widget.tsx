"use client";

import useSWR from "swr";
import { parseISO } from "date-fns";
import { formatTime } from "@/lib/utils";
import { WeatherData } from "@/types";
import { CloudSun, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch weather data');
    }
    return res.json();
};

interface WeatherWidgetProps {
  config: {
    refreshInterval: number;
    timezone: string;
  };
}

export function WeatherWidget({ config }: WeatherWidgetProps) {
  const { data, error, isLoading } = useSWR<WeatherData>(
    "/api/weather",
    fetcher,
    {
      refreshInterval: config.refreshInterval,
    }
  );

  return (
    <Card className="h-[120px] md:h-full flex flex-col overflow-hidden border-border/50">
      <CardHeader className="hidden md:flex bg-gradient-to-b from-secondary/10 to-transparent py-3 px-4 h-[50px] shrink-0">
        <CardTitle className="flex items-center space-x-2 text-primary text-base">
            <CloudSun className="h-4 w-4" />
            <span>Weather</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 h-full relative">
        {error ? (
             <div className="h-full flex flex-col items-center justify-center text-destructive/80 space-y-2 p-4">
                <AlertTriangle className="h-8 w-8" />
                <p className="text-sm">Weather Unavailable</p>
                <p className="text-xs text-muted-foreground">Check API Key</p>
            </div>
        ) : isLoading || !data ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading forecast...</p>
            </div>
        ) : (
            <div className="flex flex-row md:flex-col h-full">
                {/* Current Weather - Compact on desktop to allow forecast space */}
                <div className="w-[40%] md:w-full md:h-[140px] md:shrink-0 flex flex-col items-center justify-center p-1 md:p-2 relative bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
                     {/* Mobile Title Overlay */}
                     <div className="md:hidden absolute top-2 left-3 flex items-center space-x-1.5 text-primary/90">
                        <CloudSun className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Weather</span>
                     </div>
                     
                     <div className="flex flex-col md:flex-row items-center md:justify-center md:space-x-6 mt-3 md:mt-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={`https://openweathermap.org/img/wn/${data.current.icon}@4x.png`} 
                            alt={data.current.condition} 
                            className="h-10 w-10 md:h-20 md:w-20 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
                        />
                        <div className="flex flex-col items-center md:items-start text-center md:text-left -mt-1 md:mt-0">
                            <span className="text-2xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">{Math.round(data.current.temp)}°</span>
                            <span className="text-[9px] md:text-sm text-muted-foreground/80 capitalize font-medium leading-none mt-0.5">{data.current.condition}</span>
                        </div>
                     </div>
                </div>

                {/* Forecast - Fill remaining space */}
                <div className="w-[60%] md:w-full md:flex-1 grid grid-cols-3 md:grid-cols-3 border-t border-white/5 bg-black/20">
                    {data.forecast.map((day, i) => (
                        <div 
                            key={day.date} 
                            className={`flex flex-col items-center justify-center p-1 md:p-2 hover:bg-white/5 transition-colors group
                                ${i !== 2 ? 'border-r border-white/5' : ''}
                            `}
                        >
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 md:mb-1 group-hover:text-primary/80 transition-colors">
                                {formatTime(parseISO(day.date), "EEE", config.timezone)}
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                                alt={day.condition} 
                                className="h-6 w-6 md:h-8 md:w-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity mb-0.5"
                            />
                             <div className="flex flex-col md:flex-row items-center md:items-baseline md:space-x-1 font-mono text-[10px] md:text-xs">
                                <span className="font-semibold text-foreground/90">{Math.round(day.temp_max)}°</span>
                                <span className="text-muted-foreground/40 text-[9px] md:text-[10px] ml-0.5">{Math.round(day.temp_min)}°</span>
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
