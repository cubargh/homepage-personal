import React from "react";
import { AppConfig } from "@/lib/config";
import { WidgetType, GridSize } from "@/types";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";

// ============================================================================
// Types
// ============================================================================

export interface GridConfig {
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface WidgetDefaults {
  x?: number;
  y?: number;
  id?: string;
}

/**
 * Full widget definition used internally by the registry
 */
export interface WidgetDefinition<TProps = unknown> {
  type: WidgetType;
  configKey: keyof AppConfig["widgets"];
  component: React.ComponentType<TProps & { gridSize?: GridSize }>;
  isEnabled: (config: AppConfig) => boolean;
  getProps: (config: AppConfig) => TProps;
  grid: GridConfig;
  defaults: WidgetDefaults;
}

/**
 * Simplified widget definition for use with defineWidget()
 */
export interface SimpleWidgetDefinition<TProps, TConfig extends { enabled: boolean }> {
  /** Widget type identifier */
  type: WidgetType;
  /** Override config key if it differs from auto-derived key */
  configKey?: keyof AppConfig["widgets"];
  /** React component to render */
  component: React.ComponentType<TProps & { gridSize?: GridSize }>;
  /** Transform widget config to component props */
  getProps: (widgetConfig: TConfig, appConfig: AppConfig) => TProps;
  /** Optional custom enabled check (defaults to widgetConfig.enabled) */
  isEnabled?: (widgetConfig: TConfig, appConfig: AppConfig) => boolean;
  /** Grid dimensions */
  grid: GridConfig;
  /** Default position and ID */
  defaults?: WidgetDefaults;
}

// ============================================================================
// Config Key Derivation
// ============================================================================

/**
 * Special mappings for widget types that don't follow the standard conversion
 */
const CONFIG_KEY_OVERRIDES: Partial<Record<WidgetType, keyof AppConfig["widgets"]>> = {
  "service-monitor": "service_status",
};

/**
 * Derive config key from widget type
 *
 * Standard conversion: kebab-case → snake_case (e.g., "ip-camera" → "ip_camera")
 * Special cases are handled via CONFIG_KEY_OVERRIDES
 */
export function deriveConfigKey(widgetType: WidgetType): keyof AppConfig["widgets"] {
  // Check for special mappings first
  if (CONFIG_KEY_OVERRIDES[widgetType]) {
    return CONFIG_KEY_OVERRIDES[widgetType]!;
  }

  // Convert kebab-case to snake_case
  const snakeCase = widgetType.replace(/-/g, "_");
  return snakeCase as keyof AppConfig["widgets"];
}

// ============================================================================
// Widget Definition Factory
// ============================================================================

/**
 * Factory function to create widget definitions with reduced boilerplate
 *
 * Auto-generates:
 * - isEnabled() from widgetConfig.enabled (unless custom provided)
 * - configKey from widget type (unless overridden)
 * - Full WidgetDefinition compatible with the registry
 *
 * @example
 * ```ts
 * defineWidget<ImmichWidgetProps, ImmichWidgetConfig>({
 *   type: "immich",
 *   component: ImmichWidget,
 *   getProps: (cfg) => ({
 *     config: {
 *       enabled: cfg.enabled,
 *       url: cfg.url,
 *       refreshInterval: REFRESH_INTERVALS.SLOW,
 *     },
 *   }),
 *   grid: { w: 3, h: 2, minW: 1, minH: 1 },
 *   defaults: { x: 4, y: 4, id: "immich" },
 * });
 * ```
 */
export function defineWidget<TProps, TConfig extends { enabled: boolean }>(
  definition: SimpleWidgetDefinition<TProps, TConfig>
): void {
  const {
    type,
    configKey: explicitConfigKey,
    component,
    getProps,
    isEnabled: customIsEnabled,
    grid,
    defaults = {},
  } = definition;

  // Derive or use explicit config key
  const configKey = explicitConfigKey ?? deriveConfigKey(type);

  // Create the full widget definition
  const fullDefinition: WidgetDefinition<TProps> = {
    type,
    configKey,
    component,
    grid,
    defaults,

    isEnabled: (appConfig: AppConfig) => {
      const widgetConfig = getFirstEnabledWidgetConfig(
        appConfig.widgets[configKey] as TConfig | TConfig[] | undefined
      );

      if (!widgetConfig) return false;

      // Use custom isEnabled if provided, otherwise check enabled flag
      if (customIsEnabled) {
        return customIsEnabled(widgetConfig, appConfig);
      }

      return widgetConfig.enabled ?? false;
    },

    getProps: (appConfig: AppConfig) => {
      const widgetConfig = getFirstEnabledWidgetConfig(
        appConfig.widgets[configKey] as TConfig | TConfig[] | undefined
      );

      if (!widgetConfig) {
        throw new Error(`Widget config not found for ${type}`);
      }

      return getProps(widgetConfig, appConfig);
    },
  };

  // Register the widget (cast needed due to generic type variance)
  WidgetRegistry.register(fullDefinition as WidgetDefinition);
}

// ============================================================================
// Widget Registry
// ============================================================================

export class WidgetRegistry {
  private static widgets: Map<WidgetType, WidgetDefinition> = new Map();

  static register(definition: WidgetDefinition) {
    this.widgets.set(definition.type, definition);
  }

  static get(type: WidgetType): WidgetDefinition | undefined {
    return this.widgets.get(type);
  }

  static getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  static getConfigKey(type: WidgetType): keyof AppConfig["widgets"] | undefined {
    return this.widgets.get(type)?.configKey;
  }
}
