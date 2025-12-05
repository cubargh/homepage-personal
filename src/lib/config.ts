import yaml from "js-yaml";
import fs from "fs";
import path from "path";

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

export interface SpotlightConfig {
  search_engine?: "google" | "duckduckgo" | "bing" | "custom";
  custom_search_url?: string; // For custom search engine, e.g., "https://example.com/search?q="
  fuzzy_search?: boolean; // Enable fuzzy search for better matching (default: false)
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
    speedtest_tracker: SpeedtestTrackerWidgetConfig | SpeedtestTrackerWidgetConfig[];
  };
}

// Re-export widget config utilities for convenience
export {
  normalizeWidgetConfig,
  getFirstEnabledWidgetConfig,
} from "./widget-config-utils";

// let configCache: AppConfig | null = null;

export function loadConfig(): AppConfig {
  // if (configCache) {
  //   return configCache;
  // }

  const configPath =
    process.env.CONFIG_FILE || path.join(process.cwd(), "config.yaml");

  try {
    if (!fs.existsSync(configPath)) {
      // Fallback to example if no config exists in dev, or just throw
      const examplePath = path.join(process.cwd(), "config.example.yaml");
      if (
        process.env.NODE_ENV === "development" &&
        fs.existsSync(examplePath)
      ) {
        console.warn(
          `Config file not found at ${configPath}. Loading config.example.yaml for development.`
        );
        const fileContents = fs.readFileSync(examplePath, "utf8");
        const config = yaml.load(fileContents) as AppConfig;
        // configCache = config;
        return config;
      }
      throw new Error(`Config file not found at ${configPath}`);
    }

    const fileContents = fs.readFileSync(configPath, "utf8");
    const config = yaml.load(fileContents) as AppConfig;

    // configCache = config;
    return config;
  } catch (e) {
    console.error(`Failed to load config from ${configPath}`, e);
    throw e;
  }
}
