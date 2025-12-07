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

