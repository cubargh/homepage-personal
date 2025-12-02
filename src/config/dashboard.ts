import { DashboardConfig, WidgetConfig } from "@/types";
import { loadConfig, AppConfig } from "@/lib/config";
import { WidgetRegistry } from "@/lib/widget-registry";
import "@/config/widgets"; // Register widgets

// Helper function to normalize widget configs to arrays
function normalizeWidgetConfig<T>(config: T | T[] | undefined): T[] {
  if (!config) return [];
  return Array.isArray(config) ? config : [config];
}

// Helper function to get widget config by type
function getWidgetConfig<T>(
  config: AppConfig,
  widgetType: keyof AppConfig["widgets"]
): T | T[] | undefined {
  return config.widgets[widgetType] as T | T[] | undefined;
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
    // Get the widget config (can be single object or array)
    const widgetConfigs = normalizeWidgetConfig(
      getWidgetConfig(config, def.type as keyof AppConfig["widgets"])
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
            [def.type]: widgetConfig, // Replace with single instance
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
