"use client";

import useSWR from "swr";
import { parseISO } from "date-fns";
import { formatTime } from "@/lib/utils";
import { WeatherData } from "@/types";
import { 
  CloudSun, Loader2, AlertTriangle, Droplets, Wind, MapPin,
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, Moon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch weather data');
    }
    return res.json();
};

// Map OpenWeatherMap icon codes to Lucide components
const getWeatherIcon = (code: string, className?: string) => {
  const props = { className: className || "h-6 w-6" };
  
  // Mapping based on OWM icon codes: https://openweathermap.org/weather-conditions
  switch (code.replace('n', 'd')) { // Treat night icons same as day for generic shape, or split if needed
    case '01d': return <Sun {...props} className={`${props.className} text-yellow-500`} />; // Clear sky
    case '01n': return <Moon {...props} className={`${props.className} text-blue-200`} />; // Clear sky night
    case '02d': return <CloudSun {...props} className={`${props.className} text-yellow-400`} />; // Few clouds
    case '02n': return <Cloud {...props} className={`${props.className} text-gray-400`} />; // Few clouds night
    case '03d': // Scattered clouds
    case '04d': // Broken clouds
      return <Cloud {...props} className={`${props.className} text-gray-400`} />;
    case '09d': // Shower rain
      return <CloudDrizzle {...props} className={`${props.className} text-blue-400`} />;
    case '10d': // Rain
      return <CloudRain {...props} className={`${props.className} text-blue-500`} />;
    case '11d': // Thunderstorm
      return <CloudLightning {...props} className={`${props.className} text-purple-500`} />;
    case '13d': // Snow
      return <CloudSnow {...props} className={`${props.className} text-white`} />;
    case '50d': // Mist
      return <CloudFog {...props} className={`${props.className} text-gray-300`} />;
    default:
      return <CloudSun {...props} className={`${props.className} text-gray-400`} />;
  }
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
    <Card className="h-auto md:h-full flex flex-col overflow-hidden border-border/50">
      <CardHeader className="hidden md:flex bg-secondary/10 py-3 px-4 h-[50px] shrink-0 border-b border-border/50">
        <CardTitle className="flex items-center justify-between text-primary text-base w-full">
            <div className="flex items-center space-x-2">
                <CloudSun className="h-4 w-4" />
                <span>Weather</span>
            </div>
            {data && (
                <div className="flex items-center text-xs text-muted-foreground font-normal">
                    <MapPin className="h-3 w-3 mr-1" />
                    {data.location.city}, {data.location.country}
                </div>
            )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 h-full relative flex flex-col">
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
            <div className="flex flex-col h-full">
                {/* Current Weather - Takes available vertical space */}
                <div className="flex-1 flex flex-col justify-center p-4 md:px-6 relative bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
                     {/* Mobile Title Overlay */}
                     <div className="md:hidden absolute top-2 left-3 flex items-center space-x-1.5 text-primary/90 z-10">
                        <CloudSun className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Weather</span>
                     </div>

                     {/* Mobile Location Overlay */}
                     <div className="md:hidden absolute top-2 right-3 flex items-center text-[9px] text-muted-foreground/70 z-10">
                        {data.location.city}
                        <MapPin className="h-2.5 w-2.5 ml-0.5" />
                     </div>
                     
                     <div className="flex flex-row items-center justify-between w-full mt-4 md:mt-0">
                        {/* Left: Icon + Temp + Condition */}
                        <div className="flex items-center gap-3 md:gap-5">
                            {/* Replaced img with Lucide icon helper */}
                            <div className="drop-shadow-lg">
                                {getWeatherIcon(data.current.icon, "h-10 w-10 md:h-16 md:w-16")}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground">
                                    {Math.round(data.current.temp)}°
                                </span>
                                <span className="text-[10px] md:text-sm text-muted-foreground capitalize font-medium">
                                    {data.current.description}
                                </span>
                            </div>
                        </div>

                        {/* Right: Details (Hidden on tiny screens, visible on desktop/tablet) */}
                        <div className="flex flex-col gap-1.5 text-xs md:text-sm text-muted-foreground/70 font-medium text-right pl-4 border-l border-white/5 md:border-none md:pl-0">
                            <div className="flex items-center justify-end gap-2">
                                <Droplets className="h-3.5 w-3.5 text-blue-400/70" />
                                <span>{data.current.humidity}%</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Wind className="h-3.5 w-3.5 text-teal-400/70" />
                                <span>{Math.round(data.current.windSpeed * 3.6)} <span className="text-[10px]">km/h</span></span>
                            </div>
                        </div>
                     </div>
                </div>

                {/* Forecast - Fixed height at bottom */}
                <div className="h-[80px] md:h-[100px] shrink-0 grid grid-cols-5 border-t border-white/5 bg-secondary/5">
                    {data.forecast.slice(0, 5).map((day, i) => (
                        <div 
                            key={day.date} 
                            className={`flex flex-col items-center justify-center md:justify-between py-1 md:py-3 hover:bg-white/5 transition-colors group gap-0.5 md:gap-0
                                ${i !== 4 ? 'border-r border-white/5' : ''}
                            `}
                        >
                            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 group-hover:text-primary/80 transition-colors">
                                {formatTime(parseISO(day.date), "EEE", config.timezone)}
                            </span>
                            {/* Replaced img with Lucide icon helper */}
                            <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                                {getWeatherIcon(day.icon, "h-4 w-4 md:h-6 md:w-6")}
                            </div>
                             <div className="flex flex-col items-center font-mono text-[9px] md:text-xs leading-none">
                                <span className="font-semibold text-foreground/90">{Math.round(day.temp_max)}°</span>
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
