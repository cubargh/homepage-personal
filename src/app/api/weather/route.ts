import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { addDays, isSameDay, parseISO } from "date-fns";

const BASE_URL = "https://api.openweathermap.org/data/2.5";

export async function GET(request: NextRequest) {
  const config = loadConfig();
  const weatherConfig = getFirstEnabledWidgetConfig(config.widgets.weather);
  
  if (!weatherConfig) {
    return NextResponse.json({ error: "Weather configuration missing or disabled" }, { status: 500 });
  }

  const API_KEY = weatherConfig.api_key;
  const lat = weatherConfig.lat;
  const lon = weatherConfig.lon;
  const units = weatherConfig.units;

  if (!API_KEY) {
    return NextResponse.json({ error: "API Configuration Missing" }, { status: 500 });
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`, { next: { revalidate: 1800 } }),
      fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`, { next: { revalidate: 1800 } })
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
        return NextResponse.json({ error: "Upstream Error" }, { status: 502 });
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    // Process forecast to get next 5 days (1 data point per day, e.g., noon)
    const dailyForecast: any[] = [];
    const today = new Date();
    
    // Simple logic: pick the forecast item closest to 12:00 PM for the next 5 days
    for (let i = 1; i <= 5; i++) {
        const targetDate = addDays(today, i);
        const dayForecasts = forecastData.list.filter((item: any) => 
            isSameDay(parseISO(item.dt_txt), targetDate)
        );
        
        // Find closest to noon
        const noonForecast = dayForecasts.reduce((prev: any, curr: any) => {
            const prevDiff = Math.abs(parseInt(prev.dt_txt.split(" ")[1].split(":")[0]) - 12);
            const currDiff = Math.abs(parseInt(curr.dt_txt.split(" ")[1].split(":")[0]) - 12);
            return currDiff < prevDiff ? curr : prev;
        }, dayForecasts[0]);

        if (noonForecast) {
            dailyForecast.push({
                date: noonForecast.dt_txt,
                temp_min: noonForecast.main.temp_min, // Note: standard forecast API 3h steps doesn't give daily min/max easily without aggregation. 
                // For simplicity in a widget, 'temp' at noon is good, or we can aggregate min/max from all points of that day.
                // Let's aggregate for better accuracy.
                temp_max: Math.max(...dayForecasts.map((f: any) => f.main.temp_max)),
                // Recalculate min correctly
                real_temp_min: Math.min(...dayForecasts.map((f: any) => f.main.temp_min)),
                condition: noonForecast.weather[0].main,
                icon: noonForecast.weather[0].icon
            });
        }
    }
    
    // Correct the shape
    const processedForecast = dailyForecast.map(item => ({
        date: item.date,
        temp_min: item.real_temp_min,
        temp_max: item.temp_max,
        condition: item.condition,
        icon: item.icon
    }));

    return NextResponse.json({
        location: {
            city: currentData.name,
            country: currentData.sys.country
        },
        current: {
            temp: currentData.main.temp,
            humidity: currentData.main.humidity,
            windSpeed: currentData.wind.speed,
            condition: currentData.weather[0].main,
            description: currentData.weather[0].description,
            icon: currentData.weather[0].icon,
        },
        forecast: processedForecast
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
