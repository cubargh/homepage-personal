import { z } from "zod";
import { AppConfig } from "./config";

const WeatherWidgetConfigSchema = z.object({
  enabled: z.boolean(),
  lat: z.number(),
  lon: z.number(),
  api_key: z.string().min(1),
  units: z.string(),
});

const SportsWidgetConfigSchema = z.object({
  enabled: z.boolean(),
  f1: z
    .object({
      enabled: z.boolean(),
    })
    .optional(),
  football: z
    .object({
      enabled: z.boolean(),
      api_key: z.string().min(1),
    })
    .optional(),
  padel: z
    .object({
      enabled: z.boolean(),
      api_token: z.string().min(1),
    })
    .optional(),
});

const CalendarWidgetConfigSchema = z.object({
  enabled: z.boolean(),
  ics_urls: z.array(z.string()),
});

const ServiceStatusWidgetConfigSchema = z.object({
  enabled: z.boolean(),
  columns: z.union([z.number(), z.literal("auto")]),
  rows: z.union([z.number(), z.literal("auto")]).optional(),
  compactMode: z.boolean().optional(),
  click_behavior: z.enum(["new_tab", "same_tab"]).optional(),
  services: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
      icon: z.string().optional(),
    })
  ),
});

const BeszelWidgetConfigSchema = z.object({
  enabled: z.boolean(),
  url: z.string().url(),
  collection: z.string().min(1).optional(), // Optional, deprecated - always uses "system_stats" collection
  auth: z
    .object({
      type: z.enum(["token", "email"]),
      token: z.string().optional(),
      email: z.string().email().optional(),
      password: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.type === "token") {
          return !!data.token;
        }
        if (data.type === "email") {
          return !!data.email && !!data.password;
        }
        return false;
      },
      {
        message: "Token auth requires 'token', email auth requires 'email' and 'password'",
      }
    ),
  refreshInterval: z.number().optional(),
  display_metrics: z.array(z.string()).optional(),
  disk_names: z.record(z.string(), z.string()).optional(), // Optional: map disk names to display names
  server_name: z.string().optional(),
  network_interface: z.string().optional(), // Optional: specific network interface to use for network stats
  compact_view: z.boolean().optional(), // If true, shows inline compact view with all metrics in a single row
});

const AppConfigSchema = z.object({
  server: z.object({
    root_domain: z.string(),
    timezone: z.string(),
    debug: z.boolean().optional(),
    auth: z.object({
      enabled: z.boolean().optional(),
      passphrase: z.string(),
      session_days: z.number(),
    }),
  }),
  page: z
    .object({
      title: z.string().optional(),
      favicon: z.string().optional(),
    })
    .optional(),
  spotlight: z
    .object({
      search_providers: z
        .array(
          z.object({
            name: z.string(),
            url: z.string(),
            icon: z.string().optional(),
          })
        )
        .optional(),
      fuzzy_search: z.boolean().optional(),
    })
    .optional(),
      theme: z
        .object({
          grid_background: z.string().optional(),
          card_background: z.string().optional(),
          accent: z.string().optional(),
          border: z.string().optional(),
          foreground: z.string().optional(),
          muted_foreground: z.string().optional(),
          widget_corner_radius: z.string().optional(),
        })
        .optional(),
  widgets: z.object({
    weather: z.union([WeatherWidgetConfigSchema, z.array(WeatherWidgetConfigSchema)]),
    sports: z.union([SportsWidgetConfigSchema, z.array(SportsWidgetConfigSchema)]),
    calendar: z.union([
      CalendarWidgetConfigSchema,
      z.array(CalendarWidgetConfigSchema),
    ]),
    service_status: z.union([
      ServiceStatusWidgetConfigSchema,
      z.array(ServiceStatusWidgetConfigSchema),
    ]),
    beszel: z.union([
      BeszelWidgetConfigSchema,
      z.array(BeszelWidgetConfigSchema),
    ]).optional(),
  }).passthrough(), // Allow other widget configs
});

export function validateConfig(config: unknown): AppConfig {
  try {
    return AppConfigSchema.parse(config) as AppConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      throw new Error(
        `Config validation failed:\n${errors.map((e) => `  ${e.path}: ${e.message}`).join("\n")}`
      );
    }
    throw error;
  }
}

