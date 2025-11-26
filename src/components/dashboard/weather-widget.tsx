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
    <Card className="h-[140px] md:h-full flex flex-col overflow-hidden border-border/50">
      <CardHeader className="hidden md:flex bg-gradient-to-b from-secondary/10 to-transparent pb-2">
        <CardTitle className="flex items-center space-x-2 text-primary">
            <CloudSun className="h-5 w-5" />
            <span>Weather</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 h-full">
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
                <div className="w-[35%] md:w-full md:flex-1 flex flex-col items-center justify-center p-2 md:p-6 relative bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
                     {/* Mobile Title Overlay */}
                     <div className="md:hidden absolute top-3 left-4 flex items-center space-x-1.5 text-primary/90">
                        <CloudSun className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Weather</span>
                     </div>
                     
                     <div className="flex flex-col md:flex-row items-center md:space-x-6 mt-4 md:mt-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={`https://openweathermap.org/img/wn/${data.current.icon}@4x.png`} 
                            alt={data.current.condition} 
                            className="h-12 w-12 md:h-28 md:w-28 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
                        />
                        <div className="flex flex-col items-center md:items-start text-center md:text-left -mt-1 md:mt-0">
                            <span className="text-3xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">{Math.round(data.current.temp)}°</span>
                            <span className="text-[10px] md:text-xl text-muted-foreground/80 capitalize font-medium leading-none mt-1">{data.current.condition}</span>
                        </div>
                     </div>
                </div>

                {/* Forecast - 3 Columns on Mobile (Inline) / 3 Columns on Desktop */}
                <div className="w-[65%] md:w-full grid grid-cols-3 md:grid-cols-3 border-t border-white/5 bg-black/20">
                    {data.forecast.map((day, i) => (
                        <div 
                            key={day.date} 
                            className={`flex flex-col items-center justify-center p-1 md:p-4 hover:bg-white/5 transition-colors group
                                ${i !== 2 ? 'border-r border-white/5' : ''}
                            `}
                        >
                            <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground/60 md:mb-2 group-hover:text-primary/80 transition-colors">
                                {format(parseISO(day.date), "EEE")}
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                                alt={day.condition} 
                                className="h-6 w-6 md:h-10 md:w-10 object-contain opacity-70 group-hover:opacity-100 transition-opacity md:mb-1"
                            />
                             <div className="flex flex-col md:flex-row items-center md:items-baseline md:space-x-1.5 font-mono text-[10px] md:text-sm">
                                <span className="font-semibold text-foreground/90">{Math.round(day.temp_max)}°</span>
                                <span className="text-muted-foreground/40 text-[9px] md:text-xs">{Math.round(day.temp_min)}°</span>
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
