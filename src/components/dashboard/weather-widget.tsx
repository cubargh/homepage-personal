"use client";

import useSWR from "swr";
import { format, parseISO } from "date-fns";
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
    <Card className="h-[140px] md:h-full flex flex-col">
      <CardHeader className="hidden md:flex">
        <CardTitle className="flex items-center space-x-2 text-primary">
            <CloudSun className="h-5 w-5" />
            <span>Weather</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden h-full">
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
                {/* Current Weather - Inline with forecast on Mobile, Big on Desktop */}
                <div className="w-[35%] md:w-full md:flex-1 flex flex-col items-center justify-center p-2 md:p-6 bg-gradient-to-b from-background to-secondary/10 border-r md:border-r-0 md:border-b border-border/50 relative">
                     {/* Mobile Title Overlay */}
                     <div className="md:hidden absolute top-2 left-3 flex items-center space-x-1 text-primary/80">
                        <CloudSun className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Weather</span>
                     </div>
                     
                     <div className="flex flex-col md:flex-row items-center md:space-x-4 mt-4 md:mt-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={`https://openweathermap.org/img/wn/${data.current.icon}@4x.png`} 
                            alt={data.current.condition} 
                            className="h-12 w-12 md:h-24 md:w-24 object-contain drop-shadow-lg"
                        />
                        <div className="flex flex-col items-center md:items-start text-center md:text-left -mt-1 md:mt-0">
                            <span className="text-2xl md:text-6xl font-bold tracking-tighter text-foreground">{Math.round(data.current.temp)}°</span>
                            <span className="text-[10px] md:text-lg text-muted-foreground capitalize font-medium leading-none">{data.current.condition}</span>
                        </div>
                     </div>
                </div>

                {/* Forecast - 3 Columns on Mobile (Inline) / 3 Columns on Desktop */}
                <div className="w-[65%] md:w-full grid grid-cols-3 md:grid-cols-3 bg-secondary/5">
                    {data.forecast.map((day, i) => (
                        <div 
                            key={day.date} 
                            className={`flex flex-col items-center justify-center p-1 md:p-4 hover:bg-secondary/20 transition-colors
                                ${i !== 2 ? 'border-r border-border/50' : ''}
                            `}
                        >
                            <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground md:mb-2">
                                {format(parseISO(day.date), "EEE")}
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                                alt={day.condition} 
                                className="h-6 w-6 md:h-8 md:w-8 object-contain opacity-90 md:mb-1"
                            />
                             <div className="flex flex-col md:flex-row items-center md:items-baseline md:space-x-1.5 font-mono text-[10px] md:text-sm">
                                <span className="font-semibold text-foreground">{Math.round(day.temp_max)}°</span>
                                <span className="text-muted-foreground/60 text-[9px] md:text-xs">{Math.round(day.temp_min)}°</span>
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
