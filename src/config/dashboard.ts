import { DashboardConfig, WidgetConfig } from "@/types";
import { loadConfig, AppConfig } from "@/lib/config";
import { WidgetRegistry } from "@/lib/widget-registry";
import "@/config/widgets"; // Register widgets

// Helper function to normalize widget configs to arrays
function normalizeWidgetConfig<T>(config: T | T[] | undefined): T[] {
  if (!config) return [];
  return Array.isArray(config) ? config : [config];
}

// Map widget types to config keys (for widgets where they differ)
const WIDGET_TYPE_TO_CONFIG_KEY: Record<string, keyof AppConfig["widgets"]> = {
  "service-monitor": "service_status",
  "ip-camera": "ip_camera",
  "speedtest-tracker": "speedtest_tracker",
};

// Helper function to get widget config by type
function getWidgetConfig<T>(
  config: AppConfig,
  widgetType: string
): T | T[] | undefined {
  // Map widget type to config key if needed
  const configKey = WIDGET_TYPE_TO_CONFIG_KEY[widgetType] || widgetType;
  return config.widgets[configKey as keyof AppConfig["widgets"]] as T | T[] | undefined;
}

export const getDashboardConfig = (): DashboardConfig => {
  const config = loadConfig();

  const ROOT_DOMAIN = config.server.root_domain;
  const TIMEZONE = config.server.timezone;

  if (!ROOT_DOMAIN) {
    console.warn(
      "server.root_domain is not set in config. Services URLs will be invalid."
    );
  }

  const enabledWidgets: WidgetConfig[] = [];

  WidgetRegistry.getAll().forEach((def) => {
    // Map widget type to config key if needed
    const configKey = WIDGET_TYPE_TO_CONFIG_KEY[def.type] || def.type;
    
    // Get the widget config (can be single object or array)
    const widgetConfigs = normalizeWidgetConfig(
      getWidgetConfig(config, def.type)
    );

    // Process each widget instance
    widgetConfigs.forEach((widgetConfig: any, index: number) => {
      // Check if this instance is enabled
      if (widgetConfig?.enabled) {
        // Create a modified config with only this widget instance
        // This ensures getProps() receives a config with a single widget instance
        const instanceConfig: AppConfig = {
          ...config,
          widgets: {
            ...config.widgets,
            [configKey]: widgetConfig, // Use config key, not widget type
          },
        };

        // Generate unique ID for this instance
        const baseId = def.options?.defaultId || def.type;
        const instanceId =
          widgetConfigs.length > 1 ? `${baseId}-${index}` : baseId;

        console.log(`${def.type} widget enabled (id: ${instanceId})`);

        // Check if widget is enabled using the instance config
        if (def.isEnabled(instanceConfig)) {
          enabledWidgets.push({
            id: instanceId,
            type: def.type,
            x: def.options?.defaultX ?? 0,
            y: def.options?.defaultY ?? 0,
            colSpan: def.grid.w,
            rowSpan: def.grid.h,
            props: def.getProps(instanceConfig),
          });
        }
      }
    });
  });

  return {
    timezone: TIMEZONE,
    debug: config.server.debug,
    widgets: enabledWidgets,
  };
};
