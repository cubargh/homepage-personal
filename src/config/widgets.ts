/**
 * Widget Registration
 *
 * This file registers all dashboard widgets using the defineWidget factory.
 * Each widget definition is concise - the factory handles boilerplate like
 * isEnabled checks and config key derivation automatically.
 */

import { defineWidget } from "@/lib/widget-registry";
import { REFRESH_INTERVALS } from "@/config/defaults";

// Widget Components
import { ServiceWidget } from "@/components/dashboard/service-widget";
import { ShortcutsWidget } from "@/components/dashboard/shortcuts-widget";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { SportsWidget } from "@/components/dashboard/sports-widget";
import { JellyfinWidget } from "@/components/dashboard/jellyfin-widget";
import { ImmichWidget } from "@/components/dashboard/immich-widget";
import { GhostfolioWidget } from "@/components/dashboard/ghostfolio-widget";
import { NavidromeWidget } from "@/components/dashboard/navidrome-widget";
import { QBittorrentWidget } from "@/components/dashboard/qbittorrent-widget";
import { IPCameraWidget } from "@/components/dashboard/ip-camera-widget";
import { RSSWidget } from "@/components/dashboard/rss-widget";
import { SpeedtestTrackerWidget } from "@/components/dashboard/speedtest-tracker-widget";
import { TasksWidget } from "@/components/dashboard/tasks-widget";
import { ClockWidget } from "@/components/dashboard/clock-widget";
import { BeszelWidget } from "@/components/dashboard/beszel-widget";

// Config Types
import type {
  ServiceStatusWidgetConfig,
  ShortcutsWidgetConfig,
  WeatherWidgetConfig,
  CalendarWidgetConfig,
  SportsWidgetConfig,
  JellyfinWidgetConfig,
  ImmichWidgetConfig,
  GhostfolioWidgetConfig,
  NavidromeWidgetConfig,
  QBittorrentWidgetConfig,
  IPCameraWidgetConfig,
  RSSWidgetConfig,
  SpeedtestTrackerWidgetConfig,
  TasksWidgetConfig,
  ClockWidgetConfig,
  BeszelWidgetConfig,
} from "@/lib/config";

// Props Types
import type {
  ServiceWidgetProps,
  ShortcutsWidgetProps,
  WeatherWidgetProps,
  CalendarWidgetProps,
  JellyfinWidgetProps,
  ImmichWidgetProps,
  GhostfolioWidgetProps,
  NavidromeWidgetProps,
  QBittorrentWidgetProps,
  IPCameraWidgetProps,
  RSSWidgetProps,
  SpeedtestTrackerWidgetProps,
  TasksWidgetProps,
  ClockWidgetProps,
  BeszelWidgetProps,
} from "@/types";

// =============================================================================
// Service Monitor
// =============================================================================

defineWidget<ServiceWidgetProps, ServiceStatusWidgetConfig>({
  type: "service-monitor",
  component: ServiceWidget,
  getProps: (cfg) => ({
    services: cfg.services || [],
    config: {
      refreshInterval: REFRESH_INTERVALS.STANDARD,
      columns: cfg.columns ?? 2,
      rows: cfg.rows ?? "auto",
      compactMode: cfg.compactMode ?? false,
      click_behavior: cfg.click_behavior ?? "new_tab",
    },
  }),
  grid: { w: 3, h: 2, minW: 3, minH: 2 },
  defaults: { x: 0, y: 2, id: "services" },
});

// =============================================================================
// Shortcuts
// =============================================================================

defineWidget<ShortcutsWidgetProps, ShortcutsWidgetConfig>({
  type: "shortcuts",
  component: ShortcutsWidget,
  getProps: (cfg) => ({
    shortcuts: cfg.shortcuts || [],
    config: {
      shortcuts: cfg.shortcuts || [],
      columns: cfg.columns ?? 2,
      rows: cfg.rows ?? "auto",
      compactMode: cfg.compactMode ?? false,
      click_behavior: cfg.click_behavior ?? "new_tab",
    },
  }),
  grid: { w: 3, h: 2, minW: 1, minH: 1 },
  defaults: { x: 3, y: 0, id: "shortcuts" },
});

// =============================================================================
// Weather
// =============================================================================

defineWidget<WeatherWidgetProps, WeatherWidgetConfig>({
  type: "weather",
  component: WeatherWidget,
  getProps: (cfg, app) => ({
    config: {
      lat: cfg.lat,
      lon: cfg.lon,
      units: cfg.units as "metric" | "imperial",
      refreshInterval: REFRESH_INTERVALS.WEATHER,
      timezone: app.server.timezone,
    },
  }),
  grid: { w: 3, h: 2, minW: 1, minH: 1 },
  defaults: { x: 0, y: 0, id: "weather" },
});

// =============================================================================
// Calendar
// =============================================================================

defineWidget<CalendarWidgetProps, CalendarWidgetConfig>({
  type: "calendar",
  component: CalendarWidget,
  getProps: (cfg, app) => ({
    config: {
      icsUrl: cfg.ics_urls.join(","),
      refreshInterval: REFRESH_INTERVALS.CALENDAR,
      timezone: app.server.timezone,
    },
  }),
  grid: { w: 4, h: 4, minW: 1, minH: 1 },
  defaults: { x: 3, y: 0, id: "calendar" },
});

// =============================================================================
// Sports (Combined F1, Football, Padel)
// =============================================================================

interface SportsWidgetProps {
  f1Config: { enabled: boolean; refreshInterval: number; timezone: string };
  footballConfig: {
    enabled: boolean;
    api_key: string;
    leagues: string[];
    refreshInterval: number;
    timezone: string;
  };
  padelConfig: { enabled: boolean; refreshInterval: number; timezone: string };
}

defineWidget<SportsWidgetProps, SportsWidgetConfig>({
  type: "sports",
  component: SportsWidget,
  isEnabled: (cfg) => {
    // Widget is enabled if at least one sub-widget is enabled
    const f1Enabled = cfg.f1?.enabled ?? false;
    const footballEnabled = cfg.football?.enabled ?? false;
    const padelEnabled = cfg.padel?.enabled ?? false;
    return cfg.enabled && (f1Enabled || footballEnabled || padelEnabled);
  },
  getProps: (cfg, app) => ({
    f1Config: {
      enabled: cfg.f1?.enabled ?? false,
      refreshInterval: REFRESH_INTERVALS.HOURLY,
      timezone: app.server.timezone,
    },
    footballConfig: {
      enabled: cfg.football?.enabled ?? false,
      api_key: cfg.football?.api_key || "",
      leagues: ["PL", "PD", "BL1", "SA", "CL"],
      refreshInterval: REFRESH_INTERVALS.STANDARD,
      timezone: app.server.timezone,
    },
    padelConfig: {
      enabled: cfg.padel?.enabled ?? false,
      refreshInterval: REFRESH_INTERVALS.SLOW,
      timezone: app.server.timezone,
    },
  }),
  grid: { w: 3, h: 4, minW: 2, minH: 2 },
  defaults: { x: 7, y: 0, id: "sports-combined" },
});

// =============================================================================
// Jellyfin
// =============================================================================

defineWidget<JellyfinWidgetProps, JellyfinWidgetConfig>({
  type: "jellyfin",
  component: JellyfinWidget,
  getProps: (cfg) => ({
    config: {
      enabled: cfg.enabled,
      url: cfg.url,
      apiKey: cfg.api_key,
      refreshInterval: REFRESH_INTERVALS.SLOW,
    },
  }),
  grid: { w: 4, h: 4, minW: 2, minH: 2 },
  defaults: { x: 0, y: 4, id: "jellyfin" },
});

// =============================================================================
// Immich
// =============================================================================

defineWidget<ImmichWidgetProps, ImmichWidgetConfig>({
  type: "immich",
  component: ImmichWidget,
  getProps: (cfg) => ({
    config: {
      enabled: cfg.enabled,
      url: cfg.url,
      apiKey: cfg.api_key,
      refreshInterval: REFRESH_INTERVALS.CALENDAR, // 15 minutes
    },
  }),
  grid: { w: 3, h: 2, minW: 1, minH: 1 },
  defaults: { x: 4, y: 4, id: "immich" },
});

// =============================================================================
// Ghostfolio
// =============================================================================

defineWidget<GhostfolioWidgetProps, GhostfolioWidgetConfig>({
  type: "ghostfolio",
  component: GhostfolioWidget,
  getProps: (cfg) => ({
    config: {
      enabled: cfg.enabled,
      url: cfg.url,
      accessToken: cfg.public_token,
      refreshInterval: REFRESH_INTERVALS.SLOW,
      display_metrics: cfg.display_metrics,
    },
  }),
  grid: { w: 3, h: 2, minW: 1, minH: 1 },
  defaults: { x: 7, y: 4, id: "ghostfolio" },
});

// =============================================================================
// Navidrome
// =============================================================================

defineWidget<NavidromeWidgetProps, NavidromeWidgetConfig>({
  type: "navidrome",
  component: NavidromeWidget,
  getProps: (cfg) => ({
    config: {
      enabled: cfg.enabled,
      url: cfg.url,
      username: cfg.user,
      password: cfg.password,
      refreshInterval: REFRESH_INTERVALS.FAST,
    },
  }),
  grid: { w: 3, h: 3, minW: 2, minH: 2 },
  defaults: { x: 4, y: 6, id: "navidrome" },
});

// =============================================================================
// IP Camera
// =============================================================================

defineWidget<IPCameraWidgetProps, IPCameraWidgetConfig>({
  type: "ip-camera",
  component: IPCameraWidget,
  getProps: (cfg) => ({
    cameras: cfg.cameras || [],
    config: {
      enabled: cfg.enabled,
      url: cfg.cameras?.[0]?.url || "",
      refreshInterval: REFRESH_INTERVALS.REAL_TIME,
    },
  }),
  grid: { w: 3, h: 3, minW: 1, minH: 1 },
  defaults: { x: 0, y: 8, id: "ip-camera" },
});

// =============================================================================
// RSS
// =============================================================================

defineWidget<RSSWidgetProps, RSSWidgetConfig>({
  type: "rss",
  component: RSSWidget,
  getProps: (cfg, app) => ({
    config: {
      enabled: cfg.enabled,
      feeds: cfg.feeds.map((url) => ({ name: url, url })),
      refreshInterval: (cfg.refreshInterval || 300) * 1000, // Convert seconds to ms
      maxItems: cfg.maxItems,
      view: cfg.view || "full",
      wrap: cfg.wrap ?? true,
      timezone: app.server.timezone,
    },
  }),
  grid: { w: 4, h: 4, minW: 1, minH: 1 },
  defaults: { x: 0, y: 11, id: "rss" },
});

// =============================================================================
// qBittorrent
// =============================================================================

defineWidget<QBittorrentWidgetProps, QBittorrentWidgetConfig>({
  type: "qbittorrent",
  component: QBittorrentWidget,
  getProps: (cfg) => ({
    config: {
      enabled: cfg.enabled,
      url: cfg.url,
      username: cfg.user || "",
      password: cfg.password || "",
      refreshInterval: REFRESH_INTERVALS.REAL_TIME,
    },
  }),
  grid: { w: 3, h: 3, minW: 3, minH: 2 },
  defaults: { x: 0, y: 6, id: "qbittorrent" },
});

// =============================================================================
// Speedtest Tracker
// =============================================================================

defineWidget<SpeedtestTrackerWidgetProps, SpeedtestTrackerWidgetConfig>({
  type: "speedtest-tracker",
  component: SpeedtestTrackerWidget,
  getProps: (cfg) => ({
    config: {
      enabled: cfg.enabled,
      url: cfg.url,
      apiKey: cfg.api_token,
      refreshInterval: REFRESH_INTERVALS.SLOW,
    },
  }),
  grid: { w: 3, h: 2, minW: 1, minH: 1 },
  defaults: { x: 0, y: 0, id: "speedtest-tracker" },
});

// =============================================================================
// Tasks (Google Tasks)
// =============================================================================

defineWidget<TasksWidgetProps, TasksWidgetConfig>({
  type: "tasks",
  component: TasksWidget,
  getProps: (cfg, app) => ({
    config: {
      enabled: cfg.enabled,
      provider: "google",
      google: {
        clientId: cfg.client_id,
        clientSecret: cfg.client_secret,
        refreshToken: cfg.refresh_token,
      },
      refreshInterval: REFRESH_INTERVALS.SLOW,
      timezone: app.server.timezone,
    },
  }),
  grid: { w: 3, h: 4, minW: 2, minH: 2 },
  defaults: { x: 3, y: 6, id: "tasks" },
});

// =============================================================================
// Clock
// =============================================================================

defineWidget<ClockWidgetProps, ClockWidgetConfig>({
  type: "clock",
  component: ClockWidget,
  getProps: (cfg, app) => ({
    config: {
      format: cfg.format || "24h",
      showSeconds: cfg.showSeconds !== false,
      showDate: cfg.showDate !== false,
      showDay: cfg.showDay !== false,
      timezone: app.server.timezone,
    },
  }),
  grid: { w: 2, h: 2, minW: 1, minH: 1 },
  defaults: { x: 6, y: 0, id: "clock" },
});

// =============================================================================
// Beszel (Server Monitor)
// =============================================================================

defineWidget<BeszelWidgetProps, BeszelWidgetConfig>({
  type: "beszel",
  component: BeszelWidget,
  getProps: (cfg) => ({
    config: {
      enabled: cfg.enabled,
      url: cfg.url,
      auth: cfg.auth,
      refreshInterval: cfg.refreshInterval || 30,
      display_metrics: cfg.display_metrics || [
        "uptime",
        "cpu",
        "memory",
        "disk",
        "network",
        "temperature",
        "load",
      ],
      disk_names: cfg.disk_names,
      server_name: cfg.server_name,
      network_interface: cfg.network_interface,
      compact_view: cfg.compact_view || false,
    },
  }),
  grid: { w: 3, h: 3, minW: 1, minH: 1 },
  defaults: { x: 0, y: 0, id: "beszel" },
});
