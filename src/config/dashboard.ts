import { DashboardConfig, WidgetConfig } from "@/types";
import { loadConfig, AppConfig } from "@/lib/config";
import { WidgetRegistry } from "@/lib/widget-registry";
import { normalizeWidgetConfig } from "@/lib/widget-config-utils";
import "@/config/widgets"; // Register widgets

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
    // Get config key from the widget definition (auto-derived or explicitly set)
    const configKey = def.configKey;

    // Get the widget config (can be single object or array)
    const widgetConfigs = normalizeWidgetConfig(
      config.widgets[configKey] as { enabled: boolean } | { enabled: boolean }[] | undefined
    );

    // Process each widget instance
    widgetConfigs.forEach((widgetConfig, index) => {
      // Check if this instance is enabled
      if (widgetConfig?.enabled) {
        // Create a modified config with only this widget instance
        // This ensures getProps() receives a config with a single widget instance
        const instanceConfig: AppConfig = {
          ...config,
          widgets: {
            ...config.widgets,
            [configKey]: widgetConfig,
          },
        };

        // Generate unique ID for this instance
        const baseId = def.defaults.id || def.type;
        const instanceId =
          widgetConfigs.length > 1 ? `${baseId}-${index}` : baseId;

        console.log(`${def.type} widget enabled (id: ${instanceId})`);

        // Check if widget is enabled using the instance config
        if (def.isEnabled(instanceConfig)) {
          enabledWidgets.push({
            id: instanceId,
            type: def.type,
            x: def.defaults.x ?? 0,
            y: def.defaults.y ?? 0,
            colSpan: def.grid.w,
            rowSpan: def.grid.h,
            props: def.getProps(instanceConfig) as Record<string, unknown>,
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
