import { WidgetRegistry } from "@/lib/widget-registry";
import { ServiceWidget } from "@/components/dashboard/service-widget";
import { ShortcutsWidget } from "@/components/dashboard/shortcuts-widget";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { SportsWidget } from "@/components/dashboard/sports-widget";
import { F1Widget } from "@/components/dashboard/f1-widget";
import { FootballWidget } from "@/components/dashboard/football-widget";
import { JellyfinWidget } from "@/components/dashboard/jellyfin-widget";
import { ImmichWidget } from "@/components/dashboard/immich-widget";
import { GhostfolioWidget } from "@/components/dashboard/ghostfolio-widget";
import { NavidromeWidget } from "@/components/dashboard/navidrome-widget";
import { QBittorrentWidget } from "@/components/dashboard/qbittorrent-widget";

// Register Service Monitor
WidgetRegistry.register({
  type: "service-monitor",
  component: ServiceWidget,
  isEnabled: (config) => config.widgets.service_status?.enabled ?? false,
  getProps: (config) => {
    return {
      services: config.widgets.service_status?.services || [],
      config: {
        refreshInterval: 60000, // 1 minute
        columns: config.widgets.service_status?.columns ?? 2,
        rows: config.widgets.service_status?.rows ?? "auto",
        compactMode: config.widgets.service_status?.compactMode ?? false,
      },
    };
  },
  grid: {
    w: 3,
    h: 2,
    minW: 3,
    minH: 2,
  },
  options: {
    defaultX: 0,
    defaultY: 2,
    defaultId: "services",
  },
});

// Register Shortcuts
WidgetRegistry.register({
  type: "shortcuts",
  component: ShortcutsWidget,
  isEnabled: (config) => config.widgets.shortcuts?.enabled ?? false,
  getProps: (config) => {
    return {
      shortcuts: config.widgets.shortcuts?.shortcuts || [],
      config: {
        columns: config.widgets.shortcuts?.columns ?? 2,
        rows: config.widgets.shortcuts?.rows ?? "auto",
        compactMode: config.widgets.shortcuts?.compactMode ?? false,
      },
    };
  },
  grid: {
    w: 3,
    h: 2,
    minW: 1, // Allow 1x1 compact layout
    minH: 1, // Allow 1x1 compact layout
  },
  options: {
    defaultX: 3,
    defaultY: 0,
    defaultId: "shortcuts",
  },
});

// Register Weather
WidgetRegistry.register({
  type: "weather",
  component: WeatherWidget,
  isEnabled: (config) => config.widgets.weather.enabled,
  getProps: (config) => {
    return {
      config: {
        lat: config.widgets.weather.lat,
        lon: config.widgets.weather.lon,
        units: config.widgets.weather.units as "metric" | "imperial",
        refreshInterval: 60000 * 30, // 30 minutes
        timezone: config.server.timezone,
      },
    };
  },
  grid: {
    w: 3,
    h: 2,
    minW: 1,
    minH: 1,
  },
  options: {
    defaultX: 0,
    defaultY: 0,
    defaultId: "weather",
  },
});

// Register Calendar
WidgetRegistry.register({
  type: "calendar",
  component: CalendarWidget,
  isEnabled: (config) => config.widgets.calendar.enabled,
  getProps: (config) => {
    return {
      config: {
        icsUrl: config.widgets.calendar.ics_urls.join(","),
        refreshInterval: 60000 * 15, // 15 minutes
        timezone: config.server.timezone,
      },
    };
  },
  grid: {
    w: 4,
    h: 4,
    minW: 1, // Allow 1x1 compact layout
    minH: 1, // Allow 1x1 compact layout
  },
  options: {
    defaultX: 3,
    defaultY: 0,
    defaultId: "calendar",
  },
});

// Register Sports (Combined)
WidgetRegistry.register({
  type: "sports",
  component: SportsWidget,
  isEnabled: (config) =>
    config.widgets.football.enabled || (config.widgets.f1?.enabled ?? false),
  getProps: (config) => {
    const common = { timezone: config.server.timezone };
    return {
      f1Config: {
        enabled: config.widgets.f1?.enabled ?? true,
        refreshInterval: 60000 * 60, // 1 hour
        ...common,
      },
      footballConfig: {
        enabled: config.widgets.football.enabled,
        leagues: ["PL", "PD", "BL1", "SA", "CL"], // Hardcoded in original dashboard.ts
        refreshInterval: 60000, // 1 minute
        ...common,
      },
    };
  },
  grid: {
    w: 3,
    h: 4,
    minW: 2,
    minH: 2,
  },
  options: {
    defaultX: 7,
    defaultY: 0,
    defaultId: "sports-combined",
  },
});

// Register Jellyfin
WidgetRegistry.register({
  type: "jellyfin",
  component: JellyfinWidget,
  isEnabled: (config) => config.widgets.jellyfin?.enabled ?? false,
  getProps: (config) => ({
    config: {
      enabled: config.widgets.jellyfin.enabled,
      url: config.widgets.jellyfin.url,
      refreshInterval: 60000 * 5, // 5 minutes
    },
  }),
  grid: {
    w: 4,
    h: 4,
    minW: 2,
    minH: 2,
  },
  options: {
    defaultX: 0,
    defaultY: 4, 
    defaultId: "jellyfin",
  },
});

// Register Immich
WidgetRegistry.register({
  type: "immich",
  component: ImmichWidget,
  isEnabled: (config) => config.widgets.immich?.enabled ?? false,
  getProps: (config) => ({
    config: {
      enabled: config.widgets.immich.enabled,
      url: config.widgets.immich.url,
      refreshInterval: 60000 * 15, // 15 minutes
    },
  }),
  grid: {
    w: 3,
    h: 2,
    minW: 1, // Allow 1x1 compact layout
    minH: 1, // Allow 1x1 compact layout
  },
  options: {
    defaultX: 4,
    defaultY: 4, 
    defaultId: "immich",
  },
});

// Register Ghostfolio
WidgetRegistry.register({
  type: "ghostfolio",
  component: GhostfolioWidget,
  isEnabled: (config) => config.widgets.ghostfolio?.enabled ?? false,
  getProps: (config) => ({
    config: {
      enabled: config.widgets.ghostfolio.enabled,
      url: config.widgets.ghostfolio.url,
      refreshInterval: 60000 * 5, // 5 minutes
      display_metrics: config.widgets.ghostfolio.display_metrics,
    },
  }),
  grid: {
    w: 3,
    h: 2,
    minW: 1, // Allow 1x1 minimal layout
    minH: 1, // Allow 1x1 minimal layout
  },
  options: {
    defaultX: 7,
    defaultY: 4,
    defaultId: "ghostfolio",
  },
});

// Register Navidrome
WidgetRegistry.register({
  type: "navidrome",
  component: NavidromeWidget,
  isEnabled: (config) => config.widgets.navidrome?.enabled ?? false,
  getProps: (config) => ({
    config: {
      enabled: config.widgets.navidrome.enabled,
      url: config.widgets.navidrome.url,
      user: config.widgets.navidrome.user,
      password: config.widgets.navidrome.password,
      refreshInterval: 30000, // 30 seconds
    },
  }),
  grid: {
    w: 3,
    h: 3, // Medium square
    minW: 2,
    minH: 2,
  },
  options: {
    defaultX: 4,
    defaultY: 6,
    defaultId: "navidrome",
  },
});

// Register qBittorrent
WidgetRegistry.register({
  type: "qbittorrent",
  component: QBittorrentWidget,
  isEnabled: (config) => config.widgets.qbittorrent?.enabled ?? false,
  getProps: (config) => ({
    config: {
      enabled: config.widgets.qbittorrent.enabled,
      url: config.widgets.qbittorrent.url,
      refreshInterval: 1000, // 1 second update
    },
  }),
  grid: {
    w: 3,
    h: 3,
    minW: 3,
    minH: 2,
  },
  options: {
    defaultX: 0,
    defaultY: 6,
    defaultId: "qbittorrent",
  },
});

// Register Individual F1 (Optional/Fallback if used directly)
WidgetRegistry.register({
  type: "f1",
  component: F1Widget,
  isEnabled: () => false, // Disabled by default in favor of combined sports widget
  getProps: (config) => ({
    config: {
      enabled: config.widgets.f1?.enabled ?? true,
      refreshInterval: 60000 * 60,
      timezone: config.server.timezone,
    },
  }),
  grid: { w: 3, h: 2 },
});

// Register Individual Football (Optional/Fallback if used directly)
WidgetRegistry.register({
  type: "football",
  component: FootballWidget,
  isEnabled: () => false, // Disabled by default in favor of combined sports widget
  getProps: (config) => ({
    config: {
      enabled: config.widgets.football.enabled,
      leagues: ["PL", "PD", "BL1", "SA", "CL"],
      refreshInterval: 60000,
      timezone: config.server.timezone,
    },
  }),
  grid: { w: 3, h: 2 },
});
