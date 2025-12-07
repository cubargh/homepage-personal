import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";
import { addDays, isSameDay, parseISO } from "date-fns";

const BASE_URL = "https://api.openweathermap.org/data/2.5";

interface WeatherApiCurrent {
  name: string;
  sys: { country: string };
  main: {
    temp: number;
    humidity: number;
  };
  wind: { speed: number };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
}

interface WeatherApiForecastItem {
  dt_txt: string;
  main: {
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    main: string;
    icon: string;
  }>;
}

interface WeatherApiForecast {
  list: WeatherApiForecastItem[];
}

interface DailyForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  condition: string;
  icon: string;
}

const FORECAST_DAYS = 5;

function processForecast(forecastData: WeatherApiForecast): DailyForecast[] {
  const dailyForecast: DailyForecast[] = [];
  const today = new Date();

  // Process forecast to get next N days
  for (let i = 1; i <= FORECAST_DAYS; i++) {
    const targetDate = addDays(today, i);
    const dayForecasts = forecastData.list.filter((item) =>
      isSameDay(parseISO(item.dt_txt), targetDate)
    );

    if (dayForecasts.length === 0) continue;

    // Find forecast closest to noon (12:00 PM)
    const noonForecast = dayForecasts.reduce((prev, curr) => {
      const prevHour = parseInt(prev.dt_txt.split(" ")[1].split(":")[0]);
      const currHour = parseInt(curr.dt_txt.split(" ")[1].split(":")[0]);
      const prevDiff = Math.abs(prevHour - 12);
      const currDiff = Math.abs(currHour - 12);
      return currDiff < prevDiff ? curr : prev;
    });

    // Aggregate min/max from all forecasts for that day
    const tempMin = Math.min(...dayForecasts.map((f) => f.main.temp_min));
    const tempMax = Math.max(...dayForecasts.map((f) => f.main.temp_max));

    dailyForecast.push({
      date: noonForecast.dt_txt,
      temp_min: tempMin,
      temp_max: tempMax,
      condition: noonForecast.weather[0]?.main || "",
      icon: noonForecast.weather[0]?.icon || "",
    });
  }

  return dailyForecast;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const config = loadConfig();
  const weatherConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.weather),
    "Weather configuration missing or disabled"
  );

  const { api_key, lat, lon, units } = weatherConfig;

  if (!api_key) {
    throw new ApiError("API Configuration Missing", 500, ApiErrorCode.MISSING_CONFIG);
  }

  const [currentRes, forecastRes] = await Promise.all([
    fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${api_key}`,
      { next: { revalidate: 1800 } }
    ),
    fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${api_key}`,
      { next: { revalidate: 1800 } }
    ),
  ]);

  if (!currentRes.ok || !forecastRes.ok) {
    throw new ApiError("Upstream Error", 502, ApiErrorCode.UPSTREAM_ERROR);
  }

  let currentData: WeatherApiCurrent;
  let forecastData: WeatherApiForecast;
  
  try {
    currentData = (await currentRes.json()) as WeatherApiCurrent;
    forecastData = (await forecastRes.json()) as WeatherApiForecast;
  } catch (error) {
    throw new ApiError(
      "Failed to parse weather API response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }
  
  // Validate response structure
  if (!currentData?.main?.temp || !forecastData?.list) {
    throw new ApiError(
      "Invalid weather API response structure",
      502,
      ApiErrorCode.UPSTREAM_ERROR
    );
  }

  const processedForecast = processForecast(forecastData);

  return NextResponse.json({
    location: {
      city: currentData.name,
      country: currentData.sys.country,
    },
    current: {
      temp: currentData.main.temp,
      humidity: currentData.main.humidity,
      windSpeed: currentData.wind.speed,
      condition: currentData.weather[0]?.main || "",
      description: currentData.weather[0]?.description || "",
      icon: currentData.weather[0]?.icon || "",
    },
    forecast: processedForecast,
  });
});
