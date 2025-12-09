import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { validateConfig } from "./config-validation";

// Base widget config types
export interface WeatherWidgetConfig {
  enabled: boolean;
  lat: number;
  lon: number;
  api_key: string;
  units: string;
}

export interface SportsWidgetConfig {
  enabled: boolean;
  f1?: {
    enabled: boolean;
  };
  football?: {
    enabled: boolean;
    api_key: string;
  };
  padel?: {
    enabled: boolean;
    api_token: string;
  };
}

// Keep old interfaces for backward compatibility (deprecated)
export interface FootballWidgetConfig {
  enabled: boolean;
  api_key: string;
}

export interface F1WidgetConfig {
  enabled: boolean;
}

export interface CalendarWidgetConfig {
  enabled: boolean;
  ics_urls: string[];
}

export interface ServiceStatusWidgetConfig {
  enabled: boolean;
  columns: number | "auto";
  rows?: number | "auto";
  compactMode?: boolean;
  click_behavior?: "new_tab" | "same_tab";
  services: {
    name: string;
    url: string;
    icon?: string;
  }[];
}

export interface ShortcutsWidgetConfig {
  enabled: boolean;
  columns: number | "auto";
  rows?: number | "auto";
  compactMode?: boolean;
  click_behavior?: "new_tab" | "same_tab";
  shortcuts: {
    name: string;
    url: string;
    icon?: string;
  }[];
}

export interface IPCameraWidgetConfig {
  enabled: boolean;
  cameras: {
    name: string;
    url: string;
  }[];
}

export interface RSSWidgetConfig {
  enabled: boolean;
  feeds: string[];
  refreshInterval?: number;
  maxItems?: number;
  view?: "full" | "concise" | "minimal";
  wrap?: boolean;
}

export interface JellyfinWidgetConfig {
  enabled: boolean;
  url: string;
  api_key: string;
  user_name: string;
}

export interface ImmichWidgetConfig {
  enabled: boolean;
  url: string;
  api_key: string;
}

export interface GhostfolioWidgetConfig {
  enabled: boolean;
  url: string;
  public_token: string;
  display_metrics?: string[];
}

export interface NavidromeWidgetConfig {
  enabled: boolean;
  url: string;
  user: string;
  password: string;
}

export interface QBittorrentWidgetConfig {
  enabled: boolean;
  url: string;
  user?: string;
  password?: string;
}

export interface SpeedtestTrackerWidgetConfig {
  enabled: boolean;
  url: string;
  api_token: string;
}

export interface TasksWidgetConfig {
  enabled: boolean;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  tasklist_id?: string; // Optional: specific task list ID, defaults to "@default" (My Tasks)
}

export interface ClockWidgetConfig {
  enabled: boolean;
  // 12-hour format (with AM/PM) or 24-hour format
  // Options: "12h" | "24h"
  // Default: "24h"
  format?: "12h" | "24h";
  // Show seconds in time display
  // Default: true
  showSeconds?: boolean;
  // Show date below time
  // Default: true
  showDate?: boolean;
  // Show day of week
  // Default: true (only in standard layout)
  showDay?: boolean;
}

export interface BeszelWidgetConfig {
  enabled: boolean;
  url: string;
  collection?: string; // Optional, deprecated - always uses "system_stats" collection
  auth: {
    type: "token" | "email";
    token?: string;
    email?: string;
    password?: string;
  };
  refreshInterval?: number; // seconds
  display_metrics?: string[];
  disk_names?: Record<string, string>; // Optional: map disk names to display names (e.g., { "sda1": "System Disk", "sda2": "Data Disk" })
  server_name?: string;
  network_interface?: string; // Optional: specific network interface to use for network stats (e.g., "wlp0s20f3")
  compact_view?: boolean; // If true, shows inline compact view with all metrics in a single row
}

export interface SearchProvider {
  name: string;
  url: string; // Should contain {query} placeholder, e.g., "https://www.google.com/search?q={query}"
  icon?: string; // Icon name from selfh.st/icons or full URL
}

export interface SpotlightConfig {
  // New format: array of search providers
  search_providers?: SearchProvider[];
  // Legacy format: single search engine (deprecated, kept for backward compatibility)
  search_engine?: "google" | "duckduckgo" | "bing" | "custom";
  custom_search_url?: string; // For custom search engine, e.g., "https://example.com/search?q="
  fuzzy_search?: boolean; // Enable fuzzy search for better matching (default: false)
  history_size?: number; // Number of URLs to remember in history (default: 20)
}

export interface ThemeConfig {
  // Grid background color (the background behind widgets)
  grid_background?: string;

  // Card background color (widget cards)
  card_background?: string;

  // Accent color (primary brand color, used for icons, links, interactive elements, highlights, grid lines, etc.)
  accent?: string;

  // Border color (widget borders, dividers)
  border?: string;

  // Text/foreground color
  foreground?: string;

  // Muted text color (secondary text)
  muted_foreground?: string;

  // Widget corner radius (e.g., "0.5rem", "8px", "0" for square corners)
  widget_corner_radius?: string;
}

export interface AppConfig {
  server: {
    root_domain: string;
    timezone: string;
    debug?: boolean;
    auth: {
      enabled?: boolean;
      passphrase: string;
      session_days: number;
    };
  };
  // Page title and favicon configuration
  page?: {
    title?: string; // Browser tab title (default: "Personal Dashboard")
    favicon?: string; // Path to favicon file (relative to public/) or full URL (default: "/favicon.ico")
  };
  spotlight?: SpotlightConfig;
  theme?: ThemeConfig;
  widgets: {
    weather: WeatherWidgetConfig | WeatherWidgetConfig[];
    sports: SportsWidgetConfig | SportsWidgetConfig[];
    // Deprecated: Use sports.f1 and sports.football instead
    football?: FootballWidgetConfig | FootballWidgetConfig[];
    f1?: F1WidgetConfig | F1WidgetConfig[];
    calendar: CalendarWidgetConfig | CalendarWidgetConfig[];
    service_status: ServiceStatusWidgetConfig | ServiceStatusWidgetConfig[];
    shortcuts: ShortcutsWidgetConfig | ShortcutsWidgetConfig[];
    ip_camera: IPCameraWidgetConfig | IPCameraWidgetConfig[];
    rss: RSSWidgetConfig | RSSWidgetConfig[];
    jellyfin: JellyfinWidgetConfig | JellyfinWidgetConfig[];
    immich: ImmichWidgetConfig | ImmichWidgetConfig[];
    ghostfolio: GhostfolioWidgetConfig | GhostfolioWidgetConfig[];
    navidrome: NavidromeWidgetConfig | NavidromeWidgetConfig[];
    qbittorrent: QBittorrentWidgetConfig | QBittorrentWidgetConfig[];
    speedtest_tracker:
      | SpeedtestTrackerWidgetConfig
      | SpeedtestTrackerWidgetConfig[];
    tasks: TasksWidgetConfig | TasksWidgetConfig[];
    clock: ClockWidgetConfig | ClockWidgetConfig[];
    beszel: BeszelWidgetConfig | BeszelWidgetConfig[];
  };
}

// Re-export widget config utilities for convenience
export {
  normalizeWidgetConfig,
  getFirstEnabledWidgetConfig,
} from "./widget-config-utils";

let configCache: AppConfig | null = null;
let configCacheTime: number = 0;
let configPath: string | null = null;
let isWatching = false;

function getConfigPath(): string {
  return process.env.CONFIG_FILE || path.join(process.cwd(), "config.yaml");
}

function loadConfigFromFile(filePath: string): AppConfig {
  if (!fs.existsSync(filePath)) {
    // Fallback to example if no config exists in dev, or just throw
    const examplePath = path.join(process.cwd(), "config.example.yaml");
    if (process.env.NODE_ENV === "development" && fs.existsSync(examplePath)) {
      console.warn(
        `Config file not found at ${filePath}. Loading config.example.yaml for development.`
      );
      const fileContents = fs.readFileSync(examplePath, "utf8");
      const config = yaml.load(fileContents) as AppConfig;
      // Validate config in development
      if (process.env.NODE_ENV === "development") {
        try {
          return validateConfig(config);
        } catch (e) {
          console.warn("Config validation warning:", e);
          return config;
        }
      }
      return config;
    }
    throw new Error(`Config file not found at ${filePath}`);
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const config = yaml.load(fileContents) as AppConfig;

  // Validate config
  try {
    return validateConfig(config);
  } catch (e) {
    // In production, log error but don't fail
    if (process.env.NODE_ENV === "production") {
      console.error("Config validation error:", e);
      return config;
    }
    // In development, throw to help catch issues early
    throw e;
  }
}

function setupFileWatcher(filePath: string) {
  if (isWatching || process.env.NODE_ENV === "production") {
    return;
  }

  try {
    fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log(`Config file changed, clearing cache: ${filePath}`);
        configCache = null;
        configCacheTime = 0;
      }
    });
    isWatching = true;
  } catch (error) {
    // File watching may fail in some environments, continue without it
    console.warn("Failed to set up config file watcher:", error);
  }
}

export function loadConfig(): AppConfig {
  const currentConfigPath = getConfigPath();
  const cacheMaxAge = process.env.NODE_ENV === "production" ? 60000 : 0; // 1 minute in production, no cache in dev

  // Check if cache is valid
  if (
    configCache &&
    configPath === currentConfigPath &&
    (cacheMaxAge === 0 || Date.now() - configCacheTime < cacheMaxAge)
  ) {
    return configCache;
  }

  // Setup file watcher in development
  if (
    process.env.NODE_ENV === "development" &&
    configPath !== currentConfigPath
  ) {
    setupFileWatcher(currentConfigPath);
  }

  try {
    const config = loadConfigFromFile(currentConfigPath);
    configCache = config;
    configCacheTime = Date.now();
    configPath = currentConfigPath;
    return config;
  } catch (e) {
    console.error(`Failed to load config from ${currentConfigPath}`, e);
    throw e;
  }
}

// Function to clear cache manually if needed
export function clearConfigCache(): void {
  configCache = null;
  configCacheTime = 0;
}
