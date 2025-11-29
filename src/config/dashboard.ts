import { DashboardConfig } from "@/types";
import { loadConfig } from "@/lib/config";

export const getDashboardConfig = (): DashboardConfig => {
  const config = loadConfig();

  const services = config.widgets.service_status?.services || [];

  // Debug: Log if services are empty to help diagnose
  if (!services || services.length === 0) {
    console.warn("DashboardConfig: No services found in config.yaml");
  }

  const ROOT_DOMAIN = config.server.root_domain;
  const TIMEZONE = config.server.timezone;
  const LAT = config.widgets.weather.lat;
  const LON = config.widgets.weather.lon;
  const CALENDAR_ICS = config.widgets.calendar.ics_urls.join(",");

  if (!ROOT_DOMAIN) {
    console.warn(
      "server.root_domain is not set in config. Services URLs will be invalid."
    );
  }

  // NOTE: The grid is now 20 columns wide (previously 10).
  // Coordinates and spans below are based on the 10-column system and
  // are automatically scaled x2 in `layout-utils.ts`.
  // Use explicit x2 values here if you want fine-grained control on the 20-col grid.

  const enabledWidgets: any[] = [];

  if (config.widgets.weather.enabled) {
    console.log("Weather widget enabled");
    enabledWidgets.push({
      id: "weather",
      type: "weather",
      x: 0,
      y: 0,
      colSpan: 3,
      rowSpan: 2,
    });
  } else {
    console.log("Weather widget disabled");
  }

  if (config.widgets.service_status?.enabled) {
    console.log("Service Status widget enabled");
    enabledWidgets.push({
      id: "services",
      type: "service-monitor",
      x: 0,
      y: 2,
      colSpan: 3,
      rowSpan: 2,
    });
  }

  if (config.widgets.calendar.enabled) {
    enabledWidgets.push({
      id: "calendar",
      type: "calendar",
      x: 3,
      y: 0,
      colSpan: 4,
      rowSpan: 4,
    });
  }

  if (config.widgets.football.enabled || config.widgets.f1?.enabled) {
    // Use "sports-combined" if either is enabled.
    // The SportsWidget will handle displaying only the enabled tabs.
    enabledWidgets.push({
      id: "sports-combined",
      type: "sports",
      x: 7,
      y: 0,
      colSpan: 3,
      rowSpan: 4,
    });
  }

  return {
    timezone: TIMEZONE,
    services: services,
    football: {
      enabled: config.widgets.football.enabled,
      leagues: ["PL", "PD", "BL1", "SA", "CL"],
      refreshInterval: 60000,
    },
    f1: {
      enabled: config.widgets.f1?.enabled ?? true, // Default to true if missing
      refreshInterval: 60000 * 60,
    },
    weather: {
      lat: LAT,
      lon: LON,
      units: config.widgets.weather.units as "metric" | "imperial",
      refreshInterval: 60000 * 30, // 30 minutes
    },
    calendar: {
      icsUrl: CALENDAR_ICS,
      refreshInterval: 60000 * 15, // 15 minutes
    },
    monitoring: {
      refreshInterval: 60000,
    },
    widgets: enabledWidgets,
  };
};
