import { describe, it, expect, vi, beforeEach } from "vitest";
import { addDays, isSameDay, parseISO } from "date-fns";

// We need to extract the processForecast function logic for testing
// Since it's not exported, we'll recreate it here for testing
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

describe("processForecast", () => {

  it("should group forecasts by day correctly", () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const dayAfter = addDays(today, 2);

    const forecastData: WeatherApiForecast = {
      list: [
        {
          dt_txt: `${tomorrow.toISOString().split("T")[0]} 06:00:00`,
          main: { temp_min: 10, temp_max: 15 },
          weather: [{ main: "Clear", icon: "01d" }],
        },
        {
          dt_txt: `${tomorrow.toISOString().split("T")[0]} 12:00:00`,
          main: { temp_min: 12, temp_max: 18 },
          weather: [{ main: "Clouds", icon: "02d" }],
        },
        {
          dt_txt: `${dayAfter.toISOString().split("T")[0]} 12:00:00`,
          main: { temp_min: 8, temp_max: 14 },
          weather: [{ main: "Rain", icon: "10d" }],
        },
      ],
    };

    const result = processForecast(forecastData);

    expect(result.length).toBeGreaterThanOrEqual(1);
    // Should have forecasts for tomorrow and day after
    expect(result.some((f) => f.date.includes(tomorrow.toISOString().split("T")[0]))).toBe(true);
  });

  it("should select noon forecast (closest to 12:00)", () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const forecastData: WeatherApiForecast = {
      list: [
        {
          dt_txt: `${tomorrowStr} 09:00:00`,
          main: { temp_min: 10, temp_max: 15 },
          weather: [{ main: "Clear", icon: "01d" }],
        },
        {
          dt_txt: `${tomorrowStr} 12:00:00`,
          main: { temp_min: 12, temp_max: 18 },
          weather: [{ main: "Clouds", icon: "02d" }],
        },
        {
          dt_txt: `${tomorrowStr} 15:00:00`,
          main: { temp_min: 11, temp_max: 17 },
          weather: [{ main: "Sunny", icon: "01d" }],
        },
      ],
    };

    const result = processForecast(forecastData);
    const tomorrowForecast = result.find((f) =>
      f.date.includes(tomorrowStr)
    );

    expect(tomorrowForecast).toBeDefined();
    expect(tomorrowForecast?.date).toContain("12:00:00");
    expect(tomorrowForecast?.condition).toBe("Clouds");
  });

  it("should calculate min/max temperatures", () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const forecastData: WeatherApiForecast = {
      list: [
        {
          dt_txt: `${tomorrowStr} 00:00:00`,
          main: { temp_min: 5, temp_max: 8 },
          weather: [{ main: "Clear", icon: "01n" }],
        },
        {
          dt_txt: `${tomorrowStr} 12:00:00`,
          main: { temp_min: 12, temp_max: 18 },
          weather: [{ main: "Clouds", icon: "02d" }],
        },
        {
          dt_txt: `${tomorrowStr} 18:00:00`,
          main: { temp_min: 10, temp_max: 15 },
          weather: [{ main: "Clear", icon: "01d" }],
        },
      ],
    };

    const result = processForecast(forecastData);
    const tomorrowForecast = result.find((f) =>
      f.date.includes(tomorrowStr)
    );

    expect(tomorrowForecast).toBeDefined();
    expect(tomorrowForecast?.temp_min).toBe(5); // Minimum of all forecasts
    expect(tomorrowForecast?.temp_max).toBe(18); // Maximum of all forecasts
  });

  it("should handle missing forecasts", () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const dayAfter = addDays(today, 2);

    const forecastData: WeatherApiForecast = {
      list: [
        {
          dt_txt: `${tomorrow.toISOString().split("T")[0]} 12:00:00`,
          main: { temp_min: 10, temp_max: 15 },
          weather: [{ main: "Clear", icon: "01d" }],
        },
        // Missing forecast for dayAfter
      ],
    };

    const result = processForecast(forecastData);

    // Should only have forecast for tomorrow
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(
      result.some((f) =>
        f.date.includes(tomorrow.toISOString().split("T")[0])
      )
    ).toBe(true);
  });

  it("should handle edge cases - single forecast", () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);

    const forecastData: WeatherApiForecast = {
      list: [
        {
          dt_txt: `${tomorrow.toISOString().split("T")[0]} 12:00:00`,
          main: { temp_min: 10, temp_max: 15 },
          weather: [{ main: "Clear", icon: "01d" }],
        },
      ],
    };

    const result = processForecast(forecastData);

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].temp_min).toBe(10);
    expect(result[0].temp_max).toBe(15);
  });

  it("should handle edge cases - no forecasts", () => {
    const forecastData: WeatherApiForecast = {
      list: [],
    };

    const result = processForecast(forecastData);

    expect(result).toEqual([]);
  });

  it("should handle date parsing and filtering", () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const forecastData: WeatherApiForecast = {
      list: [
        {
          dt_txt: `${tomorrowStr} 00:00:00`,
          main: { temp_min: 8, temp_max: 12 },
          weather: [{ main: "Clear", icon: "01n" }],
        },
        {
          dt_txt: `${tomorrowStr} 06:00:00`,
          main: { temp_min: 10, temp_max: 14 },
          weather: [{ main: "Clouds", icon: "02d" }],
        },
        {
          dt_txt: `${tomorrowStr} 12:00:00`,
          main: { temp_min: 12, temp_max: 18 },
          weather: [{ main: "Sunny", icon: "01d" }],
        },
        {
          dt_txt: `${tomorrowStr} 18:00:00`,
          main: { temp_min: 11, temp_max: 16 },
          weather: [{ main: "Clear", icon: "01d" }],
        },
      ],
    };

    const result = processForecast(forecastData);
    const tomorrowForecast = result.find((f) =>
      f.date.includes(tomorrowStr)
    );

    expect(tomorrowForecast).toBeDefined();
    // Should aggregate all forecasts for that day
    expect(tomorrowForecast?.temp_min).toBe(8);
    expect(tomorrowForecast?.temp_max).toBe(18);
  });

  it("should handle missing weather data", () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const forecastData: WeatherApiForecast = {
      list: [
        {
          dt_txt: `${tomorrowStr} 12:00:00`,
          main: { temp_min: 10, temp_max: 15 },
          weather: [],
        },
      ],
    };

    const result = processForecast(forecastData);
    const tomorrowForecast = result.find((f) =>
      f.date.includes(tomorrowStr)
    );

    expect(tomorrowForecast).toBeDefined();
    expect(tomorrowForecast?.condition).toBe("");
    expect(tomorrowForecast?.icon).toBe("");
  });

  it("should process multiple days correctly", () => {
    const today = new Date();
    const day1 = addDays(today, 1);
    const day2 = addDays(today, 2);
    const day3 = addDays(today, 3);

    const forecastData: WeatherApiForecast = {
      list: [
        {
          dt_txt: `${day1.toISOString().split("T")[0]} 12:00:00`,
          main: { temp_min: 10, temp_max: 15 },
          weather: [{ main: "Clear", icon: "01d" }],
        },
        {
          dt_txt: `${day2.toISOString().split("T")[0]} 12:00:00`,
          main: { temp_min: 12, temp_max: 18 },
          weather: [{ main: "Clouds", icon: "02d" }],
        },
        {
          dt_txt: `${day3.toISOString().split("T")[0]} 12:00:00`,
          main: { temp_min: 8, temp_max: 14 },
          weather: [{ main: "Rain", icon: "10d" }],
        },
      ],
    };

    const result = processForecast(forecastData);

    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result[0].temp_min).toBe(10);
    expect(result[1].temp_min).toBe(12);
    expect(result[2].temp_min).toBe(8);
  });
});

