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
import { IPCameraWidget } from "@/components/dashboard/ip-camera-widget";
import { RSSWidget } from "@/components/dashboard/rss-widget";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import type { ServiceStatusWidgetConfig } from "@/lib/config";

// Register Service Monitor
WidgetRegistry.register({
  type: "service-monitor",
  component: ServiceWidget,
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.service_status);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.service_status) as ServiceStatusWidgetConfig | undefined;
    return {
      services: widgetConfig?.services || [],
      config: {
        refreshInterval: 60000, // 1 minute
        columns: widgetConfig?.columns ?? 2,
        rows: widgetConfig?.rows ?? "auto",
        compactMode: widgetConfig?.compactMode ?? false,
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
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.shortcuts);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.shortcuts);
    return {
      shortcuts: widgetConfig?.shortcuts || [],
      config: {
        columns: widgetConfig?.columns ?? 2,
        rows: widgetConfig?.rows ?? "auto",
        compactMode: widgetConfig?.compactMode ?? false,
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
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.weather);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.weather);
    if (!widgetConfig) {
      throw new Error("Weather widget config not found");
    }
    return {
      config: {
        lat: widgetConfig.lat,
        lon: widgetConfig.lon,
        units: widgetConfig.units as "metric" | "imperial",
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
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.calendar);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.calendar);
    if (!widgetConfig) {
      throw new Error("Calendar widget config not found");
    }
    return {
      config: {
        icsUrl: widgetConfig.ics_urls.join(","),
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
  isEnabled: (config) => {
    const sportsConfig = getFirstEnabledWidgetConfig(config.widgets.sports);
    if (sportsConfig?.enabled) {
      // Verify at least one sub-widget is enabled
      const f1Enabled = sportsConfig.f1?.enabled ?? false;
      const footballEnabled = sportsConfig.football?.enabled ?? false;
      const padelEnabled = sportsConfig.padel?.enabled ?? false;
      return f1Enabled || footballEnabled || padelEnabled;
    }
    // Backward compatibility: check old f1/football configs
    const footballConfig = getFirstEnabledWidgetConfig(config.widgets.football);
    const f1Config = getFirstEnabledWidgetConfig(config.widgets.f1);
    return (footballConfig?.enabled ?? false) || (f1Config?.enabled ?? false);
  },
  getProps: (config) => {
    const common = { timezone: config.server.timezone };
    const sportsConfig = getFirstEnabledWidgetConfig(config.widgets.sports);
    
    // Use new sports config if available
    if (sportsConfig?.enabled) {
      const f1Enabled = sportsConfig.f1?.enabled ?? false;
      const footballEnabled = sportsConfig.football?.enabled ?? false;
      const padelEnabled = sportsConfig.padel?.enabled ?? false;
      
      return {
        f1Config: {
          enabled: f1Enabled,
          refreshInterval: 60000 * 60, // 1 hour
          ...common,
        },
        footballConfig: {
          enabled: footballEnabled,
          api_key: sportsConfig.football?.api_key || "",
          leagues: ["PL", "PD", "BL1", "SA", "CL"],
          refreshInterval: 60000, // 1 minute
          ...common,
        },
        padelConfig: {
          enabled: padelEnabled,
          refreshInterval: 60000 * 5, // 5 minutes
          ...common,
        },
      };
    }
    
    // Backward compatibility: use old f1/football configs
    const f1Config = getFirstEnabledWidgetConfig(config.widgets.f1);
    const footballConfig = getFirstEnabledWidgetConfig(config.widgets.football);
    return {
      f1Config: {
        enabled: f1Config?.enabled ?? false,
        refreshInterval: 60000 * 60, // 1 hour
        ...common,
      },
      footballConfig: {
        enabled: footballConfig?.enabled ?? false,
        api_key: footballConfig?.api_key || "",
        leagues: ["PL", "PD", "BL1", "SA", "CL"], // Hardcoded in original dashboard.ts
        refreshInterval: 60000, // 1 minute
        ...common,
      },
      padelConfig: {
        enabled: false,
        refreshInterval: 60000 * 5, // 5 minutes
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
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.jellyfin);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.jellyfin);
    if (!widgetConfig) {
      throw new Error("Jellyfin widget config not found");
    }
    return {
      config: {
        enabled: widgetConfig.enabled,
        url: widgetConfig.url,
        refreshInterval: 60000 * 5, // 5 minutes
      },
    };
  },
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
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.immich);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.immich);
    if (!widgetConfig) {
      throw new Error("Immich widget config not found");
    }
    return {
      config: {
        enabled: widgetConfig.enabled,
        url: widgetConfig.url,
        refreshInterval: 60000 * 15, // 15 minutes
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
    defaultX: 4,
    defaultY: 4, 
    defaultId: "immich",
  },
});

// Register Ghostfolio
WidgetRegistry.register({
  type: "ghostfolio",
  component: GhostfolioWidget,
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.ghostfolio);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.ghostfolio);
    if (!widgetConfig) {
      throw new Error("Ghostfolio widget config not found");
    }
    return {
      config: {
        enabled: widgetConfig.enabled,
        url: widgetConfig.url,
        refreshInterval: 60000 * 5, // 5 minutes
        display_metrics: widgetConfig.display_metrics,
      },
    };
  },
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
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.navidrome);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.navidrome);
    if (!widgetConfig) {
      throw new Error("Navidrome widget config not found");
    }
    return {
      config: {
        enabled: widgetConfig.enabled,
        url: widgetConfig.url,
        user: widgetConfig.user,
        password: widgetConfig.password,
        refreshInterval: 30000, // 30 seconds
      },
    };
  },
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

// Register IP Camera
WidgetRegistry.register({
  type: "ip-camera",
  component: IPCameraWidget,
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.ip_camera);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.ip_camera);
    return {
      cameras: widgetConfig?.cameras || [],
      config: {
        refreshInterval: 1000, // 1 second (for image refresh)
      },
    };
  },
  grid: {
    w: 3,
    h: 3,
    minW: 1, // Allow 1x1 compact layout
    minH: 1, // Allow 1x1 compact layout
  },
  options: {
    defaultX: 0,
    defaultY: 8,
    defaultId: "ip-camera",
  },
});

// Register RSS Feed Reader
WidgetRegistry.register({
  type: "rss",
  component: RSSWidget,
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.rss);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.rss);
    return {
      config: {
        refreshInterval: (widgetConfig?.refreshInterval || 300) * 1000, // Convert seconds to milliseconds
        view: widgetConfig?.view || "full",
        wrap: widgetConfig?.wrap ?? true, // Default to true for wrapping
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
    defaultX: 0,
    defaultY: 11,
    defaultId: "rss",
  },
});

// Register qBittorrent
WidgetRegistry.register({
  type: "qbittorrent",
  component: QBittorrentWidget,
  isEnabled: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.qbittorrent);
    return widgetConfig?.enabled ?? false;
  },
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.qbittorrent);
    if (!widgetConfig) {
      throw new Error("qBittorrent widget config not found");
    }
    return {
      config: {
        enabled: widgetConfig.enabled,
        url: widgetConfig.url,
        refreshInterval: 1000, // 1 second update
      },
    };
  },
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
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.f1);
    return {
      config: {
        enabled: widgetConfig?.enabled ?? true,
        refreshInterval: 60000 * 60,
        timezone: config.server.timezone,
      },
    };
  },
  grid: { w: 3, h: 2 },
});

// Register Individual Football (Optional/Fallback if used directly)
WidgetRegistry.register({
  type: "football",
  component: FootballWidget,
  isEnabled: () => false, // Disabled by default in favor of combined sports widget
  getProps: (config) => {
    const widgetConfig = getFirstEnabledWidgetConfig(config.widgets.football);
    if (!widgetConfig) {
      throw new Error("Football widget config not found");
    }
    return {
      config: {
        enabled: widgetConfig.enabled,
        leagues: ["PL", "PD", "BL1", "SA", "CL"],
        refreshInterval: 60000,
        timezone: config.server.timezone,
      },
    };
  },
  grid: { w: 3, h: 2 },
});
