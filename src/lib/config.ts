import yaml from "js-yaml";
import fs from "fs";
import path from "path";

export interface AppConfig {
  server: {
    root_domain: string;
    timezone: string;
    debug?: boolean;
    auth: {
      passphrase: string;
      session_days: number;
    };
  };
  widgets: {
    weather: {
      enabled: boolean;
      lat: number;
      lon: number;
      api_key: string;
      units: string;
    };
    football: {
      enabled: boolean;
      api_key: string;
    };
    f1: {
      enabled: boolean;
    };
    calendar: {
      enabled: boolean;
      ics_urls: string[];
    };
    service_status: {
      enabled: boolean;
      columns: number | "auto"; // Number of columns for the service grid, or "auto" to calculate automatically
      rows?: number | "auto"; // Number of rows to display, or "auto" to calculate automatically (defaults to showing all)
      compactMode?: boolean; // Whether to use compact mode (icon + status only, no text)
      services: {
        name: string;
        url: string;
        icon?: string;
      }[];
    };
    shortcuts: {
      enabled: boolean;
      columns: number | "auto"; // Number of columns for the shortcuts grid, or "auto" to calculate automatically
      rows?: number | "auto"; // Number of rows to display, or "auto" to calculate automatically (defaults to "auto")
      compactMode?: boolean; // Whether to use compact mode (icon only, no text)
      shortcuts: {
        name: string;
        url: string;
        icon?: string;
      }[];
    };
    ip_camera: {
      enabled: boolean;
      cameras: {
        name: string;
        url: string; // HTTP/HTTPS or RTSP URL
      }[];
    };
    jellyfin: {
      enabled: boolean;
      url: string;
      api_key: string;
      user_name: string;
    };
    immich: {
      enabled: boolean;
      url: string;
      api_key: string;
    };
    ghostfolio: {
      enabled: boolean;
      url: string;
      public_token: string;
      display_metrics?: string[];
    };
    navidrome: {
      enabled: boolean;
      url: string;
      user: string;
      password: string;
    };
    qbittorrent: {
      enabled: boolean;
      url: string;
      user?: string;
      password?: string;
    };
  };
}

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
