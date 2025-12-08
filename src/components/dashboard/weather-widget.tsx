"use client";

import useSWR from "swr";
import { parseISO } from "date-fns";
import { formatTime } from "@/lib/utils";
import { WeatherData, WeatherWidgetProps } from "@/types";
import { 
  CloudSun, Loader2, AlertTriangle, Droplets, Wind, MapPin,
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog, Moon
} from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";

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

export function WeatherWidget({ config, gridSize }: WeatherWidgetProps) {
  const { data, error, isLoading } = useSWR<WeatherData>(
    "/api/weather",
    fetcher,
    {
      refreshInterval: config.refreshInterval,
    }
  );

  // Layout modes:
  // - Minimal: 1x1 (icon + temp only)
  // - Compact: 2x2 (icon + temp + condition, no forecast)
  // - Standard: 3x3+ (full layout with forecast)
  const isMinimal = gridSize ? (gridSize.w === 1 && gridSize.h === 1) : false;
  const isCompact = gridSize ? (gridSize.w === 2 && gridSize.h === 2) : false;

  return (
    <WidgetLayout
      gridSize={gridSize}
      title="Weather"
      icon={<CloudSun className="h-4 w-4" />}
      headerActions={data && !isMinimal && (
        <div className="flex items-center text-xs text-muted-foreground font-normal">
            <MapPin className="h-3 w-3 mr-1" />
            {data.location.city}
        </div>
      )}
      contentClassName={isMinimal ? "p-0" : isCompact ? "p-0 relative flex flex-col" : "p-0 relative flex flex-col"}
    >
      {error ? (
        <div className="h-full flex flex-col items-center justify-center text-destructive/80 space-y-2 p-4">
          <AlertTriangle className="h-8 w-8" />
          {!isMinimal && (
            <>
              <p className="text-sm">Weather Unavailable</p>
              <p className="text-xs text-muted-foreground">Check API Key</p>
            </>
          )}
        </div>
      ) : isLoading || !data ? (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 p-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          {!isMinimal && <p className="text-sm">Loading forecast...</p>}
        </div>
      ) : (
        <div className="flex flex-col h-full w-full">
          {isMinimal ? (
             // 1x1 Minimal Layout
             <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-blue-500/10 to-transparent p-2">
                <div className="mb-1 drop-shadow-md scale-110">
                    {getWeatherIcon(data.current.icon, "h-8 w-8")}
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold tracking-tighter text-foreground leading-none">
                        {Math.round(data.current.temp)}°
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-full px-1">
                        {data.location.city}
                    </span>
                </div>
             </div>
          ) : isCompact ? (
             // 2x2 Compact Layout
             <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-blue-500/5 via-transparent to-transparent p-2">
                <div className="mb-1 drop-shadow-lg shrink-0">
                    {getWeatherIcon(data.current.icon, "h-10 w-10")}
                </div>
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <span className="text-3xl font-bold tracking-tighter text-foreground leading-none">
                        {Math.round(data.current.temp)}°
                    </span>
                    <span className="text-xs text-muted-foreground capitalize font-medium text-center px-1 truncate w-full">
                        {data.current.description}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 mt-0.5 truncate w-full px-1">
                        {data.location.city}
                    </span>
                </div>
             </div>
          ) : (
             // Standard Layout (3x3+)
             <>
                {/* Current Weather */}
                <div className="flex-1 flex flex-col justify-center p-4 relative bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
                     <div className="flex flex-row items-center justify-between w-full">
                        {/* Left: Icon + Temp + Condition */}
                        <div className="flex items-center gap-3">
                            <div className="drop-shadow-lg">
                                {getWeatherIcon(data.current.icon, "h-12 w-12")}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-4xl font-bold tracking-tighter text-foreground">
                                    {Math.round(data.current.temp)}°
                                </span>
                                <span className="text-xs text-muted-foreground capitalize font-medium">
                                    {data.current.description}
                                </span>
                            </div>
                        </div>

                        {/* Right: Details - Only show if width >= 3 */}
                        {gridSize && gridSize.w >= 3 && (
                          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground/70 font-medium text-right pl-4 border-l border-white/5">
                              <div className="flex items-center justify-end gap-2">
                                  <Droplets className="h-3.5 w-3.5 text-blue-400/70" />
                                  <span>{data.current.humidity}%</span>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                  <Wind className="h-3.5 w-3.5 text-teal-400/70" />
                                  <span>{Math.round(data.current.windSpeed * 3.6)} <span className="text-[10px]">km/h</span></span>
                              </div>
                          </div>
                        )}
                     </div>
                </div>

                {/* Forecast Footer - Only show if height >= 3 */}
                {gridSize && gridSize.h >= 3 && (
                  <div className="h-[80px] shrink-0 grid grid-cols-5 border-t border-white/5 bg-secondary/5">
                      {data.forecast.slice(0, 5).map((day, i) => (
                          <div 
                              key={day.date} 
                              className={`flex flex-col items-center justify-center py-2 hover:bg-white/5 transition-colors group gap-0.5
                                  ${i !== 4 ? 'border-r border-white/5' : ''}
                              `}
                          >
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 group-hover:text-primary/80 transition-colors">
                                  {formatTime(parseISO(day.date), "EEE", config.timezone)}
                              </span>
                              <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                                  {getWeatherIcon(day.icon, "h-5 w-5")}
                              </div>
                               <div className="flex flex-col items-center font-mono text-xs leading-none">
                                  <span className="font-semibold text-foreground/90">{Math.round(day.temp_max)}°</span>
                              </div>
                          </div>
                      ))}
                  </div>
                )}
             </>
          )}
        </div>
      )}
    </WidgetLayout>
  );
}
