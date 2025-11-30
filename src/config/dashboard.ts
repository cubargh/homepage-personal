import { DashboardConfig, WidgetConfig } from "@/types";
import { loadConfig } from "@/lib/config";
import { WidgetRegistry } from "@/lib/widget-registry";
import "@/config/widgets"; // Register widgets

export const getDashboardConfig = (): DashboardConfig => {
  const config = loadConfig();

  const services = config.widgets.service_status?.services || [];

  // Debug: Log if services are empty to help diagnose
  if (!services || services.length === 0) {
    console.warn("DashboardConfig: No services found in config.yaml");
  }

  const ROOT_DOMAIN = config.server.root_domain;
  const TIMEZONE = config.server.timezone;

  if (!ROOT_DOMAIN) {
    console.warn(
      "server.root_domain is not set in config. Services URLs will be invalid."
    );
  }

  const enabledWidgets: WidgetConfig[] = [];

  WidgetRegistry.getAll().forEach((def) => {
    if (def.isEnabled(config)) {
      console.log(`${def.type} widget enabled`);
      enabledWidgets.push({
        id: def.options?.defaultId || def.type,
        type: def.type,
        x: def.options?.defaultX ?? 0,
        y: def.options?.defaultY ?? 0,
        colSpan: def.grid.w,
        rowSpan: def.grid.h,
        props: def.getProps(config),
      });
    }
  });

  return {
    timezone: TIMEZONE,
    debug: config.server.debug,
    widgets: enabledWidgets,
  };
};
